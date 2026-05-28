"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Trophy,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronDown,
  RefreshCcw,
  Music2
} from "lucide-react";
import toast from "react-hot-toast";

const DashboardNavbar = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const isAdmin = session?.user?.role === "admin";
  const userInitial = session?.user?.name?.[0]?.toUpperCase() || "U";

  const getPageLabel = () => {
    if (pathname === "/dashboard") return ""; // Dashboard is the home, no breadcrumb needed typically or just empty
    // if (pathname === "/leaderboard") return "Leaderboard";
    if (pathname === "/settings") return "Settings";
    if (pathname === "/admin/sounds") return "Sound Store";
    if (pathname.startsWith("/admin")) return "Admin Panel";
    return "";
  };

  const pageLabel = getPageLabel();

  const toggleMenu = () => setIsOpen(!isOpen);

  const menuItems = [
    { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    // { label: "Leaderboard", href: "/leaderboard", icon: <Trophy className="w-4 h-4" /> },
    { label: "Settings", href: "/settings", icon: <Settings className="w-4 h-4" /> },
    {label:"Sound Store", href:"/sounds", icon:<Music2 className="w-4 h-4" />}
  ];

  if (isAdmin) {
    menuItems.push({ label: "Admin Panel", href: "/admin", icon: <ShieldCheck className="w-4 h-4" /> });
    // menuItems.push({ label: "Sound Store", href: "/admin/sounds", icon: <Music2 className="w-4 h-4" /> });
  }

  return (
    <div className="w-full flex justify-between items-center mb-8 px-4 py-3 bg-slate-900/60 backdrop-blur-xl border-2 border-blue-500/20 rounded-2xl sticky top-2 z-[100] shadow-2xl shadow-blue-500/5">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform shadow-lg shadow-blue-500/40">
            <span className="text-white font-bold text-sm tracking-tighter">D</span>
          </div>
          <h1 className="text-lg md:text-xl font-bold text-gray-200 tracking-tight font-bold italic uppercase">
            <span className="text-blue-400">Daily</span> Dashboard
          </h1>
        </Link>

        {pageLabel && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
            <span className="text-gray-600 font-medium text-xl">/</span>
            <span className="text-blue-400/80 font-bold text-sm md:text-base tracking-wide">
              {pageLabel}
            </span>
          </div>
        )}
      </div>

      <div className="relative" ref={menuRef}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={toggleMenu}
          className="flex items-center gap-3 p-1.5 pl-3 pr-2 bg-slate-800/40 hover:bg-slate-800/60 transition-colors rounded-xl border-2 border-blue-500/20 cursor-pointer shadow-lg"
        >
          <span className="text-gray-300 font-medium text-sm hidden sm:inline">
            {session?.user?.name || "User"}
          </span>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20">
            {userInitial}
          </div>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute right-0 mt-3 w-56 bg-slate-900/95 backdrop-blur-2xl border-2 border-blue-500/30 rounded-2xl shadow-2xl p-2 z-20 overflow-hidden ring-1 ring-blue-500/10"
            >
              <div className="px-3 py-2 border-b-2 border-blue-500/10 mb-2">
                <p className="text-[10px] font-bold text-blue-400/60 uppercase tracking-widest">Navigation</p>
              </div>

              <div className="space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-400 hover:bg-blue-600/10 hover:text-white transition-all group"
                  >
                    <div className="text-blue-400/80 group-hover:text-blue-400 group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                ))}

                {isAdmin && (
                  <button
                    onClick={async () => {
                      setIsOpen(false);
                      const res = await fetch("/api/admin/force-refresh", { method: "POST" });
                      if (res.ok) {
                        toast.success("All Dashboards Refreshed!", {
                          style: { background: "#1e293b", color: "#60a5fa", border: "1px solid #3b82f633" }
                        });
                      } else {
                        toast.error("Failed to refresh");
                      }
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-amber-400/80 hover:bg-amber-500/10 hover:text-amber-400 transition-all group cursor-pointer"
                  >
                    <div className="group-hover:rotate-180 transition-transform duration-500">
                      <RefreshCcw className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-sm">Force Global Refresh</span>
                  </button>
                )}
              </div>

              <div className="border-t-2 border-blue-500/10 mt-2 pt-2">
                <button
                  onClick={() => signOut({ callbackUrl: "/sign-in" })}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-all group cursor-pointer"
                >
                  <div className="group-hover:scale-110 transition-transform">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm">Sign Out</span>
                </button>
              </div>
            </motion.div>

          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DashboardNavbar;