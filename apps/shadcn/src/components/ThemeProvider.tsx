"use client";

import type { ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { StyleProvider } from "./StyleProvider";
import { BaseColorProvider } from "./BaseColorProvider";
import { ThemeColorProvider } from "./ThemeColorProvider";
import { RadiusProvider } from "./RadiusProvider";

/**
 * Client theming runtime:
 *  - visual style from URL (`/[theme]/…`) via StyleProvider
 *  - light/dark via next-themes
 *  - base color / accent / radius via attribute providers (localStorage)
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <StyleProvider>
        <BaseColorProvider>
          <ThemeColorProvider>
            <RadiusProvider>{children}</RadiusProvider>
          </ThemeColorProvider>
        </BaseColorProvider>
      </StyleProvider>
    </NextThemesProvider>
  );
}
