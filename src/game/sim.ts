import type { Actions } from "./input";

export const WORLD_W = 1280;
export const WORLD_H = 720;
export const FLOOR_Y = 636;

const SLASH = [30, 40, 72];
const HEAT_ON_HIT = [12, 16, 24];
const CORE_DAMAGE = 170;
const REFLECT_DAMAGE = 48;
const HEAT_SWING = 16;
export const OVERHEAT_TIME = 3.3;
const ATTACK_DUR = 0.32;

export type AttackName = "charge" | "slam" | "volley";
export type Mode = "title" | "playing" | "paused" | "dead" | "won";
export type Ending = "win" | "lose" | null;

export type Body = { x: number; y: number; w: number; h: number };

export type Platform = Body & { oneWay: boolean };

export type Projectile = Body & {
  vx: number;
  vy: number;
  kind: "orb" | "wave" | "ember";
  friendly: boolean;
  dmg: number;
  life: number;
  warn: number;
};

export type Drone = Body & {
  id: number;
  baseX: number;
  baseY: number;
  hp: number;
  t: number;
  shoot: number;
  alive: boolean;
  hitSwing: number;
};

export type Ghost = { x: number; y: number; facing: number; life: number };

export type SimEvent =
  | { t: "sfx"; name: string }
  | { t: "shake"; n: number }
  | { t: "hitstop"; n: number }
  | { t: "burst"; x: number; y: number; n: number; color: string; speed: number; life: number }
  | { t: "float"; x: number; y: number; text: string; color: string }
  | { t: "flash"; color: string }
  | { t: "impact"; x: number; y: number };

export const PLATFORMS: Platform[] = [
  { x: 0, y: FLOOR_Y, w: WORLD_W, h: 90, oneWay: false },
  { x: 64, y: 512, w: 280, h: 18, oneWay: true },
  { x: 936, y: 512, w: 280, h: 18, oneWay: true },
  { x: 450, y: 368, w: 380, h: 18, oneWay: true },
  { x: 120, y: 236, w: 220, h: 16, oneWay: true },
  { x: 940, y: 236, w: 220, h: 16, oneWay: true },
];

function overlaps(a: Body, b: Body) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function phaseOf(hp: number, max: number): 1 | 2 | 3 {
  const r = hp / max;
  if (r > 0.66) return 1;
  if (r > 0.33) return 2;
  return 3;
}

export class GameSim {
  mode: Mode = "title";
  ending: Ending = null;
  endTimer = 0;
  time = 0;
  clearMs = 0;
  anim = 0;
  hitstop = 0;
  banner = "";
  bannerT = 0;
  hitsLanded = 0;
  hitsTaken = 0;
  lavaT = 0;
  lavaWarn = false;
  lavaOn = false;
  emberCd = 2.2;
  nextId = 1;
  swing = 0;
  projectiles: Projectile[] = [];
  drones: Drone[] = [];
  ghosts: Ghost[] = [];
  events: SimEvent[] = [];
  platforms = PLATFORMS;

  player = this.makePlayer();
  boss = this.makeBoss();

  private makePlayer() {
    return {
      x: 150,
      y: FLOOR_Y - 62,
      w: 34,
      h: 62,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: true,
      groundId: 0,
      coyote: 0.1,
      jumpBuffer: 0,
      ignoreId: -1,
      ignoreT: 0,
      dashing: false,
      dashT: 0,
      dashCd: 0,
      attackTimer: 0,
      combo: 0,
      comboWindow: 0,
      recover: 0,
      bossHit: false,
      heat: 0,
      latched: false,
      heatHold: 0,
      coreT: 0,
      coreTick: false,
      hp: 100,
      maxHp: 100,
      invuln: 0,
      lockout: 0,
      squash: 0,
      lavaTick: 0,
      anim: 0,
    };
  }

  private makeBoss() {
    const w = 108;
    const h = 158;
    return {
      x: 980,
      y: FLOOR_Y - h,
      w,
      h,
      vx: 0,
      vy: 0,
      facing: -1,
      hp: 980,
      maxHp: 980,
      phase: 1 as 1 | 2 | 3,
      mode: "intro" as "intro" | "idle" | "telegraph" | "act" | "recover" | "phasebreak" | "dead",
      attack: "charge" as AttackName,
      timer: 1.45,
      sub: 0,
      slamX: 700,
      lastAttack: "" as AttackName | "",
      repeat: 0,
      invuln: 0,
      flash: 0,
      anim: 0,
    };
  }

  showTitle() {
    this.player = this.makePlayer();
    this.boss = this.makeBoss();
    this.boss.mode = "idle";
    this.boss.timer = 99;
    this.projectiles = [];
    this.drones = [];
    this.ghosts = [];
    this.ending = null;
    this.bannerT = 0;
    this.mode = "title";
  }

  start() {
    this.player = this.makePlayer();
    this.boss = this.makeBoss();
    this.projectiles = [];
    this.drones = [];
    this.ghosts = [];
    this.mode = "playing";
    this.ending = null;
    this.endTimer = 0;
    this.time = 0;
    this.clearMs = 0;
    this.hitstop = 0;
    this.banner = "SHE IS WAKING";
    this.bannerT = 1.45;
    this.hitsLanded = 0;
    this.hitsTaken = 0;
    this.lavaT = 0;
    this.lavaWarn = false;
    this.lavaOn = false;
    this.emberCd = 2.4;
    this.swing = 0;
    this.events.push({ t: "sfx", name: "roar" });
  }

  pullEvents() {
    const ev = this.events;
    this.events = [];
    return ev;
  }

  step(dt: number, a: Actions) {
    if (this.mode === "paused") {
      if (a.pausePressed) this.mode = "playing";
      return;
    }
    if (this.mode === "title" || this.mode === "dead" || this.mode === "won") {
      this.anim += dt;
      this.player.anim += dt;
      this.boss.anim += dt;
      if (a.confirmPressed || a.pausePressed) this.start();
      return;
    }
    if (a.pausePressed) {
      this.mode = "paused";
      return;
    }
    if (this.hitstop > 0) {
      this.hitstop = Math.max(0, this.hitstop - dt);
      return;
    }
    if (this.ending) {
      this.endTimer -= dt;
      this.anim += dt;
      this.player.anim += dt;
      this.boss.anim += dt;
      if (this.ending === "win") this.boss.y = Math.min(FLOOR_Y - 20, this.boss.y + 28 * dt);
      if (this.endTimer <= 0) this.mode = this.ending === "win" ? "won" : "dead";
      return;
    }

    this.time += dt;
    this.anim += dt;
    this.bannerT = Math.max(0, this.bannerT - dt);
    this.updatePlayer(dt, a);
    this.updateBoss(dt);
    this.updateDrones(dt);
    this.updateHazards(dt);
    this.updateProjectiles(dt);
    this.resolvePlayerAttack();
    this.resolveCore();
    this.resolveContact();
  }

  private updatePlayer(dt: number, a: Actions) {
    const p = this.player;
    p.anim += dt;
    p.invuln = Math.max(0, p.invuln - dt);
    p.lockout = Math.max(0, p.lockout - dt);
    p.recover = Math.max(0, p.recover - dt);
    p.dashCd = Math.max(0, p.dashCd - dt);
    p.lavaTick = Math.max(0, p.lavaTick - dt);
    p.squash = Math.max(0, p.squash - dt * 3.2);
    p.coreT = Math.max(0, p.coreT - dt);
    if (p.ignoreT > 0) {
      p.ignoreT -= dt;
      if (p.ignoreT <= 0) p.ignoreId = -1;
    }
    for (const g of this.ghosts) g.life -= dt;
    this.ghosts = this.ghosts.filter((g) => g.life > 0);

    if (p.latched) {
      p.heat = 100;
      p.heatHold += dt;
      if (p.heatHold > OVERHEAT_TIME) {
        p.latched = false;
        p.heat = 24;
        p.heatHold = 0;
        this.hurt(12, 0, false);
        p.lockout = 0.35;
        this.events.push({ t: "sfx", name: "boom" });
        this.events.push({ t: "float", x: p.x, y: p.y - 20, text: "OVERHEAT", color: "#ff9900" });
      }
    } else if (p.attackTimer <= 0) {
      p.heat = Math.max(0, p.heat - 15 * dt);
    }

    if (a.specialPressed && p.latched && !p.dashing && p.hp > 0) {
      if (a.moveX < -0.2) p.facing = -1;
      else if (a.moveX > 0.2) p.facing = 1;
      p.latched = false;
      p.heat = 0;
      p.heatHold = 0;
      p.coreT = 0.26;
      p.coreTick = true;
      p.attackTimer = 0;
      this.events.push({ t: "sfx", name: "core" });
      this.events.push({ t: "shake", n: 0.55 });
    }

    const canAct = p.lockout <= 0 && !p.dashing;
    if (a.attackPressed && canAct && p.attackTimer <= 0 && p.recover <= 0 && p.coreT <= 0) {
      if (p.comboWindow > 0 && p.combo < 2) p.combo += 1;
      else p.combo = 0;
      p.comboWindow = 0;
      p.attackTimer = ATTACK_DUR;
      p.bossHit = false;
      this.swing += 1;
      p.heat = Math.min(100, p.heat + HEAT_SWING);
      if (p.heat >= 100) {
        p.heat = 100;
        if (!p.latched) p.heatHold = 0;
        p.latched = true;
      }
      this.events.push({ t: "sfx", name: "slash" });
    }
    if (p.attackTimer > 0) {
      p.attackTimer -= dt;
      if (p.attackTimer <= 0) {
        if (p.combo >= 2) {
          p.combo = 0;
          p.comboWindow = 0;
          p.recover = 0.14;
        } else {
          p.comboWindow = 0.42;
        }
      }
    } else if (p.comboWindow > 0) {
      p.comboWindow -= dt;
      if (p.comboWindow <= 0) p.combo = 0;
    }

    if (a.dashPressed && p.dashCd <= 0 && !p.dashing && p.lockout <= 0) {
      if (a.moveX < -0.2) p.facing = -1;
      else if (a.moveX > 0.2) p.facing = 1;
      p.dashing = true;
      p.dashT = 0.16;
      p.dashCd = 0.58;
      p.vy = 0;
      this.events.push({ t: "sfx", name: "dash" });
    }

    if (a.moveX < -0.2 && p.attackTimer <= 0) p.facing = -1;
    else if (a.moveX > 0.2 && p.attackTimer <= 0) p.facing = 1;

    if (a.jumpPressed) p.jumpBuffer = 0.13;
    else p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);

    const canJump = p.jumpBuffer > 0 && (p.grounded || p.coyote > 0) && !p.dashing && p.lockout <= 0;
    if (canJump) {
      const plat = p.groundId >= 0 ? this.platforms[p.groundId] : undefined;
      if (a.drop && plat?.oneWay) {
        p.ignoreId = p.groundId;
        p.ignoreT = 0.28;
        p.vy = 90;
        p.grounded = false;
        p.coyote = 0;
        p.jumpBuffer = 0;
      } else {
        p.vy = -780;
        p.grounded = false;
        p.coyote = 0;
        p.jumpBuffer = 0;
        this.events.push({ t: "sfx", name: "jump" });
        this.events.push({
          t: "burst",
          x: p.x + p.w / 2,
          y: p.y + p.h,
          n: 7,
          color: "#00ffcc",
          speed: 120,
          life: 0.28,
        });
      }
    }
    if (a.jumpReleased && p.vy < -180) p.vy *= 0.48;

    if (p.dashing) {
      p.vx = p.facing * 920;
      p.vy = 0;
      p.dashT -= dt;
      this.ghosts.push({ x: p.x, y: p.y, facing: p.facing, life: 0.16 });
      if (this.ghosts.length > 7) this.ghosts.shift();
      if (p.dashT <= 0) p.dashing = false;
    } else {
      const accel = (p.grounded ? 3400 : 1900) * (p.lockout > 0 ? 0.45 : 1);
      const max = 320;
      const target = a.moveX * max;
      const diff = target - p.vx;
      const step = Math.sign(diff) * Math.min(Math.abs(diff), accel * dt);
      p.vx += step;
      if (Math.abs(a.moveX) < 0.1) {
        const fric = (p.grounded ? 2400 : 420) * dt;
        if (Math.abs(p.vx) <= fric) p.vx = 0;
        else p.vx -= Math.sign(p.vx) * fric;
      }
      let g = 1500;
      if (p.vy > 80) g = 2700;
      else if (Math.abs(p.vy) < 120) g = 860;
      p.vy = Math.min(1040, p.vy + g * dt);
    }

    p.x += p.vx * dt;
    if (p.x < 10) {
      p.x = 10;
      p.vx = 0;
    }
    if (p.x + p.w > WORLD_W - 10) {
      p.x = WORLD_W - 10 - p.w;
      p.vx = 0;
    }

    const wasGrounded = p.grounded;
    let impact = 0;
    let remain = p.vy * dt;
    p.grounded = false;
    const stepY = 8;
    while (Math.abs(remain) > 0.0001) {
      const dy = Math.sign(remain) * Math.min(Math.abs(remain), stepY);
      remain -= dy;
      const prevBottom = p.y + p.h;
      p.y += dy;
      for (let i = 0; i < this.platforms.length; i++) {
        const pl = this.platforms[i]!;
        if (p.ignoreId === i) continue;
        const hitX = p.x + p.w > pl.x + 2 && p.x < pl.x + pl.w - 2;
        if (!hitX) continue;
        if (pl.oneWay) {
          if (dy >= 0 && prevBottom <= pl.y + 4 && p.y + p.h >= pl.y) {
            p.y = pl.y - p.h;
            impact = Math.max(impact, p.vy);
            p.vy = 0;
            p.grounded = true;
            p.groundId = i;
            remain = 0;
            break;
          }
        } else if (dy >= 0 && prevBottom <= pl.y + 8 && p.y + p.h >= pl.y && p.y < pl.y) {
          p.y = pl.y - p.h;
          impact = Math.max(impact, p.vy);
          p.vy = 0;
          p.grounded = true;
          p.groundId = i;
          remain = 0;
          break;
        }
      }
    }
    if (!p.grounded && p.vy >= 0) {
      const feet = p.y + p.h;
      for (let i = 0; i < this.platforms.length; i++) {
        const pl = this.platforms[i]!;
        if (p.ignoreId === i) continue;
        const hitX = p.x + p.w > pl.x + 2 && p.x < pl.x + pl.w - 2;
        if (!hitX) continue;
        if (feet >= pl.y - 2 && feet <= pl.y + 8 && p.y < pl.y) {
          p.y = pl.y - p.h;
          p.vy = 0;
          p.grounded = true;
          p.groundId = i;
          break;
        }
      }
    }
    if (p.grounded) p.coyote = 0.1;
    else {
      p.coyote = Math.max(0, p.coyote - dt);
      p.groundId = -1;
    }
    if (!wasGrounded && p.grounded && impact > 460) {
      p.squash = 1;
      this.events.push({ t: "sfx", name: "land" });
      this.events.push({
        t: "burst",
        x: p.x + p.w / 2,
        y: p.y + p.h,
        n: 6,
        color: "#8a99ad",
        speed: 80,
        life: 0.25,
      });
    }
  }

  private restY() {
    return FLOOR_Y - this.boss.h;
  }

  private facePlayer() {
    const b = this.boss;
    b.facing = this.player.x + this.player.w / 2 < b.x + b.w / 2 ? -1 : 1;
  }

  private driftBoss(dt: number) {
    const b = this.boss;
    const px = this.player.x + this.player.w / 2;
    const ideal = px < WORLD_W / 2 ? 900 : 240;
    const dx = ideal - b.x;
    b.x += Math.sign(dx) * Math.min(Math.abs(dx), 78 * dt);
    b.x = clamp(b.x, 30, WORLD_W - b.w - 30);
    this.facePlayer();
  }

  private recover(time: number) {
    const b = this.boss;
    b.mode = "recover";
    b.timer = time;
    b.vx = 0;
    b.vy = 0;
    b.y = this.restY();
  }

  private beginAttack() {
    const b = this.boss;
    const options: AttackName[] = ["charge", "slam", "volley"];
    let attack = options[Math.floor(Math.random() * options.length)]!;
    if (attack === b.lastAttack && b.repeat >= 1) {
      attack = options[(options.indexOf(attack) + 1) % options.length]!;
    }
    b.repeat = attack === b.lastAttack ? b.repeat + 1 : 0;
    b.lastAttack = attack;
    b.attack = attack;
    b.mode = "telegraph";
    b.sub = 0;
    this.facePlayer();
    const i = b.phase - 1;
    if (attack === "charge") b.timer = [0.7, 0.5, 0.36][i]!;
    else if (attack === "slam") b.timer = [0.62, 0.48, 0.4][i]!;
    else b.timer = [0.52, 0.4, 0.32][i]!;
    if (attack === "slam") b.slamX = this.player.x + this.player.w / 2 - b.w / 2;
    if (attack === "charge") this.events.push({ t: "sfx", name: "roar" });
  }

  private startAct() {
    const b = this.boss;
    b.mode = "act";
    b.sub = 0;
    const i = b.phase - 1;
    if (b.attack === "charge") {
      b.timer = 0.92;
      b.vx = b.facing * [520, 660, 800][i]!;
    } else if (b.attack === "slam") {
      b.timer = 0.26;
      b.vy = -620;
    } else {
      this.fireVolley();
      b.timer = 0.32;
    }
  }

  private updateBoss(dt: number) {
    const b = this.boss;
    b.anim += dt;
    b.flash = Math.max(0, b.flash - dt);
    b.invuln = Math.max(0, b.invuln - dt);

    if (b.mode === "intro") {
      b.timer -= dt;
      b.y = this.restY();
      this.facePlayer();
      if (b.timer <= 0) {
        b.mode = "idle";
        b.timer = 0.55;
      }
      return;
    }
    if (b.mode === "phasebreak") {
      b.timer -= dt;
      b.y = this.restY();
      if (b.timer <= 0) {
        b.mode = "idle";
        b.timer = 0.32;
      }
      return;
    }
    if (b.mode === "dead") return;
    if (b.mode === "recover") {
      this.driftBoss(dt);
      b.y = this.restY();
      b.timer -= dt;
      if (b.timer <= 0) {
        b.mode = "idle";
        b.timer = b.phase === 3 ? 0.18 : 0.32;
      }
      return;
    }
    if (b.mode === "idle") {
      this.driftBoss(dt);
      b.y = this.restY();
      b.timer -= dt;
      if (b.timer <= 0) this.beginAttack();
      return;
    }
    if (b.mode === "telegraph") {
      this.facePlayer();
      if (b.attack === "slam" && b.timer > 0.16) {
        b.slamX = clamp(this.player.x + this.player.w / 2 - b.w / 2, 36, WORLD_W - b.w - 36);
      }
      b.y = this.restY();
      b.timer -= dt;
      if (b.timer <= 0) this.startAct();
      return;
    }
    if (b.attack === "charge") this.actCharge(dt);
    else if (b.attack === "slam") this.actSlam(dt);
    else {
      b.timer -= dt;
      b.y = this.restY();
      if (b.timer <= 0) this.recover(0.38);
    }
  }

  private actCharge(dt: number) {
    const b = this.boss;
    const prev = b.x;
    b.x += b.vx * dt;
    b.y = this.restY();
    if (b.x < 20 || b.x + b.w > WORLD_W - 20) {
      b.x = clamp(b.x, 20, WORLD_W - b.w - 20);
      b.vx = 0;
      b.timer = 0;
    }
    const span: Body = {
      x: Math.min(prev, b.x),
      y: b.y,
      w: Math.abs(b.x - prev) + b.w,
      h: b.h,
    };
    if (overlaps(span, this.player)) this.hurt(b.phase === 3 ? 22 : 18, Math.sign(b.vx) || b.facing, true);
    b.timer -= dt;
    if (b.timer <= 0) this.recover(b.phase === 3 ? 0.32 : 0.46);
  }

  private actSlam(dt: number) {
    const b = this.boss;
    if (b.sub === 0) {
      b.y += b.vy * dt;
      b.timer -= dt;
      if (b.timer <= 0) {
        b.sub = 1;
        b.timer = 0.34;
        b.vy = 0;
      }
    } else if (b.sub === 1) {
      const dx = b.slamX - b.x;
      b.x += Math.sign(dx) * Math.min(Math.abs(dx), 760 * dt);
      b.timer -= dt;
      if (b.timer <= 0) {
        b.sub = 2;
        b.vy = 1500;
      }
    } else {
      b.y += b.vy * dt;
      if (b.y >= this.restY()) {
        b.y = this.restY();
        this.spawnWaves();
        this.events.push({ t: "sfx", name: "boom" });
        this.events.push({ t: "shake", n: 0.72 });
        this.events.push({
          t: "burst",
          x: b.x + b.w / 2,
          y: FLOOR_Y,
          n: 22,
          color: "#ff9900",
          speed: 260,
          life: 0.45,
        });
        if (overlaps(b, this.player)) this.hurt(22, this.player.x < b.x ? -1 : 1, true);
        this.recover(0.58);
      }
    }
  }

  private spawnWaves() {
    const speed = [280, 360, 460][this.boss.phase - 1]!;
    const y = FLOOR_Y - 28;
    this.projectiles.push({
      x: this.boss.x,
      y,
      w: 36,
      h: 28,
      vx: -speed,
      vy: 0,
      kind: "wave",
      friendly: false,
      dmg: 16,
      life: 3,
      warn: 0,
    });
    this.projectiles.push({
      x: this.boss.x + this.boss.w,
      y,
      w: 36,
      h: 28,
      vx: speed,
      vy: 0,
      kind: "wave",
      friendly: false,
      dmg: 16,
      life: 3,
      warn: 0,
    });
  }

  private fireVolley() {
    const count = this.boss.phase === 1 ? 2 : this.boss.phase === 2 ? 3 : 5;
    const speed = [250, 310, 370][this.boss.phase - 1]!;
    const ox = this.boss.x + this.boss.w / 2;
    const oy = this.boss.y + 58;
    const tx = this.player.x + this.player.w / 2;
    const ty = this.player.y + this.player.h / 2;
    const base = Math.atan2(ty - oy, tx - ox);
    const spread = count <= 2 ? 0.2 : 0.16;
    for (let i = 0; i < count; i++) {
      const ang = base + (i - (count - 1) / 2) * spread;
      this.projectiles.push({
        x: ox - 12,
        y: oy - 12,
        w: 24,
        h: 24,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        kind: "orb",
        friendly: false,
        dmg: 12,
        life: 4,
        warn: 0,
      });
    }
  }

  private updateDrones(dt: number) {
    const active =
      this.boss.mode === "idle" ||
      this.boss.mode === "telegraph" ||
      this.boss.mode === "act" ||
      this.boss.mode === "recover";
    for (const d of this.drones) {
      if (!d.alive) continue;
      d.t += dt;
      d.x = d.baseX + Math.sin(d.t * 1.3) * 50;
      d.y = d.baseY + Math.cos(d.t * 1.1) * 18;
      if (!active) continue;
      d.shoot -= dt;
      if (d.shoot <= 0) {
        d.shoot = this.boss.phase === 3 ? 1.5 : 2.15;
        const ang = Math.atan2(
          this.player.y + this.player.h / 2 - d.y,
          this.player.x + this.player.w / 2 - d.x,
        );
        const speed = 230;
        this.projectiles.push({
          x: d.x + 6,
          y: d.y + 8,
          w: 20,
          h: 20,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          kind: "orb",
          friendly: false,
          dmg: 10,
          life: 4,
          warn: 0,
        });
      }
    }
  }

  private ensureDrones(count: number) {
    const spots = [
      { x: 210, y: 128 },
      { x: 1020, y: 140 },
      { x: 620, y: 96 },
    ];
    while (this.drones.filter((d) => d.alive).length < count) {
      const i = this.drones.filter((d) => d.alive).length;
      const s = spots[i % spots.length]!;
      this.drones.push({
        id: this.nextId++,
        x: s.x,
        y: s.y,
        baseX: s.x,
        baseY: s.y,
        w: 44,
        h: 32,
        hp: 68,
        t: Math.random() * 3,
        shoot: 1.1 + i * 0.3,
        alive: true,
        hitSwing: -1,
      });
    }
  }

  private updateHazards(dt: number) {
    if (this.boss.phase >= 2 && this.boss.mode !== "intro" && this.boss.mode !== "phasebreak") {
      this.emberCd -= dt;
      if (this.emberCd <= 0) {
        const n = this.boss.phase === 3 ? 2 : 1;
        for (let i = 0; i < n; i++) {
          const x = 70 + Math.random() * (WORLD_W - 140);
          this.projectiles.push({
            x,
            y: -20,
            w: 22,
            h: 22,
            vx: 0,
            vy: 0,
            kind: "ember",
            friendly: false,
            dmg: 14,
            life: 5,
            warn: 0.72,
          });
        }
        this.emberCd = this.boss.phase === 3 ? 2.05 : 3.15;
      }
    }
    if (this.boss.phase === 3 && this.boss.mode !== "intro" && this.boss.mode !== "phasebreak") {
      this.lavaT += dt;
      const local = this.lavaT % 5.6;
      this.lavaWarn = local > 1.8 && local < 3.25;
      this.lavaOn = local >= 3.25 && local < 5.15;
    } else {
      this.lavaWarn = false;
      this.lavaOn = false;
    }
    if (this.lavaOn && this.player.groundId === 0 && this.player.lavaTick <= 0 && !this.player.dashing) {
      this.player.lavaTick = 0.42;
      this.hurt(8, 0, false);
    }
  }

  private updateProjectiles(dt: number) {
    const p = this.player;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i]!;
      if (pr.warn > 0) {
        pr.warn -= dt;
        if (pr.warn <= 0 && pr.kind === "ember") pr.vy = 520;
        continue;
      }
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.life -= dt;
      if (pr.life <= 0 || pr.x < -80 || pr.x > WORLD_W + 80 || pr.y > WORLD_H + 40) {
        this.projectiles.splice(i, 1);
        continue;
      }
      if (!pr.friendly && pr.kind !== "wave" && p.dashing && overlaps(pr, p)) {
        const cx = this.boss.x + this.boss.w / 2;
        const cy = this.boss.y + this.boss.h / 2;
        const ang = Math.atan2(cy - (pr.y + pr.h / 2), cx - (pr.x + pr.w / 2));
        pr.friendly = true;
        pr.vx = Math.cos(ang) * 620;
        pr.vy = Math.sin(ang) * 620;
        pr.dmg = REFLECT_DAMAGE;
        this.events.push({ t: "sfx", name: "reflect" });
        this.events.push({ t: "float", x: pr.x, y: pr.y, text: "RETURNED", color: "#00ffcc" });
        continue;
      }
      if (!pr.friendly && overlaps(pr, p)) {
        const jumpedWave = pr.kind === "wave" && p.y + p.h < pr.y + 8;
        if (!jumpedWave) this.hurt(pr.dmg, Math.sign(pr.vx) || 1, pr.kind === "wave");
        this.projectiles.splice(i, 1);
        continue;
      }
      if (pr.friendly && overlaps(pr, this.boss)) {
        this.damageBoss(pr.dmg, pr.x, pr.y);
        this.projectiles.splice(i, 1);
      }
    }
    if (this.projectiles.length > 48) this.projectiles.splice(0, this.projectiles.length - 48);
  }

  private attackRect(): Body {
    const p = this.player;
    const reach = p.combo === 2 ? 74 : 58;
    return {
      x: p.facing > 0 ? p.x + p.w * 0.35 : p.x + p.w * 0.65 - reach,
      y: p.y + 6,
      w: reach,
      h: p.h - 8,
    };
  }

  private resolvePlayerAttack() {
    const p = this.player;
    if (p.attackTimer <= 0) return;
    const elapsed = ATTACK_DUR - p.attackTimer;
    if (elapsed < 0.08 || elapsed > 0.2) return;
    const box = this.attackRect();
    const dmg = SLASH[p.combo] ?? 30;
    if (!p.bossHit && overlaps(box, this.boss)) {
      p.bossHit = true;
      if (this.damageBoss(dmg, this.boss.x + this.boss.w / 2, this.boss.y + 50)) {
        p.heat = Math.min(100, p.heat + (HEAT_ON_HIT[p.combo] ?? 10));
        if (p.heat >= 100) {
          p.heat = 100;
          if (!p.latched) p.heatHold = 0;
          p.latched = true;
        }
        if (p.combo === 2) {
          this.events.push({ t: "float", x: p.x, y: p.y - 28, text: "3-HIT", color: "#ff9900" });
        }
      }
    }
    for (const d of this.drones) {
      if (!d.alive || d.hitSwing === this.swing) continue;
      if (!overlaps(box, d)) continue;
      d.hitSwing = this.swing;
      d.hp -= dmg;
      this.events.push({ t: "impact", x: d.x + d.w / 2, y: d.y + d.h / 2 });
      this.events.push({ t: "sfx", name: "hit" });
      if (d.hp <= 0) {
        d.alive = false;
        this.events.push({
          t: "burst",
          x: d.x,
          y: d.y,
          n: 12,
          color: "#ff3366",
          speed: 180,
          life: 0.4,
        });
      }
    }
  }

  private coreRect(): Body {
    const p = this.player;
    const reach = 250;
    return {
      x: p.facing > 0 ? p.x + p.w * 0.2 : p.x + p.w * 0.8 - reach,
      y: p.y - 8,
      w: reach,
      h: p.h + 20,
    };
  }

  private resolveCore() {
    const p = this.player;
    if (!p.coreTick) return;
    p.coreTick = false;
    const box = this.coreRect();
    this.damageBoss(CORE_DAMAGE, box.x + box.w / 2, p.y + 20);
    this.events.push({ t: "impact", x: box.x + box.w / 2, y: p.y + p.h / 2 });
    for (const d of this.drones) {
      if (!d.alive || !overlaps(box, d)) continue;
      d.alive = false;
      this.events.push({ t: "burst", x: d.x, y: d.y, n: 10, color: "#00ffcc", speed: 200, life: 0.35 });
    }
    this.projectiles = this.projectiles.filter((pr) => pr.friendly || !overlaps(pr, box));
    this.events.push({
      t: "burst",
      x: box.x + box.w / 2,
      y: p.y + p.h / 2,
      n: 24,
      color: "#00ffcc",
      speed: 280,
      life: 0.4,
    });
  }

  private resolveContact() {
    if (this.boss.mode === "intro" || this.boss.mode === "phasebreak" || this.boss.mode === "dead") return;
    if (overlaps(this.player, this.boss)) {
      const dir = this.player.x + this.player.w / 2 < this.boss.x + this.boss.w / 2 ? -1 : 1;
      this.hurt(14, dir, false);
    }
  }

  private hurt(amount: number, dir: number, heavy: boolean) {
    const p = this.player;
    if (p.hp <= 0 || p.invuln > 0 || p.dashing || this.ending) return;
    p.hp = Math.max(0, p.hp - amount);
    p.invuln = 0.75;
    p.vx = dir * (heavy ? 320 : 200);
    p.vy = heavy ? -280 : -200;
    p.lockout = 0.16;
    p.dashing = false;
    this.hitsTaken += 1;
    this.events.push({ t: "sfx", name: "hurt" });
    this.events.push({ t: "shake", n: heavy ? 0.58 : 0.36 });
    this.events.push({ t: "hitstop", n: 0.045 });
    this.events.push({ t: "flash", color: "#ff3366" });
    this.events.push({
      t: "burst",
      x: p.x + p.w / 2,
      y: p.y + 20,
      n: 12,
      color: "#ff3366",
      speed: 200,
      life: 0.35,
    });
    this.events.push({ t: "float", x: p.x, y: p.y - 8, text: `-${amount}`, color: "#ff3366" });
    if (p.hp <= 0) {
      this.ending = "lose";
      this.endTimer = 0.95;
      this.events.push({ t: "sfx", name: "lose" });
      this.events.push({ t: "shake", n: 0.8 });
    }
  }

  private damageBoss(amount: number, x: number, y: number) {
    const b = this.boss;
    if (b.hp <= 0 || b.invuln > 0 || this.ending) return false;
    b.hp = Math.max(0, b.hp - amount);
    b.flash = 0.12;
    this.hitsLanded += 1;
    this.events.push({ t: "sfx", name: "hit" });
    this.events.push({ t: "shake", n: amount > 100 ? 0.62 : 0.3 });
    this.events.push({ t: "hitstop", n: amount > 100 ? 0.08 : 0.04 });
    this.events.push({ t: "burst", x, y, n: 10, color: "#00ffcc", speed: 200, life: 0.32 });
    this.events.push({ t: "impact", x, y });
    this.events.push({ t: "float", x, y, text: String(amount), color: "#00ffcc" });
    if (b.hp <= 0) {
      this.ending = "win";
      this.endTimer = 1.5;
      this.clearMs = this.time * 1000;
      b.mode = "dead";
      this.projectiles = [];
      this.drones.forEach((d) => {
        d.alive = false;
      });
      this.events.push({ t: "sfx", name: "win" });
      this.events.push({ t: "shake", n: 0.95 });
      this.events.push({ t: "hitstop", n: 0.16 });
      this.events.push({ t: "flash", color: "#00ffcc" });
      this.events.push({
        t: "burst",
        x: b.x + b.w / 2,
        y: b.y + b.h / 2,
        n: 36,
        color: "#ff9900",
        speed: 340,
        life: 0.7,
      });
      return true;
    }
    const next = phaseOf(b.hp, b.maxHp);
    if (next !== b.phase) this.enterPhase(next);
    return true;
  }

  private enterPhase(phase: 1 | 2 | 3) {
    const b = this.boss;
    b.phase = phase;
    b.mode = "phasebreak";
    b.timer = 1.15;
    b.invuln = 1.15;
    b.vx = 0;
    b.vy = 0;
    b.y = this.restY();
    this.projectiles = [];
    if (phase >= 2) this.ensureDrones(phase === 2 ? 2 : 3);
    this.banner = phase === 2 ? "PHASE II  ·  CINDER" : "PHASE III  ·  WHITE ASH";
    this.bannerT = 1.15;
    this.events.push({ t: "sfx", name: "roar" });
    this.events.push({ t: "shake", n: 0.7 });
    this.events.push({ t: "flash", color: "#ff3366" });
  }

  attackLabel() {
    if (this.boss.attack === "charge") return "CHARGE";
    if (this.boss.attack === "slam") return "SLAM";
    return "FIRE WAVE";
  }
}
