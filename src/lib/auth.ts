import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Session, User as AuthUser } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "./mongodb";
import User from "@/models/User";
import Token from "@/models/Token";
import { isRole, type Role } from "@/lib/roles";
import { rateLimit, LIMITS } from "@/lib/rate-limit";

/** How long a JWT is trusted before we re-check the refresh token in Mongo. */
const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;

/** How long a refresh token stays valid. Matches the session maxAge. */
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const authOptions = {
  trustHost: true,
  session: {
    strategy: "jwt" as const,
    maxAge: REFRESH_TOKEN_TTL_MS / 1000, // 7 days
  },
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: AuthUser }): Promise<JWT> {
      // First call after a successful sign-in.
      if (user) {
        token.userId = user.id as string;
        token.name = user.name ?? "";
        token.email = user.email ?? "";
        token.role = isRole(user.role) ? user.role : ("agent" as Role);
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = Date.now() + ACCESS_TOKEN_TTL_MS;
        return token;
      }

      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token;
      }

      try {
        await connectToDatabase();

        const tokenDoc = await Token.findOne({
          refresh_token: token.refreshToken,
          revoked: false,
        });

        if (!tokenDoc || tokenDoc.expires_at < new Date()) {
          return { ...token, error: "RefreshTokenExpired" };
        }

        // Rotate: a stolen refresh token is only good until the next rotation.
        const newRefreshToken = crypto.randomUUID();
        tokenDoc.refresh_token = newRefreshToken;
        tokenDoc.expires_at = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
        await tokenDoc.save();

        return {
          ...token,
          refreshToken: newRefreshToken,
          accessTokenExpires: Date.now() + ACCESS_TOKEN_TTL_MS,
          error: undefined,
        };
      } catch (error) {
        console.error("jwt refresh failed:", error);
        return { ...token, error: "RefreshTokenExpired" };
      }
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      if (token) {
        session.user.id = token.userId;
        session.user.name = token.name ?? "";
        session.user.email = token.email ?? "";
        session.user.role = token.role;
        session.error = token.error;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;

        // Throttle credential stuffing. Keyed on the email so one attacker
        // cannot lock out a whole office NAT by hammering other accounts.
        const email = String(credentials.email).trim().toLowerCase();
        const verdict = await rateLimit("sign-in", email, LIMITS.signIn);
        if (!verdict.ok) {
          console.warn("sign-in rate limited", { email, url: request?.url });
          return null;
        }

        await connectToDatabase();

        const user = await User.findOne({ email });

        // Compare against a dummy hash when the account is missing or has no
        // password, so a failed lookup costs the same time as a wrong password
        // and cannot be used to tell the two apart.
        const hash =
          user?.password ??
          "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
        const isValid = await bcrypt.compare(String(credentials.password), hash);

        if (!user || !user.password || !isValid) return null;
        if (user.isActive === false) return null;

        const refreshToken = crypto.randomUUID();
        await Token.create({
          user_id: user._id,
          refresh_token: refreshToken,
          revoked: false,
          expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        });

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          refreshToken,
        };
      },
    }),
  ],
};

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions);
