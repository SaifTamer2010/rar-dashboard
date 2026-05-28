"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import SoundStoreManager from "@/components/SoundStoreManager";
import DashboardNavbar from "@/components/DashboardNavbar";
import { motion } from "framer-motion";

export default function AdminSoundsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated" || (status === "authenticated" && session?.user?.role !== "admin")) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">Verifying clearance...</div>;
  }

  if (session?.user?.role !== "admin") {
    return null;
  }

  return (
    

      <div className="max-w-6xl mx-auto space-y-10">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative py-12 px-8 rounded-[3rem] border-2 border-blue-500/10 bg-slate-900/40 backdrop-blur-2xl overflow-hidden"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white font-black italic uppercase italic">ADM</span>
            </div>
            <h2 className="text-sm font-black text-blue-400 uppercase tracking-[0.5em]">System Archive</h2>
          </div>
          <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-white via-blue-200 to-indigo-300 bg-clip-text text-transparent italic uppercase tracking-tighter">
            Sound <span className="text-blue-500">Store</span>
          </h1>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SoundStoreManager />
        </motion.div>
      </div>
   
  );
}
