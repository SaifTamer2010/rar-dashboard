"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Music2, 
  Play, 
  Trash2, 
  Search,
  Activity,
  Check,
  Star,
  Zap
} from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

interface GlobalSound {
  _id: string;
  name: string;
  base64: string;
  mimeType: string;
}

const SoundStoreManager: React.FC = () => {
  const { data: session } = useSession();
  const [sounds, setSounds] = useState<GlobalSound[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchSounds();
  }, []);

  const fetchSounds = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sounds");
      const data = await res.json();
      setSounds(data.sounds || []);
    } catch (err) {
      console.error("Failed to fetch sounds:", err);
      toast.error("Failed to load sound store");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (sound: GlobalSound) => {
    if (audioRef.current) {
      // Normalize mimeType for browser compatibility
      const mime = sound.mimeType === "audio/mp3" ? "audio/mpeg" : sound.mimeType;
      audioRef.current.src = `data:${mime};base64,${sound.base64}`;
      
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Audio playback failed:", error);
          toast.error("Playback failed: No supported source found", {
            style: { background: "#1e293b", color: "#ef4444", border: "1px solid #ef444433" }
          });
        });
      }
    }
  };

  const handleApply = async (sound: GlobalSound) => {
    setApplyingId(sound._id);
    try {
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
        toast.success(`"${sound.name}" set as default!`, {
          style: { background: "#1e293b", color: "#60a5fa", border: "1px solid #3b82f633" }
        });
      } else {
        toast.error("Failed to set default sound");
      }
    } catch (err) {
      toast.error("Error updating default sound");
    } finally {
      setApplyingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this sound from the global store?")) return;

    try {
      const res = await fetch(`/api/admin/sounds/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSounds((prev) => prev.filter((s) => s._id !== id));
        toast.success("Sound removed from store");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete sound");
      }
    } catch (err) {
      toast.error("Error deleting sound");
    }
  };

  const filteredSounds = sounds.filter((s) => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presets = sounds.slice(0, 2);
  const isAdmin = session?.user?.role === "admin";

  return (
    <div className="space-y-10">
      <audio 
        ref={audioRef} 
        onLoadedData={() => console.log("Audio loaded")}
        onError={(e) => {
          const target = e.target as HTMLAudioElement;
          console.error("Audio Error:", target.error);
        }}
      />
      
      {/* Presets Section */}
      {!searchQuery && presets.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-amber-500 animate-pulse" />
            <h3 className="text-sm font-black text-amber-500 uppercase tracking-[0.4em]">Latest Presets</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {presets.map((sound, idx) => (
              <motion.div
                key={`preset-${sound._id}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 backdrop-blur-3xl border-2 border-blue-500/30 rounded-[2rem] p-6 flex items-center justify-between group hover:border-blue-500/60 transition-all shadow-2xl shadow-blue-500/5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Music2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-black italic uppercase text-white tracking-tight">{sound.name}</p>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{sound.mimeType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handlePreview(sound)}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
                  >
                    <Play className="w-5 h-5 fill-current" />
                  </button>
                  <button
                    onClick={() => handleApply(sound)}
                    disabled={applyingId === sound._id}
                    className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
                  >
                    {applyingId === sound._id ? (
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>SET DEFAULT <Star className="w-3 h-3" /></>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Main List */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="text-left">
            <h2 className="text-2xl font-black italic uppercase italic text-white flex items-center gap-3">
              <Activity className="w-6 h-6 text-blue-500" />
              Full Archive
            </h2>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Personnel Audio Access</p>
          </div>

          <div className="relative w-full md:w-64 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500/50 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="SEARCH ARCHIVE..."
              className="w-full bg-slate-950/60 border-2 border-white/5 focus:border-blue-500/50 rounded-2xl pl-12 pr-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-200 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] border-2 border-blue-500/10 overflow-hidden shadow-2xl">
          <div className="grid grid-cols-4 font-black text-blue-400 text-[10px] uppercase tracking-[0.4em] bg-slate-950/40 px-8 py-6 border-b-2 border-blue-500/10 text-left">
            <div className="col-span-2 flex items-center gap-2 px-4"><Music2 className="w-3 h-3" /> Codename</div>
            <div className="flex items-center gap-2 px-4"><Activity className="w-3 h-3" /> Format</div>
            <div className="text-right px-4">Actions</div>
          </div>

          <div className="divide-y-2 divide-blue-500/5 max-h-[500px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-20 text-center animate-pulse text-blue-400/40 text-xs font-black uppercase tracking-widest">
                Decoding Data Streams...
              </div>
            ) : filteredSounds.length === 0 ? (
              <div className="p-20 text-center text-gray-700 text-xs font-black uppercase tracking-widest">
                Archive Query Null
              </div>
            ) : (
              filteredSounds.map((sound) => (
                <motion.div
                  layout
                  key={sound._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-4 items-center px-8 py-6 hover:bg-white/5 transition-all group text-left"
                >
                  <div className="col-span-2 px-4">
                    <p className="text-lg font-black italic uppercase text-gray-100">{sound.name}</p>
                  </div>
                  <div className="px-4">
                    <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-blue-400">
                      {sound.mimeType.split('/')[1]?.toUpperCase() || "AUDIO"}
                    </span>
                  </div>
                  <div className="px-4 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handlePreview(sound)}
                      className="p-2.5 bg-emerald-500/10 border-2 border-emerald-500/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl transition-all"
                      title="Preview"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                    <button
                      onClick={() => handleApply(sound)}
                      disabled={applyingId === sound._id}
                      className="p-2.5 bg-blue-500/10 border-2 border-blue-500/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl transition-all"
                      title="Set Default"
                    >
                      {applyingId === sound._id ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(sound._id)}
                        className="p-2.5 bg-red-500/10 border-2 border-red-500/20 hover:bg-red-600 text-red-400 hover:text-white rounded-xl transition-all"
                        title="Purge"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoundStoreManager;
