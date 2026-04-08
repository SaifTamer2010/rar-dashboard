"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useAppDispatch } from "@/store/hooks";
import DashboardNavbar from "@/components/DashboardNavbar";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Bell, 
  Shield, 
  History, 
  Trash2, 
  Camera, 
  Play, 
  Check, 
  Upload, 
  Activity, 
  Lock 
} from "lucide-react";

interface Lead {
  _id: string;
  campaignId: { name: string };
  createdAt: string;
}

export default function SettingsPage() {
  const { data: session, update } = useSession();
  
  // Profile
  const [name, setName] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  // History
  const [leads, setLeads] = useState<Lead[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Sound
  const [soundUrl, setSoundUrl] = useState<string | null>(null);
  const [soundLoading, setSoundLoading] = useState(false);
  const [soundMsg, setSoundMsg] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name);
      fetch("/api/user/me")
        .then((r) => r.json())
        .then((data) => setTelegramUsername(data.telegramUsername || ""));
    }
  }, [session]);

  useEffect(() => {
    fetch("/api/leads/history")
      .then((r) => r.json())
      .then((data) => setLeads(data.leads || []))
      .finally(() => setHistoryLoading(false));

    fetch("/api/settings/sound")
      .then((r) => r.json())
      .then((data) => setSoundUrl(data.soundUrl || null));
  }, []);

  async function handleProfileSave() {
    setProfileLoading(true);
    setProfileMsg("");

    const body: Record<string, string> = { name, telegramUsername };
    if (currentPassword && newPassword) {
      body.currentPassword = currentPassword;
      body.newPassword = newPassword;
    }

    const res = await fetch("/api/user/update", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    setProfileLoading(false);

    if (!res.ok) {
      setProfileMsg(data.error || "Something went wrong");
      return;
    }

    await update({ name });
    setCurrentPassword("");
    setNewPassword("");
    setProfileMsg("Saved successfully!");
  }

  async function handleSoundUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      setSoundMsg("Please upload an audio file.");
      return;
    }

    const duration = await getAudioDuration(file);
    if (duration > 10) {
      setSoundMsg("Sound must be 10 seconds or less.");
      return;
    }

    setSoundLoading(true);
    setSoundMsg("");

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];

      const res = await fetch("/api/settings/sound", {
        method: "POST",
        body: JSON.stringify({ base64, mimeType: file.type }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      setSoundLoading(false);

      if (!res.ok) {
        setSoundMsg(data.error || "Upload failed");
        return;
      }

      setSoundUrl(data.soundUrl);
      setSoundMsg("Sound uploaded!");
    };

    reader.readAsDataURL(file);
  }

  function getAudioDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
      const audio = document.createElement("audio");
      audio.src = URL.createObjectURL(file);
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(audio.src);
        resolve(audio.duration);
      };
    });
  }

  async function handleSoundDelete() {
    setSoundLoading(true);
    await fetch("/api/settings/sound", { method: "DELETE" });
    setSoundUrl(null);
    setSoundMsg("Sound removed.");
    setSoundLoading(false);
  }

  function handlePreview() {
    if (!soundUrl) return;
    if (audioRef.current) {
      audioRef.current.src = soundUrl;
      audioRef.current.play();
    }
  }

  async function handleDelete(leadId: string) {
    const res = await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
    if (res.ok) {
      setLeads((prev) => prev.filter((l) => l._id !== leadId));
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 md:p-8 pb-32">
      <DashboardNavbar />

      <div className="max-w-6xl mx-auto space-y-10">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative py-12 px-8 rounded-[3rem] border-2 border-blue-500/10 bg-slate-900/40 backdrop-blur-2xl overflow-hidden"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <User className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-sm font-black text-blue-400 uppercase tracking-[0.5em]">System Prefs</h2>
          </div>
          <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-white via-blue-200 to-indigo-300 bg-clip-text text-transparent italic uppercase tracking-tighter">
            User <span className="text-blue-500">Settings</span>
          </h1>
        </motion.header>

        <div className="grid lg:grid-cols-12 gap-10">
          {/* Left: Profile & Sound */}
          <div className="lg:col-span-8 space-y-10">
            {/* Profile Section */}
            <motion.section 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] border-2 border-blue-500/10 p-8 shadow-2xl space-y-8"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-blue-500" />
                <h2 className="text-2xl font-black italic uppercase italic">Account Profile</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] ml-1">Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950/60 border-2 border-white/5 focus:border-blue-500/50 rounded-2xl px-5 py-4 text-gray-200 outline-none transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] ml-1">Telegram Handle</label>
                  <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500 font-bold">@</span>
                    <input
                      type="text"
                      value={telegramUsername}
                      onChange={(e) => setTelegramUsername(e.target.value.replace("@", ""))}
                      placeholder="username"
                      className="w-full bg-slate-950/60 border-2 border-white/5 focus:border-blue-500/50 rounded-2xl pl-10 pr-5 py-4 text-gray-200 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] ml-1">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10" />
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950/60 border-2 border-white/5 focus:border-blue-500/50 rounded-2xl px-5 py-4 text-gray-200 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] ml-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/60 border-2 border-white/5 focus:border-blue-500/50 rounded-2xl px-5 py-4 text-gray-200 outline-none transition-all"
                  />
                </div>
              </div>

              {profileMsg && (
                <div className={`p-4 rounded-2xl border-2 flex items-center gap-3 ${
                  profileMsg.includes("successfully") ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" : "bg-red-500/10 border-red-500/40 text-red-400"
                }`}>
                  <Activity className="w-5 h-5 flex-shrink-0" />
                  <p className="text-xs font-black uppercase tracking-widest">{profileMsg}</p>
                </div>
              )}

              <button
                onClick={handleProfileSave}
                disabled={profileLoading}
                className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 disabled:opacity-40 text-white px-10 py-5 rounded-[1.8rem] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-3"
              >
                {profileLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>COMMIT CHANGES <Check className="w-5 h-5" /></>
                )}
              </button>
            </motion.section>

            {/* Sound Section */}
            <motion.section 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] border-2 border-blue-500/10 p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-2">
                <Bell className="w-6 h-6 text-blue-500" />
                <h2 className="text-2xl font-black italic uppercase italic">Global Pulse</h2>
              </div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-8">System-wide notification for every logged lead</p>

              <audio ref={audioRef} />

              <div className="flex flex-wrap gap-4">
                {soundUrl ? (
                  <>
                    <button
                      onClick={handlePreview}
                      className="flex items-center gap-3 px-6 py-4 bg-slate-950/60 border-2 border-blue-500/20 hover:border-blue-500/50 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                      <Play className="w-4 h-4 text-blue-400" /> Preview Sound
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-3 px-6 py-4 bg-slate-950/60 border-2 border-white/5 hover:border-blue-500/40 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                      <Camera className="w-4 h-4 text-gray-400" /> Replace
                    </button>
                    <button
                      onClick={handleSoundDelete}
                      disabled={soundLoading}
                      className="flex items-center gap-3 px-6 py-4 bg-red-600/10 border-2 border-red-500/20 hover:bg-red-600 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all text-red-500 disabled:opacity-40"
                    >
                      <Trash2 className="w-4 h-4" /> Wipe
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={soundLoading}
                    className="flex items-center justify-center gap-4 px-10 py-5 bg-blue-600/10 border-2 border-blue-500/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-[1.8rem] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-40 w-full md:w-auto"
                  >
                    {soundLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>UPLOAD PULSE <Upload className="w-5 h-5" /></>
                    )}
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleSoundUpload}
              />

              {soundMsg && (
                <p className={`mt-6 text-[10px] font-black uppercase tracking-[0.2em] ${soundMsg.includes("!") ? "text-emerald-400" : "text-red-400"}`}>
                  {soundMsg}
                </p>
              )}
            </motion.section>
          </div>

          {/* Right Column: Lead History */}
          <div className="lg:col-span-4">
            <motion.section 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] border-2 border-blue-500/10 p-8 shadow-2xl h-full relative overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-8">
                <History className="w-6 h-6 text-blue-500" />
                <h2 className="text-2xl font-black italic uppercase italic">History</h2>
              </div>

              <div className="space-y-4 max-h-[1000px] overflow-y-auto pr-2 custom-scrollbar">
                {historyLoading ? (
                  <div className="p-10 text-center animate-pulse text-blue-400/40 text-xs font-black uppercase">Scanning Nodes...</div>
                ) : leads.length === 0 ? (
                  <div className="p-10 text-center text-gray-500 text-xs font-black uppercase">No Data Found</div>
                ) : (
                  leads.map((lead) => (
                    <motion.div
                      key={lead._id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-slate-950/40 border-2 border-white/5 hover:border-blue-500/20 rounded-2xl p-4 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-black text-white uppercase italic">{lead.campaignId?.name || "Unknown"}</span>
                        <button
                          onClick={() => handleDelete(lead._id)}
                          className="p-1.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest leading-none">
                        {new Date(lead.createdAt).toLocaleString()}
                      </p>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
}
