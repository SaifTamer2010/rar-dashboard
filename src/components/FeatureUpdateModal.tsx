"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CHANGELOG,
  formatReleaseDate,
  type ChangelogEntry,
  type HighlightTag,
} from "@/lib/changelog";

interface FeatureUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Releases the user has not acknowledged, newest first. Falls back to the latest one. */
  entries?: ChangelogEntry[];
}

const TAG_LABELS: Record<HighlightTag, string> = {
  new: "New",
  improved: "Improved",
  fixed: "Fixed",
  security: "Security",
};

/** Muted by default; only the "new" items pull the eye. */
const TAG_VARIANTS: Record<HighlightTag, "default" | "secondary" | "outline"> = {
  new: "default",
  improved: "secondary",
  fixed: "outline",
  security: "outline",
};

export default function FeatureUpdateModal({
  isOpen,
  onClose,
  entries,
}: FeatureUpdateModalProps) {
  const releases = entries?.length ? entries : CHANGELOG.slice(0, 1);
  const latest = releases[0];

  if (!latest) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      isDismissable
    >
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>What&apos;s new</DialogTitle>
            <Badge variant="outline" className="font-mono">
              v{latest.version}
            </Badge>
          </div>
          <DialogDescription>
            {releases.length > 1
              ? `${releases.length} releases since you were last here.`
              : `Shipped ${formatReleaseDate(latest.date)}.`}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {releases.map((release) => (
            <section key={release.version} className="space-y-3">
              {/* The per-release header only earns its place when there is more than one. */}
              {releases.length > 1 && (
                <div className="flex items-baseline gap-2">
                  <h3 className="text-[13px] font-semibold">v{release.version}</h3>
                  <span className="text-[11px] text-muted-foreground">
                    {formatReleaseDate(release.date)}
                  </span>
                </div>
              )}

              <p className="text-[13px] leading-relaxed text-muted-foreground">
                {release.summary}
              </p>

              <ul className="space-y-3">
                {release.highlights.map((highlight) => (
                  <li
                    key={highlight.title}
                    className="rounded-lg border bg-muted/30 px-3.5 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-medium">{highlight.title}</span>
                      {highlight.tag && (
                        <Badge variant={TAG_VARIANTS[highlight.tag]}>
                          {TAG_LABELS[highlight.tag]}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {highlight.description}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </DialogBody>

        <DialogFooter>
          <Button
            size="lg"
            onPress={onClose}
            className="w-full sm:w-auto sm:px-6"
            autoFocus
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
