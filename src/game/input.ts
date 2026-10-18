export type Actions = {
  moveX: number;
  drop: boolean;
  jump: boolean;
  jumpPressed: boolean;
  jumpReleased: boolean;
  dashPressed: boolean;
  attackPressed: boolean;
  specialPressed: boolean;
  pausePressed: boolean;
  confirmPressed: boolean;
};

type TouchKey = "left" | "right" | "jump" | "dash" | "attack" | "special";

const GAME_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Space",
  "KeyA",
  "KeyD",
  "KeyW",
  "KeyS",
  "KeyJ",
  "KeyK",
  "KeyX",
  "KeyC",
  "ShiftLeft",
  "ShiftRight",
]);

function deadzone(x: number, y: number, dz = 0.18) {
  const m = Math.hypot(x, y);
  if (m < dz) return { x: 0, y: 0 };
  const s = (m - dz) / (1 - dz) / m;
  return { x: x * s, y: y * s };
}

export class Input {
  private keys = new Set<string>();
  private touch: Record<TouchKey, boolean> = {
    left: false,
    right: false,
    jump: false,
    dash: false,
    attack: false,
    special: false,
  };
  private prev = {
    jump: false,
    dash: false,
    attack: false,
    special: false,
    pause: false,
    confirm: false,
  };
  private boundDown: (e: KeyboardEvent) => void;
  private boundUp: (e: KeyboardEvent) => void;
  private boundBlur: () => void;
  private boundVis: () => void;

  constructor() {
    this.boundDown = (e) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      if (GAME_KEYS.has(e.code)) e.preventDefault();
    };
    this.boundUp = (e) => {
      this.keys.delete(e.code);
    };
    this.boundBlur = () => this.keys.clear();
    this.boundVis = () => {
      if (document.hidden) this.keys.clear();
    };
    window.addEventListener("keydown", this.boundDown);
    window.addEventListener("keyup", this.boundUp);
    window.addEventListener("blur", this.boundBlur);
    document.addEventListener("visibilitychange", this.boundVis);
  }

  destroy() {
    window.removeEventListener("keydown", this.boundDown);
    window.removeEventListener("keyup", this.boundUp);
    window.removeEventListener("blur", this.boundBlur);
    document.removeEventListener("visibilitychange", this.boundVis);
  }

  setTouch(key: TouchKey, down: boolean) {
    this.touch[key] = down;
  }

  /** QA probe: replace held keys until the next call. */
  setKeys(codes: string[]) {
    this.keys.clear();
    for (const code of codes) this.keys.add(code);
  }

  sample(): Actions {
    const pad = readPad();
    let moveX = 0;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft") || this.touch.left) moveX -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight") || this.touch.right) moveX += 1;
    if (pad) {
      const stick = deadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0);
      moveX += stick.x;
      if (pad.buttons[14]?.pressed) moveX -= 1;
      if (pad.buttons[15]?.pressed) moveX += 1;
    }
    moveX = Math.max(-1, Math.min(1, moveX));

    const drop =
      this.keys.has("KeyS") ||
      this.keys.has("ArrowDown") ||
      Boolean(pad?.buttons[13]?.pressed);
    const jump =
      this.keys.has("Space") ||
      this.keys.has("KeyW") ||
      this.keys.has("ArrowUp") ||
      this.touch.jump ||
      Boolean(pad?.buttons[0]?.pressed) ||
      Boolean(pad?.buttons[12]?.pressed);
    const dash =
      this.keys.has("ShiftLeft") ||
      this.keys.has("ShiftRight") ||
      this.touch.dash ||
      Boolean(pad?.buttons[1]?.pressed) ||
      Boolean(pad?.buttons[5]?.pressed);
    const attack =
      this.keys.has("KeyJ") ||
      this.keys.has("KeyX") ||
      this.touch.attack ||
      Boolean(pad?.buttons[2]?.pressed);
    const special =
      this.keys.has("KeyK") ||
      this.keys.has("KeyC") ||
      this.touch.special ||
      Boolean(pad?.buttons[3]?.pressed);
    const pause =
      this.keys.has("Escape") || this.keys.has("KeyP") || Boolean(pad?.buttons[9]?.pressed);
    const confirm =
      this.keys.has("Enter") ||
      this.keys.has("Space") ||
      Boolean(pad?.buttons[0]?.pressed) ||
      Boolean(pad?.buttons[9]?.pressed);

    const actions: Actions = {
      moveX,
      drop,
      jump,
      jumpPressed: jump && !this.prev.jump,
      jumpReleased: !jump && this.prev.jump,
      dashPressed: dash && !this.prev.dash,
      attackPressed: attack && !this.prev.attack,
      specialPressed: special && !this.prev.special,
      pausePressed: pause && !this.prev.pause,
      confirmPressed: confirm && !this.prev.confirm,
    };
    this.prev = { jump, dash, attack, special, pause, confirm };
    return actions;
  }
}

function readPad(): Gamepad | null {
  const pads = navigator.getGamepads?.();
  if (!pads) return null;
  for (const pad of pads) {
    if (pad && pad.connected) return pad;
  }
  return null;
}
