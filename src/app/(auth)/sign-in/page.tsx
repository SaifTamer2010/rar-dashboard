"use client";

import { useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { roleHome } from "@/lib/roles";

/** Shared input styling — there is no Input in components/ui yet. */
const fieldClass =
  "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground/70 focus-visible:border-muted-foreground focus-visible:ring-[3px] focus-visible:ring-foreground/10 disabled:opacity-50";

const submitClass =
  "w-full cursor-pointer rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"email" | "password" | "create">("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1 — check if user exists and has a password
  async function handleEmailSubmit() {
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/check-user", {
      method: "POST",
      body: JSON.stringify({ email }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    setLoading(false);

    if (!data.exists) {
      setError("No account found with that email.");
      return;
    }

    setName(data.name ?? "");

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
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Incorrect password.");
      return;
    }

    await fetch('api/auth/set-refresh-token',{method:"POST" , body:JSON.stringify({email}) , headers:{"content-Type":"application/json"}})

    const fresh = await getSession();
    router.push(roleHome(fresh?.user?.role));
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
      body: JSON.stringify({ email, password }),
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
      email,
      password,
      redirect: false,
    });
    await fetch('api/auth/set-refresh-token',{method:"POST" , body:JSON.stringify({email}) , headers:{"content-Type":"application/json"}})

    const fresh = await getSession();
    setLoading(false);
    router.push(roleHome(fresh?.user?.role));
  }

  function goBack() {
    setStep("email");
    setPassword("");
    setConfirmPassword("");
    setError("");
  }

  const heading =
    step === "create" ? "Set your password" : step === "password" ? "Welcome back" : "Sign in";

  const subheading =
    step === "create"
      ? `First time here — pick a password for ${name || email}.`
      : step === "password"
        ? `Signing in as ${name || email}.`
        : "Enter your email to continue to your dashboard.";

  return (
    <div className="grid min-h-screen grid-cols-1 bg-background text-foreground lg:grid-cols-[60%_40%]">
      {/* Brand panel */}
      <aside className="hidden flex-col justify-between bg-zinc-950 p-10 text-zinc-50 lg:flex">
        <Link href="/" className="flex w-fit items-center gap-2">
          <div className="flex size-5.5 items-center justify-center rounded-md bg-zinc-50 text-xs text-zinc-950">
            D
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Daily Dashboard</span>
        </Link>

        <div className="flex max-w-[50ch] flex-col gap-4 mx-auto">
          <p className="text-[32px] leading-tight font-semibold tracking-tighter">
            Every Lead Deserves an Entrance
          </p>
          <p className="max-w-[44ch] text-[15px] leading-relaxed text-zinc-400">
            Pick a campaign, hit the button, and let your custom sound announce it to the whole
            team.
          </p>
        </div>

        <span className="font-mono text-xs text-zinc-500">
          Free forever · No credit card · No lead data
        </span>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center p-10">
        <div className="flex w-full max-w-96 flex-col gap-6">
          {/* Mobile-only brand, since the aside is hidden below lg */}
          <Link href="/" className="flex w-fit items-center gap-2 lg:hidden">
            <div className="flex size-5.5 items-center justify-center rounded-md bg-foreground text-xs text-background">
              D
            </div>
            <span className="text-[15px] font-semibold tracking-tight">Daily Dashboard</span>
          </Link>

          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">{subheading}</p>
          </div>

          {/* Step 1 — Email */}
          {step === "email" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-[13px] font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoFocus
                  placeholder="dana@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
                  className={fieldClass}
                />
              </div>
              <button onClick={handleEmailSubmit} disabled={loading} className={submitClass}>
                {loading ? "Checking..." : "Continue"}
              </button>
               <Link
            href="/sign-in"
            className="cursor-pointer text-center text-[13px] text-muted-foreground underline underline-offset-[3px] transition-colors hover:text-foreground"
          >
            Doesn't have an email yet? Sign up
          </Link>
            </div>
            
          )}

          {/* Step 2a — Existing password */}
          {step === "password" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-[13px] font-medium">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoFocus
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                  className={fieldClass}
                />
              </div>
              <button onClick={handleSignIn} disabled={loading} className={submitClass}>
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          )}

          {/* Step 2b — Create password */}
          {step === "create" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="new-password" className="text-[13px] font-medium">
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  autoFocus
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={fieldClass}
                />
                <span className="text-xs text-muted-foreground">At least 6 characters.</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirm-password" className="text-[13px] font-medium">
                  Confirm password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreatePassword()}
                  className={fieldClass}
                />
              </div>
              <button onClick={handleCreatePassword} disabled={loading} className={submitClass}>
                {loading ? "Creating..." : "Create password & sign in"}
              </button>
            </div>
          )}

          {error && (
            <p role="alert" className="text-center text-sm text-destructive">
              {error}
            </p>
          )}

          {step !== "email" && (
            <button
              onClick={goBack}
              className="cursor-pointer text-center text-[13px] text-muted-foreground underline underline-offset-[3px] transition-colors hover:text-foreground"
            >
              Use a different email
            </button>
          )}
          
        </div>
      </main>
    </div>
  );
}
