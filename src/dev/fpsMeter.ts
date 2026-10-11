import type Phaser from 'phaser';

/**
 * Minimal on-screen FPS readout for on-device test passes. Enabled with
 * `?fps=1` so it never ships in a normal session, and built as a DOM overlay
 * rather than a game object so it survives scene changes.
 */
export function mountFpsMeter(game: Phaser.Game): void {
  const el = document.createElement('div');
  el.style.cssText = [
    'position:fixed',
    'top:calc(env(safe-area-inset-top,0px) + 6px)',
    'left:calc(env(safe-area-inset-left,0px) + 8px)',
    'z-index:10',
    'font:600 12px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace',
    'color:#9ef01a',
    'background:rgba(0,0,0,.45)',
    'padding:4px 7px',
    'border-radius:6px',
    'pointer-events:none',
  ].join(';');
  document.body.appendChild(el);

  let worst = Infinity;

  setInterval(() => {
    const fps = game.loop.actualFps;
    // Ignore the first few frames while the loop settles.
    if (game.loop.frame > 120) worst = Math.min(worst, fps);
    const worstText = Number.isFinite(worst) ? worst.toFixed(0) : '–';
    el.textContent = `${fps.toFixed(0)} fps (min ${worstText})`;
  }, 500);
}
