/**
 * Tracks where the pointer (mouse or finger) is, and whether the player
 * "pressed" something (tap, click, Space, Enter) since we last asked.
 */
export class Input {
  x = 0;
  y = 0;
  hasPointer = false;
  pointerType = "mouse";
  private pressed = false;

  constructor(private readonly canvas: HTMLCanvasElement) {
    canvas.addEventListener("pointermove", this.onMove, { passive: true });
    canvas.addEventListener("pointerdown", this.onDown);
    window.addEventListener("keydown", this.onKey);
  }

  /** Returns true once per press, then resets. */
  consumePress(): boolean {
    const was = this.pressed;
    this.pressed = false;
    return was;
  }

  private setPosition(e: PointerEvent): void {
    this.x = e.clientX;
    this.y = e.clientY;
    this.hasPointer = true;
    this.pointerType = e.pointerType;
  }

  private onMove = (e: PointerEvent): void => {
    this.setPosition(e);
  };

  private onDown = (e: PointerEvent): void => {
    this.setPosition(e);
    this.pressed = true;
    // Keep receiving moves even if the finger slides off the canvas edge.
    this.canvas.setPointerCapture(e.pointerId);
  };

  private onKey = (e: KeyboardEvent): void => {
    if (e.code === "Space" || e.code === "Enter") {
      e.preventDefault();
      this.pressed = true;
    }
  };
}
