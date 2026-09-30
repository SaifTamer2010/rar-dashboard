"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Search } from "lucide-react";

import { Logo } from "@/components/Logo";
import { LinkButton } from "@/components/ui/button";
import { roleHome } from "@/lib/roles";

/**
 * Signed-in visitors are sent back to their own role home rather than to "/",
 * which is the marketing page and not where anyone in the app wants to land.
 *
 * Worth knowing: a signed-out visitor rarely reaches this screen. `src/proxy.ts`
 * redirects any unknown path to /sign-in when there is no session, so the app
 * does not advertise which routes exist. That is deliberate — this page is for
 * people who are already inside and mistyped or followed a stale link.
 */
export default function NotFound() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const loading = status === "loading";
  const home = session ? roleHome(session.user?.role) : "/";
  const homeLabel = session ? "Back to your dashboard" : "Back to home";

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="px-6 py-6">
        <Link href={home} className="inline-flex" aria-label={homeLabel}>
          <Logo size={22} />
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-20">
        <div className="w-full max-w-lg text-center">
          <div
            aria-hidden
            className="mx-auto flex size-14 items-center justify-center rounded-2xl border bg-background text-muted-foreground"
          >
            <Search className="size-6" />
          </div>

          <p className="mt-6 font-mono text-[13px] tracking-widest text-muted-foreground">
            404
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tighter sm:text-4xl">
            This page doesn&apos;t exist
          </h1>

          <p className="mx-auto mt-3 max-w-md text-[15px] text-muted-foreground">
            The link may be out of date, or the address has a typo in it. Nothing
            is broken on your end.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <LinkButton
              href={home}
              className="h-11 w-full rounded-lg px-5 text-[15px] sm:w-auto"
              // The session decides where "home" is, so wait for it rather than
              // sending someone to the marketing page mid-check.
              isDisabled={loading}
            >
              {homeLabel}
            </LinkButton>

            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border bg-background px-5 text-[15px] font-medium transition-colors hover:bg-muted sm:w-auto"
            >
              <ArrowLeft className="size-4" />
              Go back
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
