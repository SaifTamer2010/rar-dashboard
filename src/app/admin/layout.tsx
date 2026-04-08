"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { useSession } from "next-auth/react";
import React from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { session, status } = useAdminGuard();

  const router = useRouter();
  const pathname = usePathname();
  // const signOut = use
  if (status === "loading") {
    return <p>Loading admin panel...</p>;
  }

  if (!session || session.user.role !== "admin") {
    router.push("/dashboard");
    return null;
  }

  return (
    <div className="bg-slate-800 h-screen">
      <nav className="sticky top-0 w-screen h-20 bg-black/60 p-5 flex justify-between">
        <h1 className="text-2xl font-bold italic">Admin Dashboard</h1>
        <div className="flex justify-between mt-1">
          <Link href="/dashboard" className="text-2xl font-bold hover:text-slate-300 transition-all cursor-pointer">Back to Agents Dashboard</Link>
        </div>
        <div className="flex justify-between">
          <button
            onClick={() => signOut({ callbackUrl: "/sign-in" })}
            className="text-md md:text-lg font-semibold w-30  rounded-xl hover:bg-red-700 transition-all cursor-pointer flex justify-center items-center"
          >
            Sign out
          </button>
        </div>
      </nav>
      <main className="bg-slate-800 max-h-screen overflow-y-auto flex justify-center items-center">{children}</main>
    </div>
  );
};

export default AdminLayout;
