import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "./mongodb";
import User from "@/models/User";

export const authOptions = {
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.userId = user.id as string;
        token.name = user.name ?? "";
        token.role = (user as any).role ?? "user";
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

        await connectToDatabase();

        const user = await User.findOne({ name: credentials.name });

        if (!user) return null;

        // Prevent inactive users from logging in
        if (user.isActive === false) return null;

        // No password means account exists but never set one
        if (!user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );

        if (!isValid) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          role: user.role, // add this
        };
      },
    }),
  ],
};

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions);
