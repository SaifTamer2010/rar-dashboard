import { DefaultSession } from "next-auth";
import type { Role } from "@/lib/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      role: Role;
    } & DefaultSession["user"];
    /** Set when the refresh token could not be rotated — the client signs out. */
    error?: "RefreshTokenExpired";
  }

  interface User {
    role: Role;
    /** Handed from authorize() to the jwt callback on first sign-in only. */
    refreshToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    role: Role;
    refreshToken?: string;
    accessTokenExpires: number;
    error?: "RefreshTokenExpired";
  }
}
