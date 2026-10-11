import Phaser from 'phaser';
import { getSafeArea } from '../viewport';

/**
 * Pipeline proof, not gameplay.
 *
 * Renders one shape inside the safe area and reacts to a tap. If this boots,
 * fills the screen, survives rotation and responds to touch, the toolchain and
 * the mobile shell are working end to end.
 *
 * Gameplay scenes replace this; the safe-area usage below is the pattern to
 * copy.
 */
export class BootScene extends Phaser.Scene {
  private shape!: Phaser.GameObjects.Arc;
  private label!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private taps = 0;

  constructor() {
    super('Boot');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0e1116');

    this.shape = this.add.circle(0, 0, 90, 0x4cc9f0);

    this.label = this.add
      .text(0, 0, 'tap me', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '24px',
        color: '#0e1116',
      })
      .setOrigin(0.5);

    this.hint = this.add
      .text(0, 0, '', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '15px',
        color: '#8a94a6',
        align: 'center',
      })
      .setOrigin(0.5);

    // pointerdown, not pointerup — fires on touch contact with no click delay.
    this.shape.on('pointerdown', () => this.onTap());

    this.layout();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    });
  }

  private onTap(): void {
    this.taps += 1;
    this.label.setText(String(this.taps));

    // Visible, unmistakable reaction: colour flip plus a squash.
    this.shape.setFillStyle(this.taps % 2 === 0 ? 0x4cc9f0 : 0xf72585);
    this.tweens.killTweensOf(this.shape);
    this.shape.setScale(1);
    this.tweens.add({
      targets: this.shape,
      scale: 0.82,
      duration: 90,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  /** Re-centres on every resize and rotation. Called once at create time too. */
  private layout(): void {
    const { width, height } = this.scale.gameSize;
    const safe = getSafeArea(width, height);

    const cx = safe.x + safe.width / 2;
    const cy = safe.y + safe.height / 2;

    // Keep the shape comfortably inside the safe area on small screens.
    const radius = Math.min(90, Math.min(safe.width, safe.height) * 0.22);
    this.shape.setRadius(radius);
    this.shape.setPosition(cx, cy);

    // setRadius resizes the object, so the hit area has to be rebuilt to match.
    // Hit-area coords are local, with the origin at the top-left of the bounds.
    this.shape.setInteractive(
      new Phaser.Geom.Circle(radius, radius, radius),
      Phaser.Geom.Circle.Contains,
    );

    this.label.setPosition(cx, cy);

    this.hint.setPosition(cx, safe.y + safe.height - 28);
    this.hint.setText(
      `${Math.round(width)}x${Math.round(height)} css px · ` +
        `safe inset ${Math.round(safe.y)}/${Math.round(height - safe.y - safe.height)}`,
    );
  }
}
