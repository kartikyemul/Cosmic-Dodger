const MOVE_KEYS = new Set([
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW", "KeyA", "KeyS", "KeyD",
]);

export class Input {
  x = 0;
  y = 0;
  hasPointer = false;
  pointerType = "mouse";
  usingKeyboard = false;
  private pressed = false;
  private keys = new Set<string>();

  constructor(private readonly canvas: HTMLCanvasElement) {
    canvas.addEventListener("pointermove", this.onMove, { passive: true });
    canvas.addEventListener("pointerdown", this.onDown);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    window.addEventListener("keydown", this.onKey);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", () => this.keys.clear());
  }

  consumePress(): boolean {
    const was = this.pressed;
    this.pressed = false;
    return was;
  }

  /** -1 (left), 0 or 1 (right) */
  get moveX(): number {
    return Number(this.down("ArrowRight", "KeyD")) - Number(this.down("ArrowLeft", "KeyA"));
  }

  /** -1 (up), 0 or 1 (down) */
  get moveY(): number {
    return Number(this.down("ArrowDown", "KeyS")) - Number(this.down("ArrowUp", "KeyW"));
  }

  private down(...codes: string[]): boolean {
    return codes.some((code) => this.keys.has(code));
  }

  private setPosition(e: PointerEvent): void {
    this.x = e.clientX;
    this.y = e.clientY;
    this.hasPointer = true;
    this.pointerType = e.pointerType;
    this.usingKeyboard = false;
  }

  private onMove = (e: PointerEvent): void => {
    this.setPosition(e);
  };

  private onDown = (e: PointerEvent): void => {
    this.setPosition(e);
    this.pressed = true;
    this.canvas.setPointerCapture(e.pointerId);
  };

  private onKey = (e: KeyboardEvent): void => {
    if (e.target instanceof HTMLInputElement) return;
    if (MOVE_KEYS.has(e.code)) {
      e.preventDefault();
      this.keys.add(e.code);
      this.usingKeyboard = true;
    } else if (e.code === "Space" || e.code === "Enter") {
      e.preventDefault();
      this.pressed = true;
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };
}
