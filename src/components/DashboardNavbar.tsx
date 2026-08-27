"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Settings,
  ShieldCheck,
  ShieldAlert,
  Trophy,
  Users,
  Megaphone,
  BarChart3,
  UserPlus,
  Timer,
  LogOut,
  ChevronDown,
  RefreshCcw,
  Music2,
  Home,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { roleHome } from "@/lib/roles";
import { useBusniess } from "@/hooks/useBusniess";
import InviteModal from "@/components/InviteModal";

const DashboardNavbar = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
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

  // Route changes should never leave the menu hanging open.
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const role = session?.user?.role;
  const isSuperAdmin = role === "super_admin";
  const isBusinessOwner = role === "busniess_owner";
  const isTeamLeader = role === "team_leader";
  const { companyName } = useBusniess();
  // Owners see their own company on the brand, everyone else sees the product.
  const brandName = isBusinessOwner ? companyName || "Your business" : "Daily Dashboard";
  const brandInitial = brandName[0]?.toUpperCase() || "D";
  const home = roleHome(role);
  const userInitial = session?.user?.name?.[0]?.toUpperCase() || "U";

  const handleLogout = async () => {
    await fetch('/api/auth/logout' , {method:"POST"});
    await signOut({callbackUrl:'/sign-in'})
  }

  const toggleMenu = () => setIsOpen(!isOpen);

  // Business owners get their own links — none of the agent app.
  const businessItems = [
    { label: "Dashboard", href: "/busniess", icon: <LayoutDashboard className="size-4" /> },
    { label: "Teams", href: "/busniess/teams", icon: <Users className="size-4" /> },
    { label: "Invited users", href: "/busniess/invited_users", icon: <UserPlus className="size-4" /> },
    { label: "Campaigns", href: "/busniess/campaigns", icon: <Megaphone className="size-4" /> },
    { label: "Reports", href: "/busniess/reports", icon: <BarChart3 className="size-4" /> },
  ];

  const agentItems = [
    { label: "Dashboard", href: "/agent/dashboard", icon: <LayoutDashboard className="size-4" /> },
    { label: "Leaderboard", href: "/agent/leaderboard", icon: <Trophy className="size-4" /> },
    { label: "Property Search", href: "/agent/property-search", icon: <Home className="size-4" /> },
    { label: "Sound Store", href: "/agent/sounds", icon: <Music2 className="size-4" /> },
    { label: "Settings", href: "/agent/settings", icon: <Settings className="size-4" /> },
  ];

  // Team leaders read their team at /teamlead — they never log leads themselves.
  const leaderItems = [
    { label: "Dashboard", href: "/teamlead/dashboard", icon: <LayoutDashboard className="size-4" /> },
    { label: "Intervals", href: "/teamlead/intervals", icon: <Timer className="size-4" /> },
    { label: "Leaderboard", href: "/agent/leaderboard", icon: <Trophy className="size-4" /> },
    { label: "Sound Store", href: "/agent/sounds", icon: <Music2 className="size-4" /> },
    { label: "Settings", href: "/agent/settings", icon: <Settings className="size-4" /> },
  ];

  const menuItems = isBusinessOwner
    ? [...businessItems]
    : isTeamLeader
      ? [...leaderItems]
      : [...agentItems];

  if (isSuperAdmin) {
    menuItems.push(
      { label: "Admin", href: "/admin", icon: <ShieldAlert className="size-4" /> },
      { label: "Admin Panel", href: "/admin/panel", icon: <ShieldCheck className="size-4" /> },
    );
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-100 w-full border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-15 max-w-300 items-center gap-8 px-6">
        <Link href={home} className="flex shrink-0 items-center gap-2">
          <div className="flex size-5.5 items-center justify-center rounded-md bg-foreground text-xs text-background">
            {brandInitial}
          </div>
          <span className="text-[15px] font-semibold tracking-tight">{brandName}</span>
        </Link>

        {/* Inline nav on desktop; the avatar menu carries the same links on small screens. */}
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors",
                isActive(item.href)
                  ? "font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground sm:inline-flex">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
            Live
          </span>

          <div className="relative" ref={menuRef}>
            <button
              onClick={toggleMenu}
              aria-expanded={isOpen}
              className="flex cursor-pointer items-center gap-2 rounded-lg border bg-background py-1 pr-1.5 pl-2.5 transition-colors hover:bg-muted"
            >
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {session?.user?.name || "User"}
              </span>
              <div className="flex size-7 items-center justify-center rounded-md bg-muted text-xs font-medium">
                {userInitial}
              </div>
              <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                <ChevronDown className="size-4 text-muted-foreground" />
              </motion.div>
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: -4 }}
                  transition={{ duration: 0.14, ease: "easeOut" }}
                  className="absolute right-0 z-20 mt-2 w-56 origin-top-right overflow-hidden rounded-xl border bg-background p-1.5 shadow-lg"
                >
                  <div className="flex flex-col gap-0.5 md:hidden">
                    {menuItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    ))}
                    <div className="my-1.5 h-px bg-border" />
                  </div>

                  {isBusinessOwner && (
                    <>
                      <Link
                        href="/busniess/settings"
                        onClick={() => setIsOpen(false)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Settings className="size-4" />
                        <span>Settings</span>
                      </Link>
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          setInviteOpen(true);
                        }}
                        className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <UserPlus className="size-4" />
                        <span>Invite</span>
                      </button>
                      <div className="my-1.5 h-px bg-border" />
                    </>
                  )}

                  {isSuperAdmin && (
                    <>
                      <button
                        onClick={async () => {
                          setIsOpen(false);
                          const res = await fetch("/api/admin/force-refresh", { method: "POST" });
                          if (res.ok) {
                            toast.success("All dashboards refreshed");
                          } else {
                            toast.error("Failed to refresh");
                          }
                        }}
                        className="group flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <RefreshCcw className="size-4 transition-transform duration-500 group-hover:rotate-180" />
                        <span>Force global refresh</span>
                      </button>
                      <div className="my-1.5 h-px bg-border" />
                    </>
                  )}

                  <button
                    onClick={() => handleLogout()}
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <LogOut className="size-4" />
                    <span>Sign out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} />}
    </header>
  );
};

export default DashboardNavbar;
