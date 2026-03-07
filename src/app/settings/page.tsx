"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Lead {
  _id: string;
  campaignId: { name: string };
  createdAt: string;
}

export default function SettingsPage() {
  const { data: session, update } = useSession();

  // Profile
  const [name, setName] = useState("");
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
    if (session?.user?.name) setName(session.user.name);
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

  // Profile update
  async function handleProfileSave() {
    setProfileLoading(true);
    setProfileMsg("");

    const body: Record<string, string> = { name };
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

    await update({ name }); // update session
    setCurrentPassword("");
    setNewPassword("");
    setProfileMsg("Saved successfully!");
  }

  // Sound upload
  async function handleSoundUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      setSoundMsg("Please upload an audio file.");
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

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 mx-auto w-full">
      <header className="w-full flex justify-between  mb-2">
        <h1 className="text-xl md:text-3xl font-bold mt-2">Settings</h1>

        <Link
          href="/dashboard"
          className="text-md md:text-xl font-bold mb-2 bg-slate-800 w-36 h-12 rounded-xl shadow-black shadow-2xl hover:bg-slate-700 transition-all cursor-pointer flex justify-center items-center"
        >
          Dashboard
        </Link>
      </header>

      {/* Profile Section */}

      <div className="w-[90%] md:w-[70%] mx-auto">
        <section className="bg-gray-900 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-6">Profile</h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {profileMsg && (
              <p
                className={`text-sm ${profileMsg.includes("success") ? "text-green-400" : "text-red-400"}`}
              >
                {profileMsg}
              </p>
            )}

            <button
              onClick={handleProfileSave}
              disabled={profileLoading}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-6 py-3 rounded-xl font-medium transition"
            >
              {profileLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </section>

        {/* Sound Section */}
        <section className="bg-gray-900 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2">Notification Sound</h2>
          <p className="text-gray-400 text-sm mb-6">
            This sound plays for all users when a lead is logged.
          </p>

          <audio ref={audioRef} />

          {soundUrl ? (
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handlePreview}
                className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-2 rounded-xl text-sm transition"
              >
                ▶ Preview
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-2 rounded-xl text-sm transition"
              >
                Replace
              </button>
              <button
                onClick={handleSoundDelete}
                disabled={soundLoading}
                className="bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white px-5 py-2 rounded-xl text-sm transition"
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={soundLoading}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-6 py-3 rounded-xl font-medium transition"
            >
              {soundLoading ? "Uploading..." : "Upload Sound"}
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleSoundUpload}
          />

          {soundMsg && (
            <p
              className={`mt-3 text-sm ${soundMsg.includes("!") ? "text-green-400" : "text-red-400"}`}
            >
              {soundMsg}
            </p>
          )}
        </section>

        {/* Lead History Section */}
        <section className="bg-gray-900 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-6">My Lead History</h2>

          {historyLoading ? (
            <p className="text-gray-500 text-sm">Loading...</p>
          ) : leads.length === 0 ? (
            <p className="text-gray-500 text-sm">No leads yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-800">
                  <th className="text-left py-2">Campaign</th>
                  <th className="text-right py-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead._id}
                    className="border-b border-gray-800 hover:bg-gray-800 transition"
                  >
                    <td className="py-3">
                      {lead.campaignId?.name || "Unknown"}
                    </td>
                    <td className="py-3 text-right text-gray-400">
                      {new Date(lead.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
