"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { isActiveRoute, routes } from "@adapter/schemas";
import { Container, Navbar, Offcanvas } from "react-bootstrap";
import { Sidebar } from "./Sidebar";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { AllQuestionsToggle } from "./AllQuestionsToggle";
import { BorderlessToggle } from "./BorderlessToggle";

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

  return (
    <div className="d-flex flex-column min-vh-100 vh-100 bg-body-tertiary">
      <Navbar
        as="header"
        sticky="top"
        className="bg-body border-bottom shadow-sm px-3 gap-3"
        expand
      >
        <Navbar.Toggle
          aria-label="Toggle navigation"
          className="d-lg-none me-2"
          onClick={() => setNavOpen(true)}
        />
        <Navbar.Brand
        className="fw-bold d-flex align-items-center gap-2 me-2"
        >
          <span aria-hidden>🧩</span>
          <a
          href="https://surveyjs.io/documentation/theme-adapters"
          target="_blank"
          rel="noreferrer"
          className="link-body-emphasis link-underline link-underline-opacity-0 link-underline-opacity-100-hover"
          >
          SurveyJS Theme Adapters
          </a>
        </Navbar.Brand>
        <span className="badge text-bg-primary fw-normal">Bootstrap</span>
        <span className="vr align-self-center h-50"/>
        <a
          href="https://surveyjs.io/documentation/theme-adapters#bootstrap"
          target="_blank"
          rel="noreferrer"
          className="link-body-emphasis link-underline link-underline-opacity-0 link-underline-opacity-100-hover d-flex align-items-center gap-1 small"
        >
          Documentation
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7" /><path d="M7 7h10v10" /></svg>
        </a>
        <div className="ms-auto d-flex align-items-center gap-3">
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
        {/* Persistent sidebar (large screens) */}
        <aside
          className="d-none d-lg-block border-end bg-body h-100"
          style={{ width: 280, flexShrink: 0, overflowY: "auto" }}
        >
          <Sidebar />
        </aside>

        {/* Drawer sidebar (small screens only; persistent aside handles ≥lg) */}
        <Offcanvas show={navOpen} onHide={() => setNavOpen(false)} className="d-lg-none">
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>Navigation</Offcanvas.Title>
          </Offcanvas.Header>
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
