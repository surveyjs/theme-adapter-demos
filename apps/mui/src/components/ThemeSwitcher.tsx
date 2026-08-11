"use client";

import { useState, type MouseEvent } from "react";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import PaletteIcon from "@mui/icons-material/Palette";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import { useColorScheme } from "@mui/material/styles";
import { palettes, paletteForLightScheme } from "@/theme/palettes";

/**
 * Header theme controls, built entirely on MUI's NATIVE color-scheme system:
 *  - a light/dark toggle (`useColorScheme().setMode`)
 *  - a palette menu that picks a preset's { light, dark } color-scheme pair
 *    (`setColorScheme`), composing cleanly with the mode toggle.
 *
 * Both selections are persisted and re-applied before paint by the layout's
 * InitColorSchemeScript — there is zero hand-rolled theming here.
 */
export function ThemeSwitcher() {
  const { mode, systemMode, setMode, lightColorScheme, setColorScheme } =
    useColorScheme();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  // Avoid hydration mismatch: useColorScheme is unresolved on the server.
  if (!mode) {
    return <Box sx={{ width: 200, height: 40 }} aria-hidden />;
  }

  const resolved = mode === "system" ? systemMode : mode;
  const isDark = resolved === "dark";
  const activePalette = paletteForLightScheme(lightColorScheme);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Tooltip title="Color palette">
        <Chip
          icon={<PaletteIcon />}
          label={activePalette.label}
          variant="outlined"
          onClick={(e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget)}
          sx={{ color: "inherit", borderColor: "currentColor" }}
        />
      </Tooltip>

      <Tooltip title={`Switch to ${isDark ? "light" : "dark"} mode`}>
        <Chip
          icon={isDark ? <DarkModeIcon /> : <LightModeIcon />}
          label={isDark ? "Dark" : "Light"}
          variant="outlined"
          onClick={() => setMode(isDark ? "light" : "dark")}
          aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
          sx={{ color: "inherit", borderColor: "currentColor" }}
        />
      </Tooltip>

      <Menu
        anchorEl={anchor}
        open={anchor !== null}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {palettes.map((p) => (
          <MenuItem
            key={p.id}
            selected={p.id === activePalette.id}
            onClick={() => {
              setColorScheme({ light: p.lightKey, dark: p.darkKey });
              setAnchor(null);
            }}
            sx={{ gap: 1.5 }}
          >
            <Box
              aria-hidden
              sx={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                flexShrink: 0,
                background: `linear-gradient(135deg, ${p.light.primary} 50%, ${p.light.secondary} 50%)`,
              }}
            />
            <ListItemText primary={p.label} secondary={p.description} />
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
