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
  Lock,
  Music2,
  ListMusic,
  Zap,
  Star
} from "lucide-react";

interface GlobalSound {
  _id: string;
  name: string;
  base64: string;
  mimeType: string;
}

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
  const [globalSounds, setGlobalSounds] = useState<GlobalSound[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  
  // Bot Template
  const [leadMessageTemplate, setLeadMessageTemplate] = useState("");
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateMsg, setTemplateMsg] = useState("");
  const [showTestModal, setShowTestModal] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);

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

    fetch("/api/settings/config")
      .then((r) => r.json())
      .then((data) => setLeadMessageTemplate(data.leadMessageTemplate || ""));

    fetchGlobalSounds();
  }, []);

  async function fetchGlobalSounds() {
    setLibraryLoading(true);
    try {
      const res = await fetch("/api/sounds?me=true");
      const data = await res.json();
      setGlobalSounds(data.sounds || []);
    } catch (err) {
      console.error("Failed to fetch sounds:", err);
    } finally {
      setLibraryLoading(false);
    }
  }

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

      // Normalize mimeType for better browser support
      const normalizedMimeType = file.type === "audio/mp3" ? "audio/mpeg" : file.type;

      const body = { 
        base64, 
        mimeType: normalizedMimeType,
        name: file.name.split('.')[0] || "Custom Sound"
      };

      const res = await fetch("/api/settings/sound", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      setSoundLoading(false);

      if (!res.ok) {
        setSoundMsg(data.error || "Upload failed");
        if (data.error?.includes("Duplicate")) {
          setShouldShake(true);
          setTimeout(() => setShouldShake(false), 500);
        }
        return;
      }

      setSoundUrl(data.soundUrl);
      setSoundMsg("Sound uploaded!");
      fetchGlobalSounds(); // Refresh the library
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

  function handlePreview(customUrl?: string) {
    const url = customUrl || soundUrl;
    if (!url) return;
    if (audioRef.current) {
      // Ensure the URL is valid
      audioRef.current.src = url;
      audioRef.current.load();
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Playback failed:", error);
          setSoundMsg("Preview failed: Unsupported format.");
        });
      }
    }
  }

  async function handleApplyGlobalSound(sound: GlobalSound) {
    setSoundLoading(true);
    setSoundMsg("");
    
    try {
      const dataUrl = `data:${sound.mimeType};base64,${sound.base64}`;
      const res = await fetch("/api/settings/sound", {
        method: "POST",
        body: JSON.stringify({ 
          base64: sound.base64, 
          mimeType: sound.mimeType,
          name: sound.name 
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        setSoundUrl(dataUrl);
        setSoundMsg(`Applied "${sound.name}"!`);
      } else {
        setSoundMsg("Failed to apply sound");
      }
    } catch (err) {
      setSoundMsg("Error applying sound");
    } finally {
      setSoundLoading(false);
    }
  }

  async function handleTemplateSave() {
    setTemplateLoading(true);
    setTemplateMsg("");

    const res = await fetch("/api/settings/config", {
      method: "POST",
      body: JSON.stringify({ leadMessageTemplate }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    setTemplateLoading(false);

    if (!res.ok) {
      setTemplateMsg(data.error || "Failed to save template");
      return;
    }

    setTemplateMsg("Template saved successfully!");
  }

  function getPreviewMessage() {
    return leadMessageTemplate
      .replace(/{name}/gi, "@Caveman")
      .replace(/{campaign}/gi, "MAMMOTH HUNT");
  }

  async function handleSendTest() {
    setTemplateLoading(true);
    const res = await fetch("/api/telegram/send-test", {
      method: "POST",
      body: JSON.stringify({ message: getPreviewMessage() }),
      headers: { "Content-Type": "application/json" },
    });
    setTemplateLoading(false);
    if (res.ok) {
      setTemplateMsg("Test message sent to Telegram!");
      setShowTestModal(false);
    } else {
      setTemplateMsg("Failed to send test message.");
    }
  }

  async function handleDelete(leadId: string) {
    const res = await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
    if (res.ok) {
      setLeads((prev) => prev.filter((l) => l._id !== leadId));
    }
  }

  return (
    <div className="">
     

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
                <div className={`p-4 rounded-2xl border-2 flex items-center gap-3 ${profileMsg.includes("successfully") ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" : "bg-red-500/10 border-red-500/40 text-red-400"
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

              <audio 
                ref={audioRef} 
                onLoadedData={() => console.log("Settings audio loaded")}
                onError={(e) => {
                  const target = e.target as HTMLAudioElement;
                  console.error("Settings Audio Error:", target.error);
                }}
              />

              <div className="flex flex-wrap gap-4">
                {soundUrl ? (
                  <>
                    <button
                      onClick={() => handlePreview()}
                      className="flex items-center gap-3 px-6 py-4 bg-slate-950/60 border-2 border-blue-500/20 hover:border-blue-500/50 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                      <Play className="w-4 h-4 text-blue-400" /> Preview Sound
                    </button>
                    <motion.button
                      animate={shouldShake ? { x: [-10, 10, -10, 10, 0] } : {}}
                      transition={{ duration: 0.4 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-3 px-6 py-4 bg-slate-950/60 border-2 border-white/5 hover:border-blue-500/40 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                      <Camera className="w-4 h-4 text-gray-400" /> Replace
                    </motion.button>
                    <button
                      onClick={handleSoundDelete}
                      disabled={soundLoading}
                      className="flex items-center gap-3 px-6 py-4 bg-red-600/10 border-2 border-red-500/20 hover:bg-red-600 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all text-red-500 disabled:opacity-40"
                    >
                      <Trash2 className="w-4 h-4" /> Wipe
                    </button>
                  </>
                ) : (
                  <motion.button
                    animate={shouldShake ? { x: [-10, 10, -10, 10, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={soundLoading}
                    className="flex items-center justify-center gap-4 px-10 py-5 bg-blue-600/10 border-2 border-blue-500/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-[1.8rem] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-40 w-full md:w-auto"
                  >
                    {soundLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>UPLOAD SOUND <Upload className="w-5 h-5" /></>
                    )}
                  </motion.button>
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

            {/* Latest Presets Section */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] border-2 border-blue-500/10 p-8 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="w-6 h-6 text-amber-500 animate-pulse" />
                  <h2 className="text-2xl font-black italic uppercase italic">Latest Presets</h2>
                </div>
                {globalSounds.length > 0 && (
                  <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                      Your History
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {libraryLoading ? (
                  <div className="col-span-full py-10 text-center animate-pulse text-amber-400/40 text-xs font-black uppercase">
                    Syncing Archive...
                  </div>
                ) : globalSounds.length === 0 ? (
                  <div className="col-span-full py-10 text-center text-gray-500 text-xs font-black uppercase">
                    No Personal Presets
                  </div>
                ) : (
                  globalSounds
                    .filter(sound => `data:${sound.mimeType};base64,${sound.base64}` !== soundUrl)
                    .slice(0, 2)
                    .map((sound) => (
                    <div
                      key={sound._id}
                      className="bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border-2 border-white/5 hover:border-amber-500/40 rounded-[2rem] p-6 flex items-center justify-between group transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                          <Music2 className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-black text-gray-200 uppercase tracking-wider truncate max-w-[120px]">
                            {sound.name}
                          </p>
                          <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                            {sound.mimeType.split('/')[1]?.toUpperCase() || "AUDIO"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePreview(`data:${sound.mimeType};base64,${sound.base64}`)}
                          className="p-2.5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
                        >
                          <Play className="w-5 h-5 fill-current" />
                        </button>
                        <button
                          onClick={() => handleApplyGlobalSound(sound)}
                          disabled={soundLoading}
                          className="px-4 py-2 bg-amber-600/10 hover:bg-amber-600 text-amber-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.section>

            {/* Bot Template Section */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] border-2 border-blue-500/10 p-8 shadow-2xl space-y-6"
            >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Activity className="w-6 h-6 text-blue-500" />
                    <h2 className="text-2xl font-black italic uppercase italic">Bot Notification</h2>
                  </div>
                  {leadMessageTemplate && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Template Active</span>
                    </div>
                  )}
                </div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
                  Customize what the bot shouts when a lead lands. <br />
                  Use <code className="text-blue-400 bg-blue-400/10 px-1 py-0.5 rounded">{`{name}`}</code> for hunter name and <code className="text-blue-400 bg-blue-400/10 px-1 py-0.5 rounded">{`{campaign}`}</code> for campaign.
                </p>

                <div className="space-y-4">
                  {leadMessageTemplate && (
                    <div className="bg-slate-950/40 border border-blue-500/10 rounded-xl p-4 space-y-2">
                       <label className="text-[9px] font-black text-blue-400/50 uppercase tracking-[0.2em]">Saved War Cry:</label>
                       <p className="text-[11px] text-gray-400 italic">"{getPreviewMessage()}"</p>
                    </div>
                  )}
                  <div className="relative">
                    <textarea
                      value={leadMessageTemplate}
                      onChange={(e) => setLeadMessageTemplate(e.target.value.slice(0, 500))}
                      placeholder="Example: 🔥 {name} JUST COOKED ON {campaign}! 🔥"
                      maxLength={500}
                      className="w-full bg-slate-950/60 border-2 border-white/5 focus:border-blue-500/50 rounded-2xl px-5 py-4 pb-12 text-gray-200 outline-none transition-all h-32 resize-none custom-scrollbar"
                    />
                    <div className="absolute bottom-4 right-5 text-[10px] font-black uppercase tracking-widest text-blue-500/50">
                      {leadMessageTemplate.length} / 500
                    </div>
                  </div>

                  {templateMsg && (
                    <div className={`p-4 rounded-2xl border-2 flex items-center gap-3 ${templateMsg.includes("successfully") ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" : "bg-red-500/10 border-red-500/40 text-red-400"}`}>
                      <Check className="w-4 h-4 flex-shrink-0" />
                      <p className="text-xs font-black uppercase tracking-widest">{templateMsg}</p>
                    </div>
                  )}

                  <button
                    onClick={handleTemplateSave}
                    disabled={templateLoading}
                    className="flex items-center justify-center gap-4 px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 disabled:opacity-40 text-white rounded-[1.8rem] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-500/20 active:scale-95 w-full md:w-auto"
                  >
                    {templateLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>SAVE TEMPLATE <Check className="w-5 h-5" /></>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setShowTestModal(true)}
                    className="flex items-center justify-center gap-4 px-10 py-5 bg-slate-950/60 border-2 border-white/5 hover:border-blue-500/40 text-gray-400 hover:text-blue-400 rounded-[1.8rem] font-black uppercase tracking-[0.2em] transition-all w-full md:w-auto"
                  >
                    PREVIEW MESSAGE <Play className="w-5 h-5" />
                  </button>
                </div>
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

      <AnimatePresence>
        {showTestModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTestModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-slate-900 border-2 border-blue-500/20 rounded-[3rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600" />
              
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-6 h-6 text-blue-500" />
                <h2 className="text-2xl font-black italic uppercase italic">Bot Preview</h2>
              </div>

              <div className="bg-slate-950/60 border-2 border-white/5 rounded-2xl p-6 mb-8 min-h-[100px] break-words whitespace-pre-wrap">
                <p className="text-blue-100 font-medium leading-relaxed">
                  {leadMessageTemplate ? getPreviewMessage() : "No template set yet..."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowTestModal(false)}
                  className="px-6 py-4 bg-slate-800/50 hover:bg-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Close
                </button>
                <button
                   onClick={handleSendTest}
                   disabled={!leadMessageTemplate || templateLoading}
                   className="px-6 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  {templateLoading ? "Shouting..." : "Send Real Test"}
                  {!templateLoading && <Check className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
