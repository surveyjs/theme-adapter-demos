"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  MoonIcon,
  SunIcon,
  PaletteIcon,
  DropletIcon,
  PaintbrushIcon,
  RadiusIcon,
  CheckIcon,
} from "lucide-react";
import {
  pagePathFromPathname,
  themeFromPathname,
  themedPath,
} from "@adapter/schemas";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStyle } from "./StyleProvider";
import { useBaseColor } from "./BaseColorProvider";
import { useThemeColor } from "./ThemeColorProvider";
import { useRadius } from "./RadiusProvider";
import {
  DEFAULT_STYLE_ID,
  isVisualStyleId,
  VISUAL_STYLES,
  type VisualStyleId,
} from "@/lib/styles";
import { BASE_COLORS } from "@/lib/baseColors";
import { THEMES } from "@/lib/themes";
import { RADII } from "@/lib/radii";

/**
 * Header theme controls. Visual style navigates to `/<style>/<page>`;
 * other axes stay client-side (localStorage / next-themes).
 */
export function ThemeSwitcher() {
  const { resolvedTheme, setTheme } = useTheme();
  const { style } = useStyle();
  const { baseColor, setBaseColor } = useBaseColor();
  const { theme: accent, setTheme: setAccent } = useThemeColor();
  const { radius, setRadius } = useRadius();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-9 w-[140px]" aria-hidden />;
  }

  const isDark = resolvedTheme === "dark";

  const selectStyle = (next: VisualStyleId) => {
    if (next === style) return;
    router.push(themedPath(next, pagePathFromPathname(pathname)));
  };

  // Prefer URL segment (source of truth) over context if they ever drift.
  const themeSegment = themeFromPathname(pathname);
  const activeStyle = isVisualStyleId(themeSegment)
    ? themeSegment
    : style ?? DEFAULT_STYLE_ID;

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <PaletteIcon />
            <span className="hidden sm:inline">
              {VISUAL_STYLES.find((s) => s.id === activeStyle)?.label ?? "Style"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel>Visual style</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {VISUAL_STYLES.map((s) => (
            <DropdownMenuItem
              key={s.id}
              onSelect={() => selectStyle(s.id)}
              className="justify-between"
            >
              {s.label}
              {s.id === activeStyle && <CheckIcon className="size-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <DropletIcon />
            <span className="hidden sm:inline">
              {BASE_COLORS.find((c) => c.id === baseColor)?.label ?? "Base color"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel>Base color</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {BASE_COLORS.map((c) => (
            <DropdownMenuItem
              key={c.id}
              onSelect={() => setBaseColor(c.id)}
              className="justify-between"
            >
              {c.label}
              {c.id === baseColor && <CheckIcon className="size-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <PaintbrushIcon />
            <span className="hidden sm:inline">
              {THEMES.find((t) => t.id === accent)?.label ?? "Theme"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {THEMES.map((t) => (
            <DropdownMenuItem
              key={t.id}
              onSelect={() => setAccent(t.id)}
              className="justify-between"
            >
              {t.label}
              {t.id === accent && <CheckIcon className="size-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <RadiusIcon />
            <span className="hidden sm:inline">
              {RADII.find((r) => r.id === radius)?.label ?? "Radius"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel>Radius</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {RADII.map((r) => (
            <DropdownMenuItem
              key={r.id}
              onSelect={() => setRadius(r.id)}
              className="justify-between"
            >
              {r.label}
              {r.id === radius && <CheckIcon className="size-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="icon"
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        onClick={() => setTheme(isDark ? "light" : "dark")}
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </Button>
    </div>
  );
}
