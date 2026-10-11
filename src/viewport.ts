/**
 * Safe-area insets for notches, dynamic islands and home bars.
 *
 * `env(safe-area-inset-*)` cannot be read from JS directly, and reading it back
 * off a custom property is not reliable across browsers. So we keep one hidden
 * probe element whose padding is set from env() — the browser resolves that to
 * real pixels, and we read the resolved padding.
 *
 * Values are in CSS pixels, the same units the Phaser scene works in.
 */

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

let probe: HTMLElement | undefined;

function getProbe(): HTMLElement {
  if (!probe) {
    probe = document.createElement('div');
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:0',
      'height:0',
      'visibility:hidden',
      'pointer-events:none',
      'padding-top:env(safe-area-inset-top,0px)',
      'padding-right:env(safe-area-inset-right,0px)',
      'padding-bottom:env(safe-area-inset-bottom,0px)',
      'padding-left:env(safe-area-inset-left,0px)',
    ].join(';');
    document.body.appendChild(probe);
  }
  return probe;
}

export function getSafeAreaInsets(): SafeAreaInsets {
  const style = getComputedStyle(getProbe());
  return {
    top: parseFloat(style.paddingTop) || 0,
    right: parseFloat(style.paddingRight) || 0,
    bottom: parseFloat(style.paddingBottom) || 0,
    left: parseFloat(style.paddingLeft) || 0,
  };
}

/**
 * The rectangle, in CSS pixels, that is guaranteed not to sit under a notch or
 * a home bar. Lay interactive UI out inside this; backgrounds can still paint
 * edge to edge.
 */
export function getSafeArea(width: number, height: number): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const inset = getSafeAreaInsets();
  return {
    x: inset.left,
    y: inset.top,
    width: Math.max(0, width - inset.left - inset.right),
    height: Math.max(0, height - inset.top - inset.bottom),
  };
}

/**
 * Blocks the browser gestures that would otherwise fight the game: pinch-zoom,
 * double-tap-to-zoom and long-press context menus. Pull-to-refresh and
 * rubber-band scrolling are handled in CSS (`overscroll-behavior`,
 * `touch-action`) — see src/styles.css.
 */
export function suppressBrowserGestures(target: HTMLElement): void {
  target.addEventListener('contextmenu', (event) => event.preventDefault());

  // iOS Safari still fires these even with user-scalable=no in some versions.
  for (const name of ['gesturestart', 'gesturechange', 'gestureend']) {
    target.addEventListener(name, (event) => event.preventDefault());
  }

  // Belt and braces for double-tap zoom on older iOS: swallow a second tap
  // that lands within 300ms of the previous one.
  let lastTouchEnd = 0;
  document.addEventListener(
    'touchend',
    (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) event.preventDefault();
      lastTouchEnd = now;
    },
    { passive: false },
  );
}
