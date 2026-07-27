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
    <Label htmlFor="borderless-questions" className="gap-2">
      <Switch
        id="borderless-questions"
        checked={borderless}
        onCheckedChange={setBorderless}
      />
      <span className="hidden sm:inline">Borderless questions</span>
    </Label>
  );
}
