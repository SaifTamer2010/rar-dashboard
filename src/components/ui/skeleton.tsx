import { cn } from "@/lib/utils";

/** Base shimmer block. Size it with className, same as any div. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

/**
 * Wraps a loading region so screen readers announce it instead of reading the
 * decorative blocks. Every composed skeleton below renders inside one.
 */
function SkeletonRegion({
  label = "Loading",
  className,
  children,
}: {
  label?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={className}>
      {children}
      <span className="sr-only">{label}…</span>
    </div>
  );
}

/** Stacked lines of text. Last line is short, the way real copy wraps. */
function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <SkeletonRegion className={cn("space-y-2", className)} label="Loading text">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 ? "w-2/5" : "w-full")}
        />
      ))}
    </SkeletonRegion>
  );
}

/**
 * Divided list rows inside an existing bordered card — matches the
 * `divide-y` list pattern used across the teams / agents / users pages.
 */
function SkeletonRows({
  rows = 4,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <SkeletonRegion className={cn("divide-y", className)} label="Loading list">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Skeleton className="size-8 shrink-0 rounded-md" />
            <div className="min-w-0 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
        </div>
      ))}
    </SkeletonRegion>
  );
}

/** Row of stat tiles. */
function SkeletonStats({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <SkeletonRegion
      className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}
      label="Loading stats"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-background p-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-7 w-14" />
        </div>
      ))}
    </SkeletonRegion>
  );
}

/** Label + input pairs, for settings forms that load their values. */
function SkeletonFields({
  fields = 3,
  className,
}: {
  fields?: number;
  className?: string;
}) {
  return (
    <SkeletonRegion className={cn("space-y-4", className)} label="Loading form">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
    </SkeletonRegion>
  );
}

export {
  Skeleton,
  SkeletonRegion,
  SkeletonText,
  SkeletonRows,
  SkeletonStats,
  SkeletonFields,
};
