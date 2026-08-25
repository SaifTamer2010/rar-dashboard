"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Music2,
  Play,
  Trash2,
  Search,
  Check,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

interface GlobalSound {
  _id: string;
  name: string;
  base64: string;
  mimeType: string;
  uploaderName?: string;
}

const cardClass = "rounded-xl border bg-background";
const iconButton =
  "flex size-8 cursor-pointer items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50";

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
        playPromise.catch((error) => {
          console.error("Audio playback failed:", error);
          toast.error("Playback failed: no supported source found");
        });
      }
    }
  };

  const handleDownload = (sound: GlobalSound) => {
    try {
      const mime = sound.mimeType === "audio/mp3" ? "audio/mpeg" : sound.mimeType;
      let extension = sound.mimeType.split("/")[1] || "mp3";
      if (extension === "mpeg") extension = "mp3";

      const link = document.createElement("a");
      link.href = `data:${mime};base64,${sound.base64}`;
      link.download = `${sound.name}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Downloading ${sound.name}`);
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Failed to download sound");
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
          name: sound.name,
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        toast.success(`"${sound.name}" set as default`);
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
    <div className="flex flex-col gap-8">
      <audio
        ref={audioRef}
        onError={(e) => {
          const target = e.target as HTMLAudioElement;
          console.error("Audio Error:", target.error);
        }}
      />

      {/* Newest uploads pulled to the top so the freshest sound is one click away. */}
      {!searchQuery && presets.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[13px] font-medium text-muted-foreground">Latest uploads</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {presets.map((sound, idx) => (
              <motion.div
                key={`preset-${sound._id}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`${cardClass} flex items-center justify-between gap-4 p-4`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted">
                    <Music2 className="size-4 text-muted-foreground" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{sound.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {sound.mimeType.split("/")[1]?.toUpperCase() || "AUDIO"}
                      {sound.uploaderName && ` · ${sound.uploaderName}`}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button onClick={() => handlePreview(sound)} className={iconButton} title="Preview">
                    <Play className="size-3.5 fill-current" />
                  </button>
                  <button
                    onClick={() => handleApply(sound)}
                    disabled={applyingId === sound._id}
                    className="cursor-pointer rounded-lg bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {applyingId === sound._id ? "Setting…" : "Set default"}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[13px] font-medium text-muted-foreground">
            All sounds
            <span className="ml-2 text-muted-foreground/60">{filteredSounds.length}</span>
          </h2>

          <div className="relative w-full sm:w-64">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search sounds…"
              className="w-full rounded-lg border bg-background py-2 pr-3 pl-9 text-sm outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground/70 focus-visible:border-muted-foreground focus-visible:ring-[3px] focus-visible:ring-foreground/10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className={`${cardClass} overflow-hidden`}>
          <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground sm:grid-cols-[1.6fr_1fr_auto_auto]">
            <span>Name</span>
            <span className="hidden sm:block">Uploaded by</span>
            <span className="hidden sm:block">Format</span>
            <span className="text-right">Actions</span>
          </div>

          <div className="max-h-125 divide-y overflow-y-auto">
            {loading ? (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">Loading sounds…</p>
            ) : filteredSounds.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">
                {searchQuery ? "No sounds match that search." : "No sounds in the store yet."}
              </p>
            ) : (
              filteredSounds.map((sound) => (
                <motion.div
                  layout
                  key={sound._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50 sm:grid-cols-[1.6fr_1fr_auto_auto]"
                >
                  <p className="truncate text-sm font-medium">{sound.name}</p>
                  <p className="hidden truncate text-sm text-muted-foreground sm:block">
                    {sound.uploaderName || "System"}
                  </p>
                  <span className="hidden rounded-md border bg-muted px-2 py-0.5 text-xs text-muted-foreground sm:block">
                    {sound.mimeType.split("/")[1]?.toUpperCase() || "AUDIO"}
                  </span>
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => handlePreview(sound)} className={iconButton} title="Preview">
                      <Play className="size-3.5 fill-current" />
                    </button>
                    <button
                      onClick={() => handleApply(sound)}
                      disabled={applyingId === sound._id}
                      className={iconButton}
                      title="Set as default"
                    >
                      <Check className="size-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(sound)}
                      disabled={applyingId === sound._id}
                      className={iconButton}
                      title="Download"
                    >
                      <Download className="size-4" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(sound._id)}
                        className="flex size-8 cursor-pointer items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default SoundStoreManager;
