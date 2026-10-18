import { pick, ready, type Art } from "./assets";
import {
  FLOOR_Y,
  WORLD_H,
  WORLD_W,
  type GameSim,
  type SimEvent,
} from "./sim";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
};

type Floater = { x: number; y: number; vy: number; life: number; text: string; color: string };
type Impact = { x: number; y: number; life: number };

const ATTACK_DUR = 0.32;

export class WorldRenderer {
  particles: Particle[] = [];
  floaters: Floater[] = [];
  impacts: Impact[] = [];
  trauma = 0;
  flash = 0;
  flashColor = "#ff3366";
  clock = 0;
  private motes = 0;

  apply(events: SimEvent[], shake: boolean) {
    for (const e of events) {
      if (e.t === "shake" && shake) this.trauma = Math.min(1, this.trauma + e.n);
      else if (e.t === "flash" && shake) {
        this.flash = 0.22;
        this.flashColor = e.color;
      } else if (e.t === "burst") this.burst(e.x, e.y, e.n, e.color, e.speed, e.life);
      else if (e.t === "float") {
        this.floaters.push({ x: e.x, y: e.y, vy: -46, life: 0.7, text: e.text, color: e.color });
      } else if (e.t === "impact") this.impacts.push({ x: e.x, y: e.y, life: 0.28 });
    }
  }

  update(dt: number) {
    this.clock += dt;
    this.trauma = Math.max(0, this.trauma - dt * 1.5);
    this.flash = Math.max(0, this.flash - dt);
    this.motes -= dt;
    if (this.motes <= 0 && this.particles.length < 160) {
      this.motes = 0.08;
      this.particles.push({
        x: Math.random() * WORLD_W,
        y: WORLD_H + 4,
        vx: (Math.random() - 0.5) * 16,
        vy: -20 - Math.random() * 30,
        life: 2.4,
        max: 2.4,
        size: 1.5 + Math.random() * 2,
        color: Math.random() > 0.7 ? "#ff9900" : "#8a99ad",
      });
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 40 * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i]!;
      f.y += f.vy * dt;
      f.life -= dt;
      if (f.life <= 0) this.floaters.splice(i, 1);
    }
    for (let i = this.impacts.length - 1; i >= 0; i--) {
      this.impacts[i]!.life -= dt;
      if (this.impacts[i]!.life <= 0) this.impacts.splice(i, 1);
    }
  }

  draw(ctx: CanvasRenderingContext2D, sim: GameSim, art: Art, shake: boolean) {
    const canvas = ctx.canvas;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#050508";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const scale = Math.min(canvas.width / WORLD_W, canvas.height / WORLD_H);
    const ox = (canvas.width - WORLD_W * scale) / 2;
    const oy = (canvas.height - WORLD_H * scale) / 2;
    const mag = shake ? this.trauma * this.trauma : 0;
    const sx = Math.sin(this.clock * 43) * 18 * mag;
    const sy = Math.cos(this.clock * 37) * 12 * mag;
    ctx.setTransform(scale, 0, 0, scale, ox + sx * scale, oy + sy * scale);

    this.drawBackdrop(ctx, art);
    this.drawPlatforms(ctx, sim);
    this.drawTelegraphs(ctx, sim);
    this.drawProjectiles(ctx, sim, art);
    this.drawDrones(ctx, sim, art);
    this.drawBoss(ctx, sim, art);
    this.drawPlayer(ctx, sim, art);
    this.drawImpacts(ctx, art);
    this.drawParticles(ctx);
    this.drawFloaters(ctx);
    this.drawBanner(ctx, sim);

    if (this.flash > 0 && shake) {
      ctx.fillStyle = this.flashColor;
      ctx.globalAlpha = this.flash * 0.35;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
      ctx.globalAlpha = 1;
    }
  }

  private burst(x: number, y: number, n: number, color: string, speed: number, life: number) {
    for (let i = 0; i < n && this.particles.length < 200; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = speed * (0.35 + Math.random());
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life,
        max: life,
        size: 2 + Math.random() * 3,
        color,
      });
    }
  }

  private drawBackdrop(ctx: CanvasRenderingContext2D, art: Art) {
    if (ready(art.bg)) {
      const iw = art.bg.naturalWidth;
      const ih = art.bg.naturalHeight;
      const s = Math.max(WORLD_W / iw, WORLD_H / ih);
      const dw = iw * s;
      const dh = ih * s;
      ctx.drawImage(art.bg, (WORLD_W - dw) / 2, WORLD_H - dh, dw, dh);
    } else {
      ctx.fillStyle = "#090a10";
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
    ctx.fillStyle = "rgba(5,5,8,0.28)";
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    ctx.strokeStyle = "rgba(0,255,204,0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < WORLD_W; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, WORLD_H);
      ctx.stroke();
    }
  }

  private drawPlatforms(ctx: CanvasRenderingContext2D, sim: GameSim) {
    for (const pl of sim.platforms) {
      const floor = !pl.oneWay;
      if (floor && sim.lavaOn) ctx.fillStyle = "#6a2418";
      else if (floor && sim.lavaWarn) ctx.fillStyle = "#3a2418";
      else ctx.fillStyle = "#141824";
      ctx.fillRect(pl.x, pl.y, pl.w, floor ? 84 : pl.h);
      ctx.fillStyle = floor && (sim.lavaOn || sim.lavaWarn) ? "#ff9900" : "#00ffcc";
      ctx.globalAlpha = floor && sim.lavaWarn && !sim.lavaOn ? 0.45 + Math.sin(sim.anim * 16) * 0.35 : 1;
      ctx.fillRect(pl.x, pl.y, pl.w, 3);
      ctx.globalAlpha = 1;
      if (!floor) {
        ctx.fillStyle = "#2c3348";
        for (let x = pl.x + 10; x < pl.x + pl.w - 6; x += 28) {
          ctx.fillRect(x, pl.y + 7, 4, 4);
        }
      }
    }
  }

  private drawTelegraphs(ctx: CanvasRenderingContext2D, sim: GameSim) {
    const b = sim.boss;
    if (b.mode !== "telegraph" && b.mode !== "act") return;
    const blink = 0.35 + Math.abs(Math.sin(sim.anim * 18)) * 0.35;
    ctx.globalAlpha = blink;
    ctx.fillStyle = "rgba(255,51,102,0.28)";
    if (b.attack === "charge") {
      const x = b.facing > 0 ? b.x + b.w : 0;
      const w = b.facing > 0 ? WORLD_W - x : b.x;
      ctx.fillRect(x, b.y + 20, w, b.h - 30);
    } else if (b.attack === "slam") {
      ctx.fillRect(b.slamX, 40, b.w, FLOOR_Y - 40);
    } else {
      ctx.strokeStyle = "rgba(255,51,102,0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.x + b.w / 2, b.y + 60);
      ctx.lineTo(sim.player.x + sim.player.w / 2, sim.player.y + sim.player.h / 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (b.mode === "telegraph" || b.mode === "act") {
      ctx.fillStyle = "#ff3366";
      ctx.font = "600 16px 'Chakra Petch', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(sim.attackLabel(), b.x + b.w / 2, b.y - 16);
    }
  }

  private drawProjectiles(ctx: CanvasRenderingContext2D, sim: GameSim, art: Art) {
    for (const pr of sim.projectiles) {
      if (pr.kind === "ember" && pr.warn > 0) {
        ctx.strokeStyle = "#ff9900";
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.ellipse(pr.x + 11, FLOOR_Y - 2, 16, 6, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        continue;
      }
      if (pr.kind === "wave") {
        ctx.fillStyle = "#ff3366";
        ctx.fillRect(pr.x, pr.y, pr.w, pr.h);
        ctx.fillStyle = "#ff9900";
        ctx.fillRect(pr.x, pr.y, pr.w, 4);
        continue;
      }
      const img = pick(art.orb, Math.floor(sim.anim * 12));
      if (img) {
        blit(ctx, img, pr.x + pr.w / 2, pr.y + pr.h, pr.friendly ? 40 : 34, false, 1, 1, false);
      } else {
        ctx.fillStyle = pr.friendly ? "#00ffcc" : "#ff3366";
        ctx.beginPath();
        ctx.arc(pr.x + pr.w / 2, pr.y + pr.h / 2, pr.w / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawDrones(ctx: CanvasRenderingContext2D, sim: GameSim, art: Art) {
    for (const d of sim.drones) {
      if (!d.alive) continue;
      const img = pick(art.drone, Math.floor(d.t * 8));
      if (img) blit(ctx, img, d.x + d.w / 2, d.y + d.h + 8, 72, false, 1, 1, false);
      else {
        ctx.fillStyle = "#1a1c29";
        ctx.fillRect(d.x, d.y, d.w, d.h);
        ctx.fillStyle = "#ff3366";
        ctx.fillRect(d.x + 16, d.y + 10, 12, 6);
      }
    }
  }

  private drawBoss(ctx: CanvasRenderingContext2D, sim: GameSim, art: Art) {
    const b = sim.boss;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(b.x + b.w / 2, FLOOR_Y, 46, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    const slamming = b.attack === "slam" && (b.mode === "telegraph" || b.mode === "act");
    let frames = art.bossIdle;
    let idx = Math.floor(b.anim * 6);
    if (!pick(frames, 0)) frames = art.bossAttack;
    if (slamming && pick(art.bossAttack, 0)) {
      frames = art.bossAttack;
      idx = b.mode === "telegraph" ? 0 : b.sub === 0 ? 1 : b.sub === 1 ? 2 : 3;
    }
    const img = pick(frames, idx);
    const flash = b.flash > 0;
    if (sim.ending === "win") ctx.globalAlpha = Math.max(0.25, sim.endTimer / 1.5);
    if (img) {
      blit(ctx, img, b.x + b.w / 2, b.y + b.h, 300, b.facing < 0, 1, 1, flash);
    } else {
      drawQueenFallback(ctx, b.x, b.y, b.w, b.h, b.facing, flash);
    }
    ctx.globalAlpha = 1;
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, sim: GameSim, art: Art) {
    const p = sim.player;
    for (const g of sim.ghosts) {
      ctx.globalAlpha = g.life * 2;
      const ghost = pick(art.run, 0) ?? pick(art.idle, 0);
      if (ghost) blit(ctx, ghost, g.x + p.w / 2, g.y + p.h, 124, g.facing < 0, 1, 1, false);
      ctx.globalAlpha = 1;
    }
    if (p.invuln > 0 && Math.floor(p.anim * 20) % 2 === 0) ctx.globalAlpha = 0.35;
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(p.x + p.w / 2, p.y + p.h, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    let frames = art.idle;
    let idx = Math.floor(p.anim * 6);
    if (p.attackTimer > 0 && pick(art.attack, 0)) {
      frames = art.attack;
      idx = Math.min(3, Math.floor((1 - p.attackTimer / ATTACK_DUR) * 4));
    } else if (!p.grounded && pick(art.jump, 0)) {
      frames = art.jump;
      idx = p.vy < -180 ? 1 : p.vy < 80 ? 2 : 3;
    } else if (p.grounded && Math.abs(p.vx) > 40 && pick(art.run, 0)) {
      frames = art.run;
      idx = Math.floor(p.anim * 11);
    }
    const img = pick(frames, idx);
    const squash = p.squash;
    const sy = 1 - squash * 0.18;
    const sx = 1 + squash * 0.16;
    if (img) blit(ctx, img, p.x + p.w / 2, p.y + p.h, 128, p.facing < 0, sx, sy, false);
    else drawJacketFallback(ctx, p.x, p.y, p.w, p.h, p.facing, p.latched);

    if (p.attackTimer > 0) {
      const u = 1 - p.attackTimer / ATTACK_DUR;
      ctx.strokeStyle = p.combo === 2 ? "#ff9900" : "#ff3366";
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = p.combo === 2 ? 5 : 3;
      ctx.beginPath();
      const cx = p.facing > 0 ? p.x + p.w + 8 : p.x - 8;
      const cy = p.y + p.h * 0.42;
      const start = p.facing > 0 ? -1.1 : Math.PI + 1.1;
      ctx.arc(cx, cy, p.combo === 2 ? 48 : 34, start, start + p.facing * u * 2.4);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (p.coreT > 0) {
      const reach = 250;
      const x = p.facing > 0 ? p.x + 10 : p.x + p.w - 10 - reach;
      ctx.globalAlpha = Math.min(1, p.coreT * 4);
      ctx.fillStyle = "rgba(0,255,204,0.35)";
      ctx.fillRect(x, p.y - 6, reach, p.h + 16);
      ctx.fillStyle = "#e7fff8";
      ctx.fillRect(x, p.y + p.h * 0.35, reach, 8);
      ctx.globalAlpha = 1;
    }
    ctx.globalAlpha = 1;
  }

  private drawImpacts(ctx: CanvasRenderingContext2D, art: Art) {
    for (const hit of this.impacts) {
      const idx = Math.min(3, Math.floor((1 - hit.life / 0.28) * 4));
      const img = pick(art.impact, idx);
      ctx.globalAlpha = Math.min(1, hit.life * 4);
      if (img) blit(ctx, img, hit.x, hit.y + 30, 90, false, 1, 1, false);
      ctx.globalAlpha = 1;
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  private drawFloaters(ctx: CanvasRenderingContext2D) {
    ctx.textAlign = "center";
    ctx.font = "600 18px 'Chakra Petch', sans-serif";
    for (const f of this.floaters) {
      ctx.globalAlpha = Math.min(1, f.life * 2);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  private drawBanner(ctx: CanvasRenderingContext2D, sim: GameSim) {
    let text = "";
    if (sim.mode === "playing" && sim.boss.mode === "intro") text = "SHE IS WAKING";
    else if (sim.bannerT > 0) text = sim.banner;
    if (!text) return;
    ctx.textAlign = "center";
    ctx.fillStyle = "#ff3366";
    ctx.font = "700 28px 'Chakra Petch', sans-serif";
    ctx.fillText(text, WORLD_W / 2, 168);
  }
}

function blit(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  feetX: number,
  feetY: number,
  height: number,
  flip: boolean,
  sx: number,
  sy: number,
  flash: boolean,
) {
  const width = height * (img.width / img.height);
  ctx.save();
  ctx.translate(feetX, feetY);
  ctx.scale((flip ? -1 : 1) * sx, sy);
  if (flash) ctx.filter = "brightness(3)";
  ctx.drawImage(img, -width / 2, -height, width, height);
  ctx.restore();
}

function drawJacketFallback(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  facing: number,
  readyCore: boolean,
) {
  ctx.fillStyle = "#10141c";
  ctx.fillRect(x, y + 8, w, h - 8);
  ctx.fillStyle = readyCore ? "#00ffcc" : "#ff9900";
  ctx.fillRect(x + 8, y + 22, w - 16, 10);
  ctx.fillStyle = "#00ffcc";
  ctx.fillRect(facing > 0 ? x + w - 12 : x + 4, y + 14, 8, 4);
}

function drawQueenFallback(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  _facing: number,
  flash: boolean,
) {
  ctx.fillStyle = flash ? "#e7fff8" : "#1a1c29";
  ctx.fillRect(x, y + 16, w, h - 16);
  ctx.fillStyle = "#ff3366";
  ctx.fillRect(x + w * 0.3, y + 48, w * 0.4, 40);
  ctx.beginPath();
  ctx.moveTo(x + 8, y + 18);
  ctx.lineTo(x + 28, y - 8);
  ctx.lineTo(x + w / 2, y + 18);
  ctx.lineTo(x + w - 28, y - 8);
  ctx.lineTo(x + w - 8, y + 18);
  ctx.fill();
}
