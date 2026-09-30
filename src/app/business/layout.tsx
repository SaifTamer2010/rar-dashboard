import { requireRole } from "@/lib/guard";

/** Everything under /business belongs to the business owner. */
export default async function BusinessLayout({ children }: { children: React.ReactNode }) {
  await requireRole("busniess_owner");
  return <>{children}</>;
}
