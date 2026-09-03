/**
 * Embedded (iframe) mode.
 *
 * The demo is also shown inside an <iframe> on the documentation pages, where
 * the host page owns the navigation — so the shell's own sidebar, and the
 * burger that opens it on small screens, are noise there and stay hidden.
 *
 * The check has to run before the first paint: detecting the frame from an
 * effect would let the sidebar paint from the SSR markup and then vanish once
 * React hydrates — a visible flash plus a layout shift. Hence the same
 * no-flash pattern the theme bootstraps use — an inline <head> script that
 * marks <html> — with the hiding itself left to CSS keyed off the attribute
 * (see AdminShell).
 *
 * The catch covers sandboxed frames where reaching `window.top` throws: being
 * unable to see the top window means being framed, so treat that as embedded.
 */
export function embeddedBootstrapScript() {
  return `(function(){try{if(window.self!==window.top)document.documentElement.setAttribute('data-embedded','');}catch(e){document.documentElement.setAttribute('data-embedded','');}})();`;
}
