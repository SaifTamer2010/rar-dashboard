import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "./mongodb";
import User from "@/models/User";
import Token from "@/models/Token";

export const authOptions = {
  trustHost: true,
  session: { 
    strategy: "jwt" as const,
    maxAge: 60 * 60 * 24 * 7, // 1 min
  },
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.userId = user.id as string;
        token.name = user.name ?? "";
        token.email = user.email ?? "";
        token.role = (user as any).role ?? "user";
        token.refreshToken = (user as any).refreshToken; // ← add
        token.accessTokenExpires = Date.now() + 60 * 1 * 1000; // 1 min
        return token;
      }

       if (Date.now() < token.accessTokenExpires) {
    return token;
    }
     console.log("🔄 Access token expired, refreshing...");
     try {
    await connectToDatabase();

    const tokenDoc = await Token.findOne({
      refresh_token: token.refreshToken,
      revoked: false,
    });

    console.log(token.refreshToken)

    if (!tokenDoc || tokenDoc.expires_at < new Date()) {
      console.log("❌ Refresh token invalid or expired");
      return { ...token, error: "RefreshTokenExpired" };
    }

    // Rotate refresh token
    const newRefreshToken = crypto.randomUUID();
    tokenDoc.refresh_token = newRefreshToken;
    tokenDoc.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await tokenDoc.save();

    console.log("✅ Token rotated successfully");
    return {
      ...token,
      refreshToken: newRefreshToken,
      accessTokenExpires: Date.now() + 60 * 15 * 1000,
      error: undefined,
    };
  } catch (err) {
    console.log("❌ Error refreshing token:", err);
    return { ...token, error: "RefreshTokenExpired" };
  }
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.userId;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.role = token.role;
        session.error = token.error
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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectToDatabase();

        const user = await User.findOne({ email: credentials.email });
        if (!user) return null;
        if (user.isActive === false) return null;
        if (!user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );
        if (!isValid) return null;

        // Generate and store refresh token
        const refreshToken = crypto.randomUUID();
        await Token.create({
          user_id: user._id,
          refresh_token: refreshToken,
          revoked: false,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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