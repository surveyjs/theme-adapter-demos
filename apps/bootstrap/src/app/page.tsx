import { redirect } from "next/navigation";
import { DEFAULT_THEME } from "@/lib/themes";

/** Root → default theme home (`/default`). */
export default function RootPage() {
  redirect(`/${DEFAULT_THEME}`);
}
