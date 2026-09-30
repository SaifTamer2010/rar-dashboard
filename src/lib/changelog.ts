/**
 * Release notes shown by the "what's new" dialog.
 *
 * Newest entry first — CHANGELOG[0].version is the app version (see src/lib/version.ts),
 * and a user sees every entry newer than the one stored on their profile. Add a release
 * by prepending an entry here; nothing else needs touching.
 */

/** How a single line item is coloured in the dialog. */
export type HighlightTag = "new" | "improved" | "fixed" | "security";

export interface ChangelogHighlight {
  title: string;
  description: string;
  tag?: HighlightTag;
}

export interface ChangelogEntry {
  /** Plain three-part semver, e.g. "1.2.0". Compared numerically, not as a string. */
  version: string;
  /** ISO date (YYYY-MM-DD) — formatted for display in the dialog. */
  date: string;
  /** One-line framing for the release. */
  summary: string;
  highlights: ChangelogHighlight[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.2.0",
    date: "2026-08-27",
    summary: "Every role now has its own home, and the interface got a full redesign.",
    highlights: [
      {
        title: "A page per role",
        description:
          "Super admins, business owners, team leaders and agents each land on their own dashboard after signing in instead of sharing one page.",
        tag: "new",
      },
      {
        title: "Business workspaces",
        description:
          "Owners can create teams, invite people by link, assign agents to a team and point campaigns at the teams that should run them.",
        tag: "new",
      },
      {
        title: "Team leader tools",
        description:
          "Leaders get their own dashboard, an agent roster and call intervals for the people they manage.",
        tag: "new",
      },
      {
        title: "Redesigned interface",
        description:
          "The whole dashboard moved to the shared design system — consistent spacing, real dark mode and loading skeletons instead of blank screens.",
        tag: "improved",
      },
      {
        title: "Locked-down routes",
        description:
          "Every API route runs through the same permission guard, and requests are rate limited.",
        tag: "security",
      },
    ],
  },
  {
    version: "1.1.0",
    date: "2026-06-11",
    summary: "Sounds you can reuse, and a tighter sign-in.",
    highlights: [
      {
        title: "Sound store",
        description:
          "Upload your own closing sounds and swap between your recent uploads straight from settings.",
        tag: "new",
      },
      {
        title: "Sessions that stay signed in",
        description:
          "Access and refresh tokens replaced the old session handling, so you stop getting kicked out mid-shift.",
        tag: "security",
      },
      {
        title: "Deactivate without deleting",
        description:
          "Users can be switched off and back on instead of being removed, so their history stays on the leaderboard.",
        tag: "new",
      },
      {
        title: "Property search visibility",
        description:
          "Property search no longer shows up for accounts that were never meant to see it.",
        tag: "fixed",
      },
    ],
  },
];

/** Compares two "1.2.3" strings. Returns > 0 when `a` is newer than `b`. */
export function compareVersions(a: string, b: string): number {
  const left = a.split(".").map((part) => Number(part) || 0);
  const right = b.split(".").map((part) => Number(part) || 0);

  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0);
    if (diff !== 0) return diff;
  }

  return 0;
}

/** Every release newer than what the user last acknowledged, newest first. */
export function entriesSince(seenVersion: string): ChangelogEntry[] {
  return CHANGELOG.filter((entry) => compareVersions(entry.version, seenVersion) > 0);
}

/** "27 Aug 2026" — kept here so the server and the dialog agree on the format. */
export function formatReleaseDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
