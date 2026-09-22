/**
 * Chrome visibility before the first paint.
 *
 * Two signals, both applied as attributes on <html> by an inline <head>
 * script. Detecting them from an effect would let the chrome paint from the
 * SSR markup and then vanish once React hydrates — a visible flash plus a
 * layout shift. The hiding itself is CSS keyed off the attributes (the
 * `embedded:`, `hide-sidebar:` and `hide-header:` Tailwind variants in
 * AdminShell).
 *
 *  - Embedded (iframe). The demo is also shown inside an <iframe> on the
 *    documentation pages, where the host page owns the navigation — so the
 *    shell's own sidebar, and the burger that opens it on small screens,
 *    stay hidden. `data-embedded` is set when `window.self !== window.top`.
 *    The catch covers sandboxed frames where reaching `window.top` throws:
 *    being unable to see the top window means being framed, so treat that
 *    as embedded.
 *
 *  - Query params, independent of the frame check. `?sidebar=0` hides that
 *    same navigation (`data-hide-sidebar`). `?header=0` hides the top header
 *    (`data-hide-header`). Either param can be passed on its own.
 */
export function embeddedBootstrapScript() {
  return `(function(){var root=document.documentElement;try{if(window.self!==window.top)root.setAttribute('data-embedded','');}catch(e){root.setAttribute('data-embedded','');}var q=new URLSearchParams(location.search);if(q.get('sidebar')==='0')root.setAttribute('data-hide-sidebar','');if(q.get('header')==='0')root.setAttribute('data-hide-header','');})();`;
}
