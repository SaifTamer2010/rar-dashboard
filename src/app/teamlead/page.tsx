import { redirect } from "next/navigation";

/** The leader's home is the dashboard tab. */
export default function TeamLeadPage() {
  redirect("/teamlead/dashboard");
}
