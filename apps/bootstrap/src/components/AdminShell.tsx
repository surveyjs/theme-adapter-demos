"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { routes } from "@adapter/schemas";
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
  const isBuilder = pathname === routes.builder;

  return (
    <div className="d-flex flex-column min-vh-100 vh-100 bg-body-tertiary">
      <Navbar
        as="header"
        sticky="top"
        className="bg-body border-bottom shadow-sm px-3"
        expand
      >
        <Navbar.Toggle
          aria-label="Toggle navigation"
          className="d-lg-none me-2"
          onClick={() => setNavOpen(true)}
        />
        <Navbar.Brand
          className="fw-bold d-flex align-items-center gap-2"
          style={{ color: "var(--bs-body-color)" }}
        >
          <span aria-hidden>🧩</span>
          SurveyJS Theme Adapter
          <span className="badge text-bg-primary fw-normal">Bootstrap</span>
        </Navbar.Brand>
        <div className="ms-auto d-flex align-items-center gap-3">
          {/* Renders only on survey routes — hidden on /, /builder and /records. */}
          <BorderlessToggle />
          {/* Route-scoped: only renders on /all-questions. */}
          <AllQuestionsToggle />
          <ThemeSwitcher />
        </div>
      </Navbar>

      <div className="d-flex flex-grow-1" style={{ minHeight: 0 }}>
        {/* Persistent sidebar (large screens) */}
        <aside
          className="d-none d-lg-block border-end bg-body"
          style={{ width: 280, flexShrink: 0 }}
        >
          <div className="position-sticky" style={{ top: "4rem" }}>
            <Sidebar />
          </div>
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
          style={{ minWidth: 0, minHeight: 0, overflowY: "auto" }}
        >
          {isBuilder ? (
            children
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
