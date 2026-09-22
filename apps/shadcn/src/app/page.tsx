import { redirect } from "next/navigation";
import { DEFAULT_STYLE_ID } from "@/lib/styles";

/**
 * Root → default visual style home (`/base-rhea`).
 * The query string has to come along: `sidebar=0` / `header=0` are read from
 * the URL before first paint, and a redirect that drops them would show the
 * chrome this request asked to hide.
 */
export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") query.append(key, value);
    else if (Array.isArray(value)) for (const item of value) query.append(key, item);
  }
  const qs = query.toString();
  redirect(qs ? `/${DEFAULT_STYLE_ID}?${qs}` : `/${DEFAULT_STYLE_ID}`);
}
