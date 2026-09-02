"use client";

import { usePathname } from "next/navigation";
import { isActiveRoute, pagePathFromPathname, routes } from "@adapter/schemas";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useBorderlessMode } from "./BorderlessMode";

export function BorderlessToggle() {
  const pathname = usePathname();
  const { borderless, setBorderless } = useBorderlessMode();
  const page = pagePathFromPathname(pathname);

  if (
    page === routes.home ||
    isActiveRoute(pathname, routes.builder) ||
    isActiveRoute(pathname, routes.records)
  ) {
    return null;
  }

  return (
    <Label htmlFor="borderless-questions" className="gap-2 flex items-center">
      <Switch
        id="borderless-questions"
        checked={borderless}
        onCheckedChange={setBorderless}
        // The label drops out below `md` so the header stays a single row —
        // below that width its width is the brand title's ellipsis instead. The
        // switch keeps its name through aria-label, and title surfaces it on
        // hover — same pair the Bootstrap shell puts on its Form.Check.
        aria-label="Cardless questions"
        title="Cardless questions"
      />
      <span className="hidden md:inline">Cardless questions</span>
    </Label>
  );
}
