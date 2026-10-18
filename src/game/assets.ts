export type Frames = HTMLImageElement[];

function loadSet(urls: string[]): Frames {
  return urls.map((src) => {
    const img = new Image();
    img.decoding = "async";
    img.crossOrigin = "anonymous";
    img.src = src;
    return img;
  });
}

function sequence(base: string, count: number) {
  return loadSet(Array.from({ length: count }, (_, i) => `${base}${i + 1}.png`));
}

export type Art = {
  idle: Frames;
  run: Frames;
  jump: Frames;
  attack: Frames;
  bossIdle: Frames;
  bossAttack: Frames;
  drone: Frames;
  orb: Frames;
  impact: Frames;
  bg: HTMLImageElement;
};

export function loadArt(): Art {
  const bg = new Image();
  bg.crossOrigin = "anonymous";
  bg.src = "/sprites/bg/forge.jpg";
  return {
    idle: sequence("/sprites/player/idle-", 4),
    run: sequence("/sprites/player/run-", 4),
    jump: sequence("/sprites/player/jump-", 4),
    attack: sequence("/sprites/player/attack-", 4),
    bossIdle: sequence("/sprites/boss/idle-", 4),
    bossAttack: sequence("/sprites/boss/attack-", 4),
    drone: sequence("/sprites/fx/drone-", 4),
    orb: sequence("/sprites/fx/orb-", 4),
    impact: sequence("/sprites/fx/impact-", 4),
    bg,
  };
}

export function ready(img: HTMLImageElement | null | undefined): img is HTMLImageElement {
  return !!img && img.complete && img.naturalWidth > 0;
}

export function pick(frames: Frames, index: number): HTMLImageElement | null {
  if (!frames.length) return null;
  const img = frames[Math.abs(index) % frames.length];
  return img && ready(img) ? img : null;
}
