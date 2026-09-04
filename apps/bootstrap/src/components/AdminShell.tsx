"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { isActiveRoute, routes } from "@adapter/schemas";
import { Container, Navbar, Offcanvas } from "react-bootstrap";
import { Sidebar } from "./Sidebar";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { AllQuestionsToggle } from "./AllQuestionsToggle";
import { BorderlessToggle } from "./BorderlessToggle";
import "./AdminShell.css";

const NAV_ID = "admin-nav";

/**
 * Header brand cluster: product link, the framework badge and the docs link.
 * Stays put at every width — the drawer carries no brand of its own. The
 * brand is the only part allowed to shrink (see AdminShell.css), so the row
 * never wraps.
 */
function Brand() {
  return (
    <>
      <Navbar.Brand className="fw-bold d-flex align-items-center me-2">
        <a
          href="https://surveyjs.io/documentation/theme-adapters"
          target="_blank"
          rel="noreferrer"
          className="link-body-emphasis link-underline link-underline-opacity-0 link-underline-opacity-100-hover text-truncate"
        >
          SurveyJS Theme Adapters
        </a>
      </Navbar.Brand>
      <span className="badge text-bg-primary fw-normal">Bootstrap</span>
      {/* Divider earns its place only next to the full "Documentation" text,
          which is itself lg-only. */}
      <span className="vr align-self-center h-50 d-none d-lg-inline-block" />
      <a
        href="https://surveyjs.io/documentation/theme-adapters#bootstrap"
        target="_blank"
        rel="noreferrer"
        // Below lg only the external-link arrow is left, so the header row
        // still fits a phone; the name lives on aria-label / title.
        aria-label="Documentation"
        title="Documentation"
        className="link-body-emphasis link-underline link-underline-opacity-0 link-underline-opacity-100-hover d-flex align-items-center gap-1 small"
      >
        <span className="d-none d-lg-inline">Documentation</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7" /><path d="M7 7h10v10" /></svg>
      </a>
    </>
  );
}

/**
 * Classic admin layout built from react-bootstrap: a fixed top header, a
 * persistent sidebar on large screens (an Offcanvas drawer on small screens),
 * and a scrolling content area. All chrome — no SurveyJS yet.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  // The Builder hosts the full-height SurveyJS Creator, which needs the whole
  // viewport — so it renders edge-to-edge: no content padding, no fluid gutter,
  // filling the area below the sticky header. Every other route keeps the
  // padded reading column.
  const pathname = usePathname();
  const isBuilder = isActiveRoute(pathname, routes.builder);

  // The drawer and its scrim are portaled to <body> and positioned against the
  // viewport, so they can only be held below the header if they know how tall
  // it is — and that varies by theme (57px on Bootstrap, 73px on Darkly).
  // Publish the measured height for AdminShell.css to offset them with.
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const publish = () =>
      document.documentElement.style.setProperty(
        "--app-header-h",
        `${header.getBoundingClientRect().height}px`
      );
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(header);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--app-header-h");
    };
  }, []);

  return (
    <div className="d-flex flex-column min-vh-100 vh-100 bg-body-tertiary">
      <Navbar
        ref={headerRef}
        as="header"
        sticky="top"
        // Gutter and gaps tighten as the viewport narrows — that reclaimed
        // space is what keeps the row unwrapped down to phone widths.
        className="app-header bg-body border-bottom shadow-sm px-2 px-lg-3 gap-1 gap-sm-2 gap-lg-3"
        // Must carry a breakpoint: plain `expand` emits `.navbar-expand`, whose
        // `.navbar-toggler { display: none }` rule has no media query and would
        // hide the burger at every width.
        expand="lg"
      >
        <Navbar.Toggle
          label="Toggle navigation"
          aria-controls={NAV_ID}
          aria-expanded={navOpen}
          className="d-lg-none me-2"
          // Toggles, not opens: the drawer now starts below the header, so the
          // button stays clickable while it is open and has to close it.
          // Hidden with the sidebar when framed (`data-embedded`, see
          // AdminShell.css) — it opens the nav that is gone there.
          onClick={() => setNavOpen((open) => !open)}
        />
        {/* Deliberately not wrapped in a container: as direct navbar children
            each piece is sized by the navbar itself, so only the brand shrinks
            when the row runs short. Inside a container the cluster would be a
            single flex item and the badge and docs link would shrink with it. */}
        <Brand />
        {/* Holds the right end of the single header row at every width: the
            cluster keeps its size — switch captions are named in full and are
            `text-nowrap` — and the brand is the one item that yields, ellipsising
            as the row runs short (see AdminShell.css). */}
        <div className="app-header-controls ms-auto d-flex justify-content-end align-items-center gap-1 gap-sm-2 gap-lg-3">
          {/* Renders only on survey routes — hidden on /, /builder and /records. */}
          <BorderlessToggle />
          {/* Route-scoped: only renders on /all-questions. */}
          <AllQuestionsToggle />
          <ThemeSwitcher />
        </div>
      </Navbar>

      {/* `height: 0` + flex-grow locks this row to the space below the header so
          Creator / content children can use height: 100% without growing past
          the viewport (same pattern as the shadcn AdminShell). */}
      <div className="d-flex flex-grow-1" style={{ minHeight: 0, height: 0 }}>
        {/* Persistent sidebar (large screens). Both this and the burger go
            away when the demo is framed (`data-embedded` on <html>, see
            lib/embedded + AdminShell.css): the page hosting the iframe
            carries the navigation. */}
        <aside
          className="app-sidebar d-none d-lg-block border-end bg-body h-100"
          style={{ width: 280, flexShrink: 0, overflowY: "auto" }}
        >
          <Sidebar />
        </aside>

        {/* Drawer sidebar (small screens only; persistent aside handles ≥lg) */}
        <Offcanvas
          id={NAV_ID}
          show={navOpen}
          onHide={() => setNavOpen(false)}
          // `app-drawer` / `app-drawer-backdrop` only exist to win on
          // specificity in AdminShell.css, which parks both below the header.
          className="d-lg-none app-drawer"
          backdropClassName="app-drawer-backdrop"
          // Matches the persistent aside (and the MUI drawer) instead of
          // Bootstrap's 400px default, which swallows a phone screen whole and
          // leaves no backdrop to tap.
          style={{ width: 280 }}
          // Nav only: no brand, no close button — the header stays visible
          // above the drawer and its toggle closes it, as do the backdrop,
          // Escape and picking a route. `aria-label` replaces the accessible
          // name the dropped Offcanvas.Title used to provide.
          aria-label="Navigation"
        >
          <Offcanvas.Body className="p-0" onClick={() => setNavOpen(false)}>
            <Sidebar />
          </Offcanvas.Body>
        </Offcanvas>

        <main
          className={isBuilder ? "flex-grow-1" : "flex-grow-1 p-3 p-md-4"}
          // Builder hosts Creator's own scroll + responsivity surface. A nested
          // overflow scroller here breaks that layout: absolute surface tools
          // stack under a selected page instead of sitting in the reserved
          // gutter (and hiding when Creator enters compact/mobile width).
          style={{
            minWidth: 0,
            minHeight: 0,
            overflowY: isBuilder ? "hidden" : "auto",
          }}
        >
          {isBuilder ? (
            <div style={{ height: "100%" }}>{children}</div>
          ) : (
            <Container fluid className="px-0" style={{ height: "100%" }}>
              {children}
            </Container>
          )}
        </main>
      </div>
    </div>
  );
}
