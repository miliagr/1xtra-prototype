import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { suppressBrowserGestures } from './viewport';
import { mountFpsMeter } from './dev/fpsMeter';
import { registerServiceWorker } from './pwa';

const parent = document.getElementById('game');
if (!parent) throw new Error('#game container missing from index.html');

suppressBrowserGestures(parent);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent,
  backgroundColor: '#0e1116',

  scale: {
    // RESIZE means the canvas always equals the viewport: it fills a phone
    // screen exactly, with no letterboxing and no black bars on any aspect
    // ratio. The cost is that the scene has to lay itself out at runtime
    // rather than against a fixed design resolution — see BootScene.layout().
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.NO_CENTER,
    autoRound: true,
  },

  input: {
    // Pointer events cover mouse and touch with one code path and carry no
    // click delay. Two pointers is enough headroom for a casual game.
    activePointers: 2,
    touch: { capture: true },
  },

  render: {
    antialias: true,
    // Rendering at 1 CSS pixel per device pixel. See docs/mobile-shell.md for
    // why, and for the recipe to raise it if the art ever demands it.
    powerPreference: 'high-performance',
  },

  fps: {
    target: 60,
    // Don't let a slow frame cascade into a spiral of catch-up updates.
    forceSetTimeOut: false,
  },

  scene: [BootScene],
});

// Opt-in on-device FPS readout: append ?fps=1 to the URL.
if (new URLSearchParams(location.search).has('fps')) {
  mountFpsMeter(game);
}

registerServiceWorker();
