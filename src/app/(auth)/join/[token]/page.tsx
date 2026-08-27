"use client";

import { use, useEffect, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { roleHome } from "@/lib/roles";

/** Shared input styling — there is no Input in components/ui yet. */
const fieldClass =
  "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground/70 focus-visible:border-muted-foreground focus-visible:ring-[3px] focus-visible:ring-foreground/10 disabled:opacity-50";

const submitClass =
  "w-full cursor-pointer rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50";

export default function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();

  const [companyName, setCompanyName] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Name the lobby they are joining, and fail early on a dead link.
  useEffect(() => {
    fetch(`/api/auth/join?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) {
          setInvalid(true);
          return;
        }
        const data = await res.json();
        setCompanyName(data.companyName);
      })
      .catch(() => setInvalid(true));
  }, [token]);

  async function handleJoin() {
    if (!name.trim() || !email.trim()) {
      setError("Fill in every field.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/join", {
      method: "POST",
      body: JSON.stringify({ token, name, email, password }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error || "Something went wrong.");
      return;
    }

    const signInRes = await signIn("credentials", { email, password, redirect: false });

    if (signInRes?.error) {
      setLoading(false);
      setError("Account created, but sign in failed. Try signing in.");
      return;
    }

    await fetch("/api/auth/set-refresh-token", {
      method: "POST",
      body: JSON.stringify({ email }),
      headers: { "content-Type": "application/json" },
    });

    const fresh = await getSession();
    setLoading(false);
    router.push(roleHome(fresh?.user?.role));
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-background text-foreground lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="hidden flex-col justify-between bg-zinc-950 p-10 text-zinc-50 lg:flex">
        <Link href="/" className="flex w-fit items-center gap-2">
          <div className="flex size-5.5 items-center justify-center rounded-md bg-zinc-50 text-xs text-zinc-950">
            D
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Daily Dashboard</span>
        </Link>

        <div className="flex max-w-[24ch] flex-col gap-4">
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
          <Link href="/" className="flex w-fit items-center gap-2 lg:hidden">
            <div className="flex size-5.5 items-center justify-center rounded-md bg-foreground text-xs text-background">
              D
            </div>
            <span className="text-[15px] font-semibold tracking-tight">Daily Dashboard</span>
          </Link>

          {invalid ? (
            <div className="flex flex-col gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">Invite not valid</h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                This link is expired or wrong. Ask whoever invited you for a fresh one.
              </p>
              <Link
                href="/sign-in"
                className="text-[13px] text-muted-foreground underline underline-offset-[3px] transition-colors hover:text-foreground"
              >
                Go to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Join {companyName || "the team"}
                </h1>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  You were invited. Set up your account to start logging leads.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="name" className="text-[13px] font-medium">
                    Your name
                  </label>
                  <input
                    id="name"
                    type="text"
                    autoFocus
                    placeholder="Dana Whitfield"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={fieldClass}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-[13px] font-medium">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="dana@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={fieldClass}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="password" className="text-[13px] font-medium">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                    className={fieldClass}
                  />
                  <span className="text-xs text-muted-foreground">At least 6 characters.</span>
                </div>

                <button onClick={handleJoin} disabled={loading} className={submitClass}>
                  {loading ? "Joining..." : "Join the team"}
                </button>
              </div>

              {error && (
                <p role="alert" className="text-center text-sm text-destructive">
                  {error}
                </p>
              )}

              <Link
                href="/sign-in"
                className="cursor-pointer text-center text-[13px] text-muted-foreground underline underline-offset-[3px] transition-colors hover:text-foreground"
              >
                Already have an account? Sign in
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
