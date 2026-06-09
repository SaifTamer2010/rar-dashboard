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
    maxAge: 60 * 15, // 15 min
  },
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.userId = user.id as string;
        token.name = user.name ?? "";
        token.role = (user as any).role ?? "user";
        token.refreshToken = (user as any).refreshToken; // ← add
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.userId;
        session.user.name = token.name as string;
        session.user.role = token.role;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        name: {},
        password: {},
      },
      async authorize(credentials) {
        if (!credentials?.name || !credentials?.password) return null;
        console
        await connectToDatabase();

        const user = await User.findOne({ name: credentials.name });
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
          role: user.role,
          refreshToken,
        };
      },
    }),
  ],
};

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions);