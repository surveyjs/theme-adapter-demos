import { redirect } from "next/navigation";
import { DEFAULT_STYLE_ID } from "@/lib/styles";

/** Root → default visual style home (`/base-rhea`). */
export default function RootPage() {
  redirect(`/${DEFAULT_STYLE_ID}`);
}
