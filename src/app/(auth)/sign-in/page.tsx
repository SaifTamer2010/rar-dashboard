"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"name" | "password" | "create">("name");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1 — check if user exists and has a password
  async function handleNameSubmit() {
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/check-user", {
      method: "POST",
      body: JSON.stringify({ name }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    setLoading(false);

    if (!data.exists) {
      setError("No account found with that name.");
      return;
    }

    if (data.hasPassword) {
      setStep("password");
    } else {
      setStep("create");
    }
  }

  // Step 2a — sign in with existing password
  async function handleSignIn() {
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      name,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Incorrect password.");
      return;
    }
    
    await fetch('api/auth/set-refresh-token',{method:"POST" , body:JSON.stringify({name}) , headers:{"content-Type":"application/json"}})

    router.push("/dashboard");
  }

  // Step 2b — create new password then sign in
  async function handleCreatePassword() {
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/create-password", {
      method: "POST",
      body: JSON.stringify({ name, password }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error || "Something went wrong.");
      return;
    }

    // Auto sign in after creating password
    await signIn("credentials", {
      name,
      password,
      redirect: false,
    });
    await fetch('api/auth/set-refresh-token',{method:"POST" , body:JSON.stringify({name}) , headers:{"content-Type":"application/json"}})
    
    setLoading(false);
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
        <p className="text-gray-400 mb-8 text-sm">
          Leads tracker — sign in to continue
        </p>

        {/* Step 1 — Name */}
        {step === "name" && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleNameSubmit}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-medium transition"
            >
              {loading ? "Checking..." : "Continue"}
            </button>
          </div>
        )}

        {/* Step 2a — Existing password */}
        {step === "password" && (
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              Welcome, <span className="text-white font-medium">{name}</span>
            </p>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-medium transition"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
            <button
              onClick={() => setStep("name")}
              className="w-full text-gray-500 hover:text-gray-300 text-sm transition"
            >
              ← Back
            </button>
          </div>
        )}

        {/* Step 2b — Create password */}
        {step === "create" && (
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              First time? Set a password for{" "}
              <span className="text-white font-medium">{name}</span>
            </p>
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreatePassword()}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCreatePassword}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-medium transition"
            >
              {loading ? "Creating..." : "Create password & sign in"}
            </button>
            <button
              onClick={() => setStep("name")}
              className="w-full text-gray-500 hover:text-gray-300 text-sm transition"
            >
              ← Back
            </button>
          </div>
        )}

        {error && (
          <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
