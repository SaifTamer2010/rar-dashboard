import { requireRole } from "@/lib/guard";

/** Everything under /admin is super-admin only, checked before any page runs. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("super_admin");
  return <>{children}</>;
}
