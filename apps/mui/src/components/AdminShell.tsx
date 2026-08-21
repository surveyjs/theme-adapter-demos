"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { routes } from "@adapter/schemas";
import MenuIcon from "@mui/icons-material/Menu";
import WidgetsIcon from "@mui/icons-material/Widgets";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { Sidebar } from "./Sidebar";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { AllQuestionsToggle } from "./AllQuestionsToggle";

const DRAWER_WIDTH = 280;
const ADAPTER_URL = "https://surveyjs.io/documentation/theme-adapters";

/**
 * Classic MUI admin layout, native chrome only — no SurveyJS yet.
 *  - a full-width AppBar (above the drawer) with the brand + theme controls
 *  - a permanent Drawer on md+ screens, a temporary one toggled on mobile
 *  - a scrolling content Container
 *
 * Everything re-themes through the MUI CSS variables emitted by `cssVariables`,
 * so the light/dark toggle and palette menu re-skin the whole shell for free.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  // The Builder hosts the full-height SurveyJS Creator, which needs the whole
  // viewport — so it renders edge-to-edge: no centered Container, no content
  // padding, filling the area below the fixed AppBar. Every other route keeps
  // the padded, max-width reading column.
  const pathname = usePathname();
  const isBuilder = pathname === routes.builder;

  const brand = (
    <Toolbar sx={{ gap: 1 }}>
      <Link
        href={ADAPTER_URL}
        target="_blank"
        rel="noreferrer"
        underline="hover"
        color="inherit"
        sx={{ display: "flex", alignItems: "center", gap: 1, flexGrow: 1 }}
      >
        <WidgetsIcon color="primary" />
        <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
          SurveyJS Theme Adapters
        </Typography>
      </Link>
    </Toolbar>
  );

  return (
    <Box sx={{ display: "flex", height: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <IconButton
            color="inherit"
            edge="start"
            aria-label="Toggle navigation"
            // Toggles, not opens: the AppBar outranks the Drawer's z-index, so
            // the button stays clickable while the drawer is open and has to
            // close it.
            onClick={() => setMobileOpen((open) => !open)}
            sx={{ display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Link
            href={ADAPTER_URL}
            target="_blank"
            rel="noreferrer"
            underline="hover"
            color="inherit"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <WidgetsIcon color="primary" sx={{ display: { xs: "none", md: "block" } }} />
            <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
              SurveyJS Theme Adapters
            </Typography>
          </Link>
          <Chip label="MUI" color="primary" size="small" />
          <Box component="span" sx={{ height: 20, width: "1px", bgcolor: "divider", alignSelf: "center" }} />
          <Link
            href="https://surveyjs.io/documentation/theme-adapters#material-ui-mui"
            target="_blank"
            rel="noreferrer"
            underline="hover"
            color="text.secondary"
            sx={{ display: "flex", alignItems: "center", gap: 0.5, fontSize: 12 }}
          >
            Documentation
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7" /><path d="M7 7h10v10" /></svg>
          </Link>
          <Box sx={{ flexGrow: 1 }} />
          {/* Route-scoped: only renders on /all-questions. */}
          <AllQuestionsToggle />
          <ThemeSwitcher />
        </Toolbar>
      </AppBar>

      {/* Navigation drawers. The persistent variant owns md+; the temporary one
          owns smaller screens and closes on navigation. */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" },
          }}
        >
          {brand}
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </Drawer>

        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" },
          }}
        >
          {/* Spacer matching the AppBar height so nav sits below the header. */}
          <Toolbar />
          <Sidebar />
        </Drawer>
      </Box>

      {/* Column flex + `height: 0` / flexGrow on the content pane locks the
          area below the AppBar spacer to the remaining viewport — same pattern
          as the Bootstrap AdminShell (`vh-100` shell, `height: 0` + grow row,
          `height: 100%` content). */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          minHeight: 0,
          height: "100%",
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Spacer matching the fixed AppBar height. */}
        <Toolbar sx={{ flexShrink: 0 }} />
        {isBuilder ? (
          // Fill the remaining height below the AppBar spacer; the Creator inside
          // stretches to 100% of this region.
          <Box sx={{ flexGrow: 1, minHeight: 0, height: 0 }}>{children}</Box>
        ) : (
          <Container
            maxWidth="xl"
            sx={{ py: { xs: 3, md: 4 }, flexGrow: 1, minHeight: 0, height: 0 }}
          >
            {children}
          </Container>
        )}
      </Box>
    </Box>
  );
}
