"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchLeadsStats } from "@/store/slices/leadsSlice";
import DashboardNavbar from "@/components/DashboardNavbar";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Flame, Crown, Activity, TrendingUp } from "lucide-react";

export default function LeaderboardPage() {
  const dispatch = useAppDispatch();
  const { byUser, totalLeads, status } = useAppSelector((state) => state.leads);
  const loading = status === "loading";

  useEffect(() => {
    dispatch(fetchLeadsStats({ allTime: true }));
  }, [dispatch]);

  const sortedUsers = [...byUser].sort((a, b) => b.count - a.count);

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 md:p-8 pb-32 selection:bg-blue-500/30">
      <DashboardNavbar />

      <div className="max-w-7xl mx-auto space-y-12">
        {/* Hero Section */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative py-12 px-8 rounded-[3rem] border-2 border-blue-500/10 bg-slate-900/40 backdrop-blur-2xl overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-12 opacity-5">
            <Trophy className="w-64 h-64 text-blue-400" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Crown className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-sm font-black text-blue-400 uppercase tracking-[0.5em]">Global Rankings</h2>
              </div>
              <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-white via-blue-200 to-indigo-300 bg-clip-text text-transparent italic uppercase tracking-tighter">
                Hall of <span className="text-blue-500">Fame</span>
              </h1>
              <p className="text-gray-500 font-bold mt-4 uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
                <Activity className="w-4 h-4 text-emerald-500" /> All-Time Performance Tracking Activated
              </p>
            </div>

            <div className="bg-slate-950/60 backdrop-blur-xl border-2 border-white/5 p-8 rounded-[2.5rem] flex flex-col items-center min-w-[240px] shadow-2xl">
              <span className="text-6xl font-black text-white">{totalLeads}</span>
              <span className="text-blue-400/60 text-xs font-black uppercase tracking-[0.3em] mt-2">Historical Total</span>
            </div>
          </div>
        </motion.header>

        {/* Rankings Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Leaderboard List */}
          <motion.section 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-12 bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] border-2 border-blue-500/10 p-8 md:p-12 shadow-2xl relative overflow-hidden group"
          >
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {sortedUsers.map((user, index) => {
                  const isTopOne = index === 0;
                  const isTopThree = index < 3;
                  
                  return (
                    <motion.div
                      layout
                      key={user.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`relative flex flex-col md:flex-row items-center justify-between p-6 md:p-8 rounded-[2rem] border-2 transition-all group/item ${
                        isTopOne 
                        ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/10 border-blue-500 shadow-2xl shadow-blue-500/20 scale-[1.02] mb-10" 
                        : isTopThree
                        ? "bg-slate-950/60 border-blue-500/30 shadow-xl mb-4"
                        : "bg-slate-950/40 border-white/5 hover:border-blue-500/20 mb-4"
                      }`}
                    >
                      <div className="flex items-center gap-6 mb-4 md:mb-0">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl relative ${
                          isTopOne ? "bg-blue-600 text-white rotate-6 shadow-2xl shadow-blue-600/40" :
                          isTopThree ? "bg-slate-800 text-blue-400 border-2 border-blue-500/40" :
                          "bg-slate-900 text-gray-500"
                        }`}>
                          {index + 1}
                          {isTopOne && <Flame className="absolute -top-3 -right-3 w-8 h-8 text-orange-400 animate-bounce" />}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className={`text-2xl md:text-3xl font-black ${isTopOne ? "text-white" : "text-gray-200"}`}>
                              {user.name}
                            </h3>
                            {isTopOne && <Trophy className="w-6 h-6 text-yellow-400" />}
                          </div>
                          {isTopOne && <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Ultimate Ringer</p>}
                          {!isTopOne && isTopThree && <p className="text-blue-500/60 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Elite Performer</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                        <div className="text-center md:text-right">
                          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] mb-1">Total Impact</p>
                          <div className="flex items-baseline justify-center md:justify-end gap-2">
                            <span className={`text-4xl md:text-5xl font-black ${isTopOne ? "text-blue-400" : "text-white"}`}>
                              {user.count}
                            </span>
                            <span className="text-gray-600 text-sm font-bold uppercase">Leads</span>
                          </div>
                        </div>
                        
                        {/* Power Bar */}
                        <div className="hidden md:block w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(user.count / (sortedUsers[0]?.count || 1)) * 100}%` }}
                            className={`h-full ${isTopOne ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-blue-500/40"}`}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {loading && sortedUsers.length === 0 && (
                <div className="space-y-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-32 bg-white/5 rounded-[2rem] animate-pulse" />
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        </div>
      </div>
      
      {/* Decorative pulse at bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-blue-900/10 to-transparent pointer-events-none z-[-1]" />
    </div>
  );
}
