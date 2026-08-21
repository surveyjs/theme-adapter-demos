"use client";

import type { ReactNode } from "react";
import { Dialog } from "radix-ui";

/**
 * Mobile navigation drawer.
 *
 * Composed straight from Radix `Dialog` instead of `@/components/ui/sheet`:
 * both the panel and the scrim have to start below the `h-14` header, so it
 * stays visible and undimmed while the drawer is open (the MUI shell gets the
 * same result by keeping its AppBar above the Drawer's z-index) — and
 * `SheetContent` renders its own full-viewport `SheetOverlay` with no way in.
 * Patching sheet.tsx is not an option: it is one of the chrome components that
 * `scripts/install-ui.mjs` wipes and reinstalls from the shadcn registry, so a
 * local edit there survives only until the next install. The classes below are
 * the registry's `side="left"` sheet, with the insets we need.
 *
 * Nav only, like the Bootstrap drawer: the brand stays in the header at every
 * width, and a close button would land on the first nav row now that there is
 * no header block to anchor it. The burger toggles (Radix trigger), so it also
 * closes the panel.
 */
export function NavDrawer({
  open,
  onOpenChange,
  trigger,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay
          data-slot="sheet-overlay"
          className="fixed top-14 right-0 bottom-0 left-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
        />
        <Dialog.Content
          data-slot="sheet-content"
          className="bg-background fixed top-14 bottom-0 left-0 z-50 flex w-72 flex-col border-r shadow-lg transition ease-in-out data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=closed]:duration-300 data-[state=open]:animate-in data-[state=open]:slide-in-from-left data-[state=open]:duration-500"
        >
          {/* Visually hidden, but still in the markup: Radix warns when a
              Dialog has no Title, and this is the panel's accessible name —
              the same job Bootstrap's `aria-label="Navigation"` does. */}
          <Dialog.Title className="sr-only">Navigation</Dialog.Title>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
