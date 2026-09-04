"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { isActiveRoute, routes } from "@adapter/schemas";
import { MenuIcon, LayersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavDrawer } from "./NavDrawer";
import { Sidebar } from "./Sidebar";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { AllQuestionsToggle } from "./AllQuestionsToggle";
import { BorderlessToggle } from "./BorderlessToggle";

/**
 * Classic shadcn/ui admin layout, native chrome only — no SurveyJS yet.
 *  - a sticky top header (brand + visual-style + light/dark controls)
 *  - a permanent sidebar on lg+ screens; a Sheet drawer on smaller screens
 *  - a scrolling content area
 *
 * Everything reads the shadcn sidebar/background/border tokens, so the light/dark
 * toggle and the visual-style switcher re-skin the whole shell for free.
 */
const SIDEBAR_WIDTH = "17rem";

/**
 * Header brand cluster: product link, the framework badge and the docs link.
 * Stays put at every width — the drawer carries no brand of its own, matching
 * the Bootstrap shell.
 *
 * The row is a tight budget, so it sheds parts as it narrows: the "Documentation"
 * text and the divider below `lg` (the arrow alone still carries the link, as in
 * the Bootstrap shell), then the badge and that arrow below `sm` — where the
 * theme controls leave nothing to spare — leaving the bare title. The icon tile
 * is `lg`-only either way, since the burger already marks that end of the header.
 * The title is the one item allowed to shrink (`min-w-0` + `truncate`), so it
 * ellipsises rather than wrapping the row.
 *
 * Keeping the badge and the link down to `sm` is what sets the label
 * breakpoints on the other side of the row: the full cluster is 407px, so the
 * theme-switcher labels wait for `xl` (see ThemeSwitcher) and the switch
 * captions for `md`. Without that the title ellipsised to nothing at 1024 and
 * 640 — the two widths where a label group appears but the extra room does not.
 */
function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-2 overflow-hidden lg:gap-4">
      <a
        href="https://surveyjs.io/documentation/theme-adapters"
        target="_blank"
        rel="noreferrer"
        className="flex min-w-0 items-center gap-2 text-inherit hover:underline"
      >
        <span className="bg-primary text-primary-foreground hidden size-8 shrink-0 items-center justify-center rounded-md lg:flex">
          <LayersIcon className="size-4" />
        </span>
        <span className="truncate text-sm font-semibold">SurveyJS Theme Adapters</span>
      </a>
      <span className="bg-secondary text-secondary-foreground hidden shrink-0 rounded-full px-2 py-0.5 text-xs font-medium sm:inline-block">
        shadcn
      </span>
      {/* Divider earns its place only next to the full "Documentation" text,
          which is itself lg-only. */}
      <span className="bg-border hidden h-5 w-px shrink-0 lg:inline-block" />
      <a
        href="https://surveyjs.io/documentation/theme-adapters#shadcnui"
        target="_blank"
        rel="noreferrer"
        // Below lg only the external-link arrow is left, so the header row still
        // fits a tablet; the name lives on aria-label / title.
        aria-label="Documentation"
        title="Documentation"
        className="text-muted-foreground hover:text-foreground hidden shrink-0 items-center gap-1 text-xs sm:flex"
      >
        <span className="hidden lg:inline">Documentation</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7" /><path d="M7 7h10v10" /></svg>
      </a>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  // The Builder hosts the full-height SurveyJS Creator, which needs the whole
  // viewport — so it renders edge-to-edge: no centered max-width, no content
  // padding, and a height pinned to the area below the sticky header. Every
  // other route keeps the padded, max-width reading column.
  const pathname = usePathname();
  const isBuilder = isActiveRoute(pathname, routes.builder);

  return (
    <div className="bg-background text-foreground flex h-svh min-h-svh flex-col">
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b px-3 backdrop-blur sm:gap-3 sm:px-4">
        {/* Mobile nav trigger. It opens the nav that is gone when framed,
            so it goes with it (`embedded:hidden`, see lib/embedded). */}
        <NavDrawer
          open={mobileOpen}
          onOpenChange={setMobileOpen}
          trigger={
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 lg:hidden embedded:hidden"
              aria-label="Open navigation"
            >
              <MenuIcon />
            </Button>
          }
        >
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </NavDrawer>

        <Brand />

        <div className="ml-auto flex shrink-0 items-center gap-3">
          {/* Route-scoped: only renders on /all-questions. */}
          <AllQuestionsToggle />
          {/* Shown only where a page-level survey is mounted (/claims, /checkout,
              /all-questions); hidden on the Dashboard, Builder and Records. */}
          <BorderlessToggle />
          <ThemeSwitcher />
        </div>
      </header>

      {/* `height: 0` + flex-1 locks this row to the space below the header so
          survey / content children can use height: 100% without growing past
          the viewport (same pattern as the Bootstrap AdminShell). */}
      <div className="flex min-h-0 flex-1" style={{ height: 0 }}>
        {/* Permanent sidebar (lg+). Goes away when the demo is framed
            (`data-embedded` on <html>, see lib/embedded): the page hosting
            the iframe carries the navigation. `main` keeps its flex-1 and
            reclaims the freed width on its own. */}
        <aside
          className="bg-sidebar text-sidebar-foreground hidden h-full shrink-0 overflow-y-auto border-r lg:block embedded:hidden"
          style={{ width: SIDEBAR_WIDTH }}
        >
          <Sidebar />
        </aside>

        <main className="min-h-0 min-w-0 flex-1">
          {isBuilder ? (
            <div className="h-full">{children}</div>
          ) : (
            <div className="mx-auto h-full w-full max-w-[96rem] px-4 py-6 sm:px-6 lg:py-8">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
