"use client"

import { useId } from "react"

import { cn } from "@/lib/utils"

/**
 * The mark: a filled tile with the glyph knocked out through a mask, so the
 * holes show whatever is behind them. That keeps it correct in both themes
 * without a second colour — the tile is `currentColor`, the glyph is the page.
 *
 * Glyph = three ascending bars (the leaderboard) with a detached dot over the
 * first one (the lead that just landed and made a noise).
 */
function LogoMark({
  size = 24,
  className,
  ...props
}: React.ComponentProps<"svg"> & { size?: number }) {
  // Two <Logo /> on one page would otherwise collide on the mask id.
  const maskId = useId()

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-label="Daily Dashboard"
      className={cn("shrink-0", className)}
      {...props}
    >
      <mask id={maskId}>
        {/* White keeps, black cuts. */}
        <rect width="24" height="24" rx="6.5" fill="white" />
        <circle cx="6.4" cy="10.2" r="1.6" fill="black" />
        <rect x="5" y="13.5" width="2.8" height="5.5" rx="1.4" fill="black" />
        <rect x="10.6" y="10.5" width="2.8" height="8.5" rx="1.4" fill="black" />
        <rect x="16.2" y="7" width="2.8" height="12" rx="1.4" fill="black" />
      </mask>

      <rect
        width="24"
        height="24"
        rx="6.5"
        fill="currentColor"
        mask={`url(#${maskId})`}
      />
    </svg>
  )
}

/** Mark + wordmark. Inherits colour, so it works on any surface. */
function Logo({
  size = 24,
  className,
  wordmarkClassName,
  ...props
}: React.ComponentProps<"span"> & { size?: number; wordmarkClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)} {...props}>
      <LogoMark size={size} />
      <span
        className={cn(
          "text-[15px] tracking-tight whitespace-nowrap",
          wordmarkClassName
        )}
      >
        <span className="font-normal">Daily</span>
        <span className="font-semibold">Dashboard</span>
      </span>
    </span>
  )
}

export { Logo, LogoMark }
export default Logo
