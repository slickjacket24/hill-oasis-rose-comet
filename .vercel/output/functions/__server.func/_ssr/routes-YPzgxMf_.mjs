import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Pause, n as Volume2, t as VolumeX } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-YPzgxMf_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function loadSet(urls) {
	return urls.map((src) => {
		const img = new Image();
		img.decoding = "async";
		img.crossOrigin = "anonymous";
		img.src = src;
		return img;
	});
}
function sequence(base, count) {
	return loadSet(Array.from({ length: count }, (_, i) => `${base}${i + 1}.png`));
}
function loadArt() {
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
		bg
	};
}
function ready(img) {
	return !!img && img.complete && img.naturalWidth > 0;
}
function pick(frames, index) {
	if (!frames.length) return null;
	const img = frames[Math.abs(index) % frames.length];
	return img && ready(img) ? img : null;
}
var AudioEngine = class {
	ctx = null;
	master = null;
	music = null;
	sfx = null;
	noise = null;
	next = 0;
	step = 0;
	wantMusic = false;
	muted = false;
	intensity = 0;
	unlock() {
		if (!this.ctx) {
			this.ctx = new AudioContext({ latencyHint: "interactive" });
			this.master = this.ctx.createGain();
			this.music = this.ctx.createGain();
			this.sfx = this.ctx.createGain();
			this.music.gain.value = .16;
			this.sfx.gain.value = .85;
			this.master.gain.value = this.muted ? 0 : .9;
			this.music.connect(this.master);
			this.sfx.connect(this.master);
			this.master.connect(this.ctx.destination);
			const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * .4), this.ctx.sampleRate);
			const data = buffer.getChannelData(0);
			for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
			this.noise = buffer;
		}
		if (this.ctx.state === "suspended") this.ctx.resume();
	}
	resume() {
		if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
	}
	setMuted(muted) {
		this.muted = muted;
		if (!this.ctx || !this.master) return;
		this.master.gain.setTargetAtTime(muted ? 0 : .9, this.ctx.currentTime, .03);
	}
	startMusic() {
		this.wantMusic = true;
		this.unlock();
		if (this.ctx) this.next = this.ctx.currentTime + .05;
	}
	tick() {
		if (!this.ctx || !this.music || !this.wantMusic) return;
		const beat = 60 / (90 + this.intensity * 16) / 2;
		if (this.next < this.ctx.currentTime) this.next = this.ctx.currentTime + .02;
		while (this.next < this.ctx.currentTime + .22) {
			this.blip(this.next);
			this.next += beat;
			this.step++;
		}
	}
	play(name) {
		this.unlock();
		if (!this.ctx || !this.sfx) return;
		const now = this.ctx.currentTime;
		const rate = 1 + (Math.random() - .5) * .08;
		switch (name) {
			case "jump":
				this.tone(340 * rate, "square", .12, .05, now, false);
				break;
			case "dash":
				this.noiseBurst(.09, .08, now);
				this.tone(620 * rate, "sawtooth", .08, .04, now, false);
				break;
			case "slash":
				this.tone(180 * rate, "triangle", .1, .07, now, false);
				this.tone(420 * rate, "square", .06, .03, now, false);
				break;
			case "hit":
				this.tone(110 * rate, "sawtooth", .12, .08, now, false);
				break;
			case "hurt":
				this.tone(90, "square", .18, .09, now, false);
				this.noiseBurst(.12, .06, now);
				break;
			case "roar":
				this.tone(70, "sawtooth", .45, .12, now, false);
				this.tone(48, "square", .4, .08, now + .12, false);
				break;
			case "boom":
				this.tone(60, "sawtooth", .4, .16, now, false);
				this.noiseBurst(.3, .12, now);
				break;
			case "core":
				this.tone(220, "sawtooth", .22, .08, now, false);
				this.tone(660, "square", .18, .05, now + .05, false);
				break;
			case "land":
				this.noiseBurst(.05, .04, now);
				break;
			case "reflect":
				this.tone(520 * rate, "square", .1, .05, now, false);
				break;
			case "win":
				this.tone(440, "square", .18, .06, now, false);
				this.tone(554, "square", .2, .06, now + .12, false);
				this.tone(659, "triangle", .35, .07, now + .24, false);
				break;
			case "lose":
				this.tone(160, "sawtooth", .35, .08, now, false);
				this.tone(90, "square", .4, .07, now + .16, false);
		}
	}
	blip(when) {
		const bass = [
			110,
			110,
			130.81,
			98,
			110,
			146.83,
			130.81,
			87.31
		];
		const arp = [
			220,
			261.63,
			329.63,
			392,
			329.63,
			261.63,
			196,
			246.94
		];
		if (this.step % 2 === 0) this.tone(bass[this.step / 2 % bass.length], "sawtooth", .16, .035, when, true);
		if (this.intensity > 0) this.tone(arp[this.step % arp.length], "triangle", .07, .02, when, true);
	}
	tone(freq, type, duration, vol, when, musical) {
		if (!this.ctx || !this.sfx || !this.music) return;
		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();
		osc.type = type;
		osc.frequency.setValueAtTime(freq, when);
		gain.gain.setValueAtTime(vol, when);
		gain.gain.exponentialRampToValueAtTime(1e-4, when + duration);
		osc.connect(gain);
		gain.connect(musical ? this.music : this.sfx);
		osc.start(when);
		osc.stop(when + duration + .02);
	}
	noiseBurst(duration, vol, when) {
		if (!this.ctx || !this.sfx || !this.noise) return;
		const src = this.ctx.createBufferSource();
		src.buffer = this.noise;
		const filter = this.ctx.createBiquadFilter();
		filter.type = "highpass";
		filter.frequency.value = 400;
		const gain = this.ctx.createGain();
		gain.gain.setValueAtTime(vol, when);
		gain.gain.exponentialRampToValueAtTime(1e-4, when + duration);
		src.connect(filter);
		filter.connect(gain);
		gain.connect(this.sfx);
		src.start(when);
		src.stop(when + duration + .02);
	}
};
var GAME_KEYS = /* @__PURE__ */ new Set([
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
	"ShiftRight"
]);
function deadzone(x, y, dz = .18) {
	const m = Math.hypot(x, y);
	if (m < dz) return {
		x: 0,
		y: 0
	};
	const s = (m - dz) / (1 - dz) / m;
	return {
		x: x * s,
		y: y * s
	};
}
var Input = class {
	keys = /* @__PURE__ */ new Set();
	touch = {
		left: false,
		right: false,
		jump: false,
		dash: false,
		attack: false,
		special: false
	};
	prev = {
		jump: false,
		dash: false,
		attack: false,
		special: false,
		pause: false,
		confirm: false
	};
	boundDown;
	boundUp;
	boundBlur;
	boundVis;
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
	setTouch(key, down) {
		this.touch[key] = down;
	}
	/** QA probe: replace held keys until the next call. */
	setKeys(codes) {
		this.keys.clear();
		for (const code of codes) this.keys.add(code);
	}
	sample() {
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
		const drop = this.keys.has("KeyS") || this.keys.has("ArrowDown") || Boolean(pad?.buttons[13]?.pressed);
		const jump = this.keys.has("Space") || this.keys.has("KeyW") || this.keys.has("ArrowUp") || this.touch.jump || Boolean(pad?.buttons[0]?.pressed) || Boolean(pad?.buttons[12]?.pressed);
		const dash = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight") || this.touch.dash || Boolean(pad?.buttons[1]?.pressed) || Boolean(pad?.buttons[5]?.pressed);
		const attack = this.keys.has("KeyJ") || this.keys.has("KeyX") || this.touch.attack || Boolean(pad?.buttons[2]?.pressed);
		const special = this.keys.has("KeyK") || this.keys.has("KeyC") || this.touch.special || Boolean(pad?.buttons[3]?.pressed);
		const pause = this.keys.has("Escape") || this.keys.has("KeyP") || Boolean(pad?.buttons[9]?.pressed);
		const confirm = this.keys.has("Enter") || this.keys.has("Space") || Boolean(pad?.buttons[0]?.pressed) || Boolean(pad?.buttons[9]?.pressed);
		const actions = {
			moveX,
			drop,
			jump,
			jumpPressed: jump && !this.prev.jump,
			jumpReleased: !jump && this.prev.jump,
			dashPressed: dash && !this.prev.dash,
			attackPressed: attack && !this.prev.attack,
			specialPressed: special && !this.prev.special,
			pausePressed: pause && !this.prev.pause,
			confirmPressed: confirm && !this.prev.confirm
		};
		this.prev = {
			jump,
			dash,
			attack,
			special,
			pause,
			confirm
		};
		return actions;
	}
};
function readPad() {
	const pads = navigator.getGamepads?.();
	if (!pads) return null;
	for (const pad of pads) if (pad && pad.connected) return pad;
	return null;
}
var WORLD_W = 1280;
var SLASH = [
	30,
	40,
	72
];
var HEAT_ON_HIT = [
	12,
	16,
	24
];
var CORE_DAMAGE = 170;
var REFLECT_DAMAGE = 48;
var HEAT_SWING = 16;
var OVERHEAT_TIME = 3.3;
var ATTACK_DUR$1 = .32;
var PLATFORMS = [
	{
		x: 0,
		y: 636,
		w: WORLD_W,
		h: 90,
		oneWay: false
	},
	{
		x: 64,
		y: 512,
		w: 280,
		h: 18,
		oneWay: true
	},
	{
		x: 936,
		y: 512,
		w: 280,
		h: 18,
		oneWay: true
	},
	{
		x: 450,
		y: 368,
		w: 380,
		h: 18,
		oneWay: true
	},
	{
		x: 120,
		y: 236,
		w: 220,
		h: 16,
		oneWay: true
	},
	{
		x: 940,
		y: 236,
		w: 220,
		h: 16,
		oneWay: true
	}
];
function overlaps(a, b) {
	return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function clamp(v, lo, hi) {
	return Math.max(lo, Math.min(hi, v));
}
function phaseOf(hp, max) {
	const r = hp / max;
	if (r > .66) return 1;
	if (r > .33) return 2;
	return 3;
}
var GameSim = class {
	mode = "title";
	ending = null;
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
	projectiles = [];
	drones = [];
	ghosts = [];
	events = [];
	platforms = PLATFORMS;
	player = this.makePlayer();
	boss = this.makeBoss();
	makePlayer() {
		return {
			x: 150,
			y: 574,
			w: 34,
			h: 62,
			vx: 0,
			vy: 0,
			facing: 1,
			grounded: true,
			groundId: 0,
			coyote: .1,
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
			anim: 0
		};
	}
	makeBoss() {
		return {
			x: 980,
			y: 478,
			w: 108,
			h: 158,
			vx: 0,
			vy: 0,
			facing: -1,
			hp: 980,
			maxHp: 980,
			phase: 1,
			mode: "intro",
			attack: "charge",
			timer: 1.45,
			sub: 0,
			slamX: 700,
			lastAttack: "",
			repeat: 0,
			invuln: 0,
			flash: 0,
			anim: 0
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
		this.events.push({
			t: "sfx",
			name: "roar"
		});
	}
	pullEvents() {
		const ev = this.events;
		this.events = [];
		return ev;
	}
	step(dt, a) {
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
			if (this.ending === "win") this.boss.y = Math.min(616, this.boss.y + 28 * dt);
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
	updatePlayer(dt, a) {
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
			if (p.heatHold > 3.3) {
				p.latched = false;
				p.heat = 24;
				p.heatHold = 0;
				this.hurt(12, 0, false);
				p.lockout = .35;
				this.events.push({
					t: "sfx",
					name: "boom"
				});
				this.events.push({
					t: "float",
					x: p.x,
					y: p.y - 20,
					text: "OVERHEAT",
					color: "#ff9900"
				});
			}
		} else if (p.attackTimer <= 0) p.heat = Math.max(0, p.heat - 15 * dt);
		if (a.specialPressed && p.latched && !p.dashing && p.hp > 0) {
			if (a.moveX < -.2) p.facing = -1;
			else if (a.moveX > .2) p.facing = 1;
			p.latched = false;
			p.heat = 0;
			p.heatHold = 0;
			p.coreT = .26;
			p.coreTick = true;
			p.attackTimer = 0;
			this.events.push({
				t: "sfx",
				name: "core"
			});
			this.events.push({
				t: "shake",
				n: .55
			});
		}
		const canAct = p.lockout <= 0 && !p.dashing;
		if (a.attackPressed && canAct && p.attackTimer <= 0 && p.recover <= 0 && p.coreT <= 0) {
			if (p.comboWindow > 0 && p.combo < 2) p.combo += 1;
			else p.combo = 0;
			p.comboWindow = 0;
			p.attackTimer = ATTACK_DUR$1;
			p.bossHit = false;
			this.swing += 1;
			p.heat = Math.min(100, p.heat + HEAT_SWING);
			if (p.heat >= 100) {
				p.heat = 100;
				if (!p.latched) p.heatHold = 0;
				p.latched = true;
			}
			this.events.push({
				t: "sfx",
				name: "slash"
			});
		}
		if (p.attackTimer > 0) {
			p.attackTimer -= dt;
			if (p.attackTimer <= 0) {
				if (p.combo >= 2) {
					p.combo = 0;
					p.comboWindow = 0;
					p.recover = .14;
				} else p.comboWindow = .42;
			}
		} else if (p.comboWindow > 0) {
			p.comboWindow -= dt;
			if (p.comboWindow <= 0) p.combo = 0;
		}
		if (a.dashPressed && p.dashCd <= 0 && !p.dashing && p.lockout <= 0) {
			if (a.moveX < -.2) p.facing = -1;
			else if (a.moveX > .2) p.facing = 1;
			p.dashing = true;
			p.dashT = .16;
			p.dashCd = .58;
			p.vy = 0;
			this.events.push({
				t: "sfx",
				name: "dash"
			});
		}
		if (a.moveX < -.2 && p.attackTimer <= 0) p.facing = -1;
		else if (a.moveX > .2 && p.attackTimer <= 0) p.facing = 1;
		if (a.jumpPressed) p.jumpBuffer = .13;
		else p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);
		if (p.jumpBuffer > 0 && (p.grounded || p.coyote > 0) && !p.dashing && p.lockout <= 0) {
			const plat = p.groundId >= 0 ? this.platforms[p.groundId] : void 0;
			if (a.drop && plat?.oneWay) {
				p.ignoreId = p.groundId;
				p.ignoreT = .28;
				p.vy = 90;
				p.grounded = false;
				p.coyote = 0;
				p.jumpBuffer = 0;
			} else {
				p.vy = -780;
				p.grounded = false;
				p.coyote = 0;
				p.jumpBuffer = 0;
				this.events.push({
					t: "sfx",
					name: "jump"
				});
				this.events.push({
					t: "burst",
					x: p.x + p.w / 2,
					y: p.y + p.h,
					n: 7,
					color: "#00ffcc",
					speed: 120,
					life: .28
				});
			}
		}
		if (a.jumpReleased && p.vy < -180) p.vy *= .48;
		if (p.dashing) {
			p.vx = p.facing * 920;
			p.vy = 0;
			p.dashT -= dt;
			this.ghosts.push({
				x: p.x,
				y: p.y,
				facing: p.facing,
				life: .16
			});
			if (this.ghosts.length > 7) this.ghosts.shift();
			if (p.dashT <= 0) p.dashing = false;
		} else {
			const accel = (p.grounded ? 3400 : 1900) * (p.lockout > 0 ? .45 : 1);
			const diff = a.moveX * 320 - p.vx;
			const step = Math.sign(diff) * Math.min(Math.abs(diff), accel * dt);
			p.vx += step;
			if (Math.abs(a.moveX) < .1) {
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
		if (p.x + p.w > 1270) {
			p.x = 1270 - p.w;
			p.vx = 0;
		}
		const wasGrounded = p.grounded;
		let impact = 0;
		let remain = p.vy * dt;
		p.grounded = false;
		const stepY = 8;
		while (Math.abs(remain) > 1e-4) {
			const dy = Math.sign(remain) * Math.min(Math.abs(remain), stepY);
			remain -= dy;
			const prevBottom = p.y + p.h;
			p.y += dy;
			for (let i = 0; i < this.platforms.length; i++) {
				const pl = this.platforms[i];
				if (p.ignoreId === i) continue;
				if (!(p.x + p.w > pl.x + 2 && p.x < pl.x + pl.w - 2)) continue;
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
				const pl = this.platforms[i];
				if (p.ignoreId === i) continue;
				if (!(p.x + p.w > pl.x + 2 && p.x < pl.x + pl.w - 2)) continue;
				if (feet >= pl.y - 2 && feet <= pl.y + 8 && p.y < pl.y) {
					p.y = pl.y - p.h;
					p.vy = 0;
					p.grounded = true;
					p.groundId = i;
					break;
				}
			}
		}
		if (p.grounded) p.coyote = .1;
		else {
			p.coyote = Math.max(0, p.coyote - dt);
			p.groundId = -1;
		}
		if (!wasGrounded && p.grounded && impact > 460) {
			p.squash = 1;
			this.events.push({
				t: "sfx",
				name: "land"
			});
			this.events.push({
				t: "burst",
				x: p.x + p.w / 2,
				y: p.y + p.h,
				n: 6,
				color: "#8a99ad",
				speed: 80,
				life: .25
			});
		}
	}
	restY() {
		return 636 - this.boss.h;
	}
	facePlayer() {
		const b = this.boss;
		b.facing = this.player.x + this.player.w / 2 < b.x + b.w / 2 ? -1 : 1;
	}
	driftBoss(dt) {
		const b = this.boss;
		const dx = (this.player.x + this.player.w / 2 < 640 ? 900 : 240) - b.x;
		b.x += Math.sign(dx) * Math.min(Math.abs(dx), 78 * dt);
		b.x = clamp(b.x, 30, WORLD_W - b.w - 30);
		this.facePlayer();
	}
	recover(time) {
		const b = this.boss;
		b.mode = "recover";
		b.timer = time;
		b.vx = 0;
		b.vy = 0;
		b.y = this.restY();
	}
	beginAttack() {
		const b = this.boss;
		const options = [
			"charge",
			"slam",
			"volley"
		];
		let attack = options[Math.floor(Math.random() * options.length)];
		if (attack === b.lastAttack && b.repeat >= 1) attack = options[(options.indexOf(attack) + 1) % options.length];
		b.repeat = attack === b.lastAttack ? b.repeat + 1 : 0;
		b.lastAttack = attack;
		b.attack = attack;
		b.mode = "telegraph";
		b.sub = 0;
		this.facePlayer();
		const i = b.phase - 1;
		if (attack === "charge") b.timer = [
			.7,
			.5,
			.36
		][i];
		else if (attack === "slam") b.timer = [
			.62,
			.48,
			.4
		][i];
		else b.timer = [
			.52,
			.4,
			.32
		][i];
		if (attack === "slam") b.slamX = this.player.x + this.player.w / 2 - b.w / 2;
		if (attack === "charge") this.events.push({
			t: "sfx",
			name: "roar"
		});
	}
	startAct() {
		const b = this.boss;
		b.mode = "act";
		b.sub = 0;
		const i = b.phase - 1;
		if (b.attack === "charge") {
			b.timer = .92;
			b.vx = b.facing * [
				520,
				660,
				800
			][i];
		} else if (b.attack === "slam") {
			b.timer = .26;
			b.vy = -620;
		} else {
			this.fireVolley();
			b.timer = .32;
		}
	}
	updateBoss(dt) {
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
				b.timer = .55;
			}
			return;
		}
		if (b.mode === "phasebreak") {
			b.timer -= dt;
			b.y = this.restY();
			if (b.timer <= 0) {
				b.mode = "idle";
				b.timer = .32;
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
				b.timer = b.phase === 3 ? .18 : .32;
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
			if (b.attack === "slam" && b.timer > .16) b.slamX = clamp(this.player.x + this.player.w / 2 - b.w / 2, 36, WORLD_W - b.w - 36);
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
			if (b.timer <= 0) this.recover(.38);
		}
	}
	actCharge(dt) {
		const b = this.boss;
		const prev = b.x;
		b.x += b.vx * dt;
		b.y = this.restY();
		if (b.x < 20 || b.x + b.w > 1260) {
			b.x = clamp(b.x, 20, WORLD_W - b.w - 20);
			b.vx = 0;
			b.timer = 0;
		}
		if (overlaps({
			x: Math.min(prev, b.x),
			y: b.y,
			w: Math.abs(b.x - prev) + b.w,
			h: b.h
		}, this.player)) this.hurt(b.phase === 3 ? 22 : 18, Math.sign(b.vx) || b.facing, true);
		b.timer -= dt;
		if (b.timer <= 0) this.recover(b.phase === 3 ? .32 : .46);
	}
	actSlam(dt) {
		const b = this.boss;
		if (b.sub === 0) {
			b.y += b.vy * dt;
			b.timer -= dt;
			if (b.timer <= 0) {
				b.sub = 1;
				b.timer = .34;
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
				this.events.push({
					t: "sfx",
					name: "boom"
				});
				this.events.push({
					t: "shake",
					n: .72
				});
				this.events.push({
					t: "burst",
					x: b.x + b.w / 2,
					y: 636,
					n: 22,
					color: "#ff9900",
					speed: 260,
					life: .45
				});
				if (overlaps(b, this.player)) this.hurt(22, this.player.x < b.x ? -1 : 1, true);
				this.recover(.58);
			}
		}
	}
	spawnWaves() {
		const speed = [
			280,
			360,
			460
		][this.boss.phase - 1];
		const y = 608;
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
			warn: 0
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
			warn: 0
		});
	}
	fireVolley() {
		const count = this.boss.phase === 1 ? 2 : this.boss.phase === 2 ? 3 : 5;
		const speed = [
			250,
			310,
			370
		][this.boss.phase - 1];
		const ox = this.boss.x + this.boss.w / 2;
		const oy = this.boss.y + 58;
		const tx = this.player.x + this.player.w / 2;
		const ty = this.player.y + this.player.h / 2;
		const base = Math.atan2(ty - oy, tx - ox);
		const spread = count <= 2 ? .2 : .16;
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
				warn: 0
			});
		}
	}
	updateDrones(dt) {
		const active = this.boss.mode === "idle" || this.boss.mode === "telegraph" || this.boss.mode === "act" || this.boss.mode === "recover";
		for (const d of this.drones) {
			if (!d.alive) continue;
			d.t += dt;
			d.x = d.baseX + Math.sin(d.t * 1.3) * 50;
			d.y = d.baseY + Math.cos(d.t * 1.1) * 18;
			if (!active) continue;
			d.shoot -= dt;
			if (d.shoot <= 0) {
				d.shoot = this.boss.phase === 3 ? 1.5 : 2.15;
				const ang = Math.atan2(this.player.y + this.player.h / 2 - d.y, this.player.x + this.player.w / 2 - d.x);
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
					warn: 0
				});
			}
		}
	}
	ensureDrones(count) {
		const spots = [
			{
				x: 210,
				y: 128
			},
			{
				x: 1020,
				y: 140
			},
			{
				x: 620,
				y: 96
			}
		];
		while (this.drones.filter((d) => d.alive).length < count) {
			const i = this.drones.filter((d) => d.alive).length;
			const s = spots[i % spots.length];
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
				shoot: 1.1 + i * .3,
				alive: true,
				hitSwing: -1
			});
		}
	}
	updateHazards(dt) {
		if (this.boss.phase >= 2 && this.boss.mode !== "intro" && this.boss.mode !== "phasebreak") {
			this.emberCd -= dt;
			if (this.emberCd <= 0) {
				const n = this.boss.phase === 3 ? 2 : 1;
				for (let i = 0; i < n; i++) {
					const x = 70 + Math.random() * 1140;
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
						warn: .72
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
			this.player.lavaTick = .42;
			this.hurt(8, 0, false);
		}
	}
	updateProjectiles(dt) {
		const p = this.player;
		for (let i = this.projectiles.length - 1; i >= 0; i--) {
			const pr = this.projectiles[i];
			if (pr.warn > 0) {
				pr.warn -= dt;
				if (pr.warn <= 0 && pr.kind === "ember") pr.vy = 520;
				continue;
			}
			pr.x += pr.vx * dt;
			pr.y += pr.vy * dt;
			pr.life -= dt;
			if (pr.life <= 0 || pr.x < -80 || pr.x > 1360 || pr.y > 760) {
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
				this.events.push({
					t: "sfx",
					name: "reflect"
				});
				this.events.push({
					t: "float",
					x: pr.x,
					y: pr.y,
					text: "RETURNED",
					color: "#00ffcc"
				});
				continue;
			}
			if (!pr.friendly && overlaps(pr, p)) {
				if (!(pr.kind === "wave" && p.y + p.h < pr.y + 8)) this.hurt(pr.dmg, Math.sign(pr.vx) || 1, pr.kind === "wave");
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
	attackRect() {
		const p = this.player;
		const reach = p.combo === 2 ? 74 : 58;
		return {
			x: p.facing > 0 ? p.x + p.w * .35 : p.x + p.w * .65 - reach,
			y: p.y + 6,
			w: reach,
			h: p.h - 8
		};
	}
	resolvePlayerAttack() {
		const p = this.player;
		if (p.attackTimer <= 0) return;
		const elapsed = ATTACK_DUR$1 - p.attackTimer;
		if (elapsed < .08 || elapsed > .2) return;
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
				if (p.combo === 2) this.events.push({
					t: "float",
					x: p.x,
					y: p.y - 28,
					text: "3-HIT",
					color: "#ff9900"
				});
			}
		}
		for (const d of this.drones) {
			if (!d.alive || d.hitSwing === this.swing) continue;
			if (!overlaps(box, d)) continue;
			d.hitSwing = this.swing;
			d.hp -= dmg;
			this.events.push({
				t: "impact",
				x: d.x + d.w / 2,
				y: d.y + d.h / 2
			});
			this.events.push({
				t: "sfx",
				name: "hit"
			});
			if (d.hp <= 0) {
				d.alive = false;
				this.events.push({
					t: "burst",
					x: d.x,
					y: d.y,
					n: 12,
					color: "#ff3366",
					speed: 180,
					life: .4
				});
			}
		}
	}
	coreRect() {
		const p = this.player;
		const reach = 250;
		return {
			x: p.facing > 0 ? p.x + p.w * .2 : p.x + p.w * .8 - reach,
			y: p.y - 8,
			w: reach,
			h: p.h + 20
		};
	}
	resolveCore() {
		const p = this.player;
		if (!p.coreTick) return;
		p.coreTick = false;
		const box = this.coreRect();
		this.damageBoss(CORE_DAMAGE, box.x + box.w / 2, p.y + 20);
		this.events.push({
			t: "impact",
			x: box.x + box.w / 2,
			y: p.y + p.h / 2
		});
		for (const d of this.drones) {
			if (!d.alive || !overlaps(box, d)) continue;
			d.alive = false;
			this.events.push({
				t: "burst",
				x: d.x,
				y: d.y,
				n: 10,
				color: "#00ffcc",
				speed: 200,
				life: .35
			});
		}
		this.projectiles = this.projectiles.filter((pr) => pr.friendly || !overlaps(pr, box));
		this.events.push({
			t: "burst",
			x: box.x + box.w / 2,
			y: p.y + p.h / 2,
			n: 24,
			color: "#00ffcc",
			speed: 280,
			life: .4
		});
	}
	resolveContact() {
		if (this.boss.mode === "intro" || this.boss.mode === "phasebreak" || this.boss.mode === "dead") return;
		if (overlaps(this.player, this.boss)) {
			const dir = this.player.x + this.player.w / 2 < this.boss.x + this.boss.w / 2 ? -1 : 1;
			this.hurt(14, dir, false);
		}
	}
	hurt(amount, dir, heavy) {
		const p = this.player;
		if (p.hp <= 0 || p.invuln > 0 || p.dashing || this.ending) return;
		p.hp = Math.max(0, p.hp - amount);
		p.invuln = .75;
		p.vx = dir * (heavy ? 320 : 200);
		p.vy = heavy ? -280 : -200;
		p.lockout = .16;
		p.dashing = false;
		this.hitsTaken += 1;
		this.events.push({
			t: "sfx",
			name: "hurt"
		});
		this.events.push({
			t: "shake",
			n: heavy ? .58 : .36
		});
		this.events.push({
			t: "hitstop",
			n: .045
		});
		this.events.push({
			t: "flash",
			color: "#ff3366"
		});
		this.events.push({
			t: "burst",
			x: p.x + p.w / 2,
			y: p.y + 20,
			n: 12,
			color: "#ff3366",
			speed: 200,
			life: .35
		});
		this.events.push({
			t: "float",
			x: p.x,
			y: p.y - 8,
			text: `-${amount}`,
			color: "#ff3366"
		});
		if (p.hp <= 0) {
			this.ending = "lose";
			this.endTimer = .95;
			this.events.push({
				t: "sfx",
				name: "lose"
			});
			this.events.push({
				t: "shake",
				n: .8
			});
		}
	}
	damageBoss(amount, x, y) {
		const b = this.boss;
		if (b.hp <= 0 || b.invuln > 0 || this.ending) return false;
		b.hp = Math.max(0, b.hp - amount);
		b.flash = .12;
		this.hitsLanded += 1;
		this.events.push({
			t: "sfx",
			name: "hit"
		});
		this.events.push({
			t: "shake",
			n: amount > 100 ? .62 : .3
		});
		this.events.push({
			t: "hitstop",
			n: amount > 100 ? .08 : .04
		});
		this.events.push({
			t: "burst",
			x,
			y,
			n: 10,
			color: "#00ffcc",
			speed: 200,
			life: .32
		});
		this.events.push({
			t: "impact",
			x,
			y
		});
		this.events.push({
			t: "float",
			x,
			y,
			text: String(amount),
			color: "#00ffcc"
		});
		if (b.hp <= 0) {
			this.ending = "win";
			this.endTimer = 1.5;
			this.clearMs = this.time * 1e3;
			b.mode = "dead";
			this.projectiles = [];
			this.drones.forEach((d) => {
				d.alive = false;
			});
			this.events.push({
				t: "sfx",
				name: "win"
			});
			this.events.push({
				t: "shake",
				n: .95
			});
			this.events.push({
				t: "hitstop",
				n: .16
			});
			this.events.push({
				t: "flash",
				color: "#00ffcc"
			});
			this.events.push({
				t: "burst",
				x: b.x + b.w / 2,
				y: b.y + b.h / 2,
				n: 36,
				color: "#ff9900",
				speed: 340,
				life: .7
			});
			return true;
		}
		const next = phaseOf(b.hp, b.maxHp);
		if (next !== b.phase) this.enterPhase(next);
		return true;
	}
	enterPhase(phase) {
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
		this.events.push({
			t: "sfx",
			name: "roar"
		});
		this.events.push({
			t: "shake",
			n: .7
		});
		this.events.push({
			t: "flash",
			color: "#ff3366"
		});
	}
	attackLabel() {
		if (this.boss.attack === "charge") return "CHARGE";
		if (this.boss.attack === "slam") return "SLAM";
		return "FIRE WAVE";
	}
};
var ATTACK_DUR = .32;
var WorldRenderer = class {
	particles = [];
	floaters = [];
	impacts = [];
	trauma = 0;
	flash = 0;
	flashColor = "#ff3366";
	clock = 0;
	motes = 0;
	apply(events, shake) {
		for (const e of events) if (e.t === "shake" && shake) this.trauma = Math.min(1, this.trauma + e.n);
		else if (e.t === "flash" && shake) {
			this.flash = .22;
			this.flashColor = e.color;
		} else if (e.t === "burst") this.burst(e.x, e.y, e.n, e.color, e.speed, e.life);
		else if (e.t === "float") this.floaters.push({
			x: e.x,
			y: e.y,
			vy: -46,
			life: .7,
			text: e.text,
			color: e.color
		});
		else if (e.t === "impact") this.impacts.push({
			x: e.x,
			y: e.y,
			life: .28
		});
	}
	update(dt) {
		this.clock += dt;
		this.trauma = Math.max(0, this.trauma - dt * 1.5);
		this.flash = Math.max(0, this.flash - dt);
		this.motes -= dt;
		if (this.motes <= 0 && this.particles.length < 160) {
			this.motes = .08;
			this.particles.push({
				x: Math.random() * WORLD_W,
				y: 724,
				vx: (Math.random() - .5) * 16,
				vy: -20 - Math.random() * 30,
				life: 2.4,
				max: 2.4,
				size: 1.5 + Math.random() * 2,
				color: Math.random() > .7 ? "#ff9900" : "#8a99ad"
			});
		}
		for (let i = this.particles.length - 1; i >= 0; i--) {
			const p = this.particles[i];
			p.x += p.vx * dt;
			p.y += p.vy * dt;
			p.vy += 40 * dt;
			p.life -= dt;
			if (p.life <= 0) this.particles.splice(i, 1);
		}
		for (let i = this.floaters.length - 1; i >= 0; i--) {
			const f = this.floaters[i];
			f.y += f.vy * dt;
			f.life -= dt;
			if (f.life <= 0) this.floaters.splice(i, 1);
		}
		for (let i = this.impacts.length - 1; i >= 0; i--) {
			this.impacts[i].life -= dt;
			if (this.impacts[i].life <= 0) this.impacts.splice(i, 1);
		}
	}
	draw(ctx, sim, art, shake) {
		const canvas = ctx.canvas;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.fillStyle = "#050508";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		const scale = Math.min(canvas.width / WORLD_W, canvas.height / 720);
		const ox = (canvas.width - WORLD_W * scale) / 2;
		const oy = (canvas.height - 720 * scale) / 2;
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
			ctx.globalAlpha = this.flash * .35;
			ctx.fillRect(0, 0, WORLD_W, 720);
			ctx.globalAlpha = 1;
		}
	}
	burst(x, y, n, color, speed, life) {
		for (let i = 0; i < n && this.particles.length < 200; i++) {
			const ang = Math.random() * Math.PI * 2;
			const spd = speed * (.35 + Math.random());
			this.particles.push({
				x,
				y,
				vx: Math.cos(ang) * spd,
				vy: Math.sin(ang) * spd,
				life,
				max: life,
				size: 2 + Math.random() * 3,
				color
			});
		}
	}
	drawBackdrop(ctx, art) {
		if (ready(art.bg)) {
			const iw = art.bg.naturalWidth;
			const ih = art.bg.naturalHeight;
			const s = Math.max(WORLD_W / iw, 720 / ih);
			const dw = iw * s;
			const dh = ih * s;
			ctx.drawImage(art.bg, (WORLD_W - dw) / 2, 720 - dh, dw, dh);
		} else {
			ctx.fillStyle = "#090a10";
			ctx.fillRect(0, 0, WORLD_W, 720);
		}
		ctx.fillStyle = "rgba(5,5,8,0.28)";
		ctx.fillRect(0, 0, WORLD_W, 720);
		ctx.strokeStyle = "rgba(0,255,204,0.05)";
		ctx.lineWidth = 1;
		for (let x = 0; x < WORLD_W; x += 64) {
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, 720);
			ctx.stroke();
		}
	}
	drawPlatforms(ctx, sim) {
		for (const pl of sim.platforms) {
			const floor = !pl.oneWay;
			if (floor && sim.lavaOn) ctx.fillStyle = "#6a2418";
			else if (floor && sim.lavaWarn) ctx.fillStyle = "#3a2418";
			else ctx.fillStyle = "#141824";
			ctx.fillRect(pl.x, pl.y, pl.w, floor ? 84 : pl.h);
			ctx.fillStyle = floor && (sim.lavaOn || sim.lavaWarn) ? "#ff9900" : "#00ffcc";
			ctx.globalAlpha = floor && sim.lavaWarn && !sim.lavaOn ? .45 + Math.sin(sim.anim * 16) * .35 : 1;
			ctx.fillRect(pl.x, pl.y, pl.w, 3);
			ctx.globalAlpha = 1;
			if (!floor) {
				ctx.fillStyle = "#2c3348";
				for (let x = pl.x + 10; x < pl.x + pl.w - 6; x += 28) ctx.fillRect(x, pl.y + 7, 4, 4);
			}
		}
	}
	drawTelegraphs(ctx, sim) {
		const b = sim.boss;
		if (b.mode !== "telegraph" && b.mode !== "act") return;
		ctx.globalAlpha = .35 + Math.abs(Math.sin(sim.anim * 18)) * .35;
		ctx.fillStyle = "rgba(255,51,102,0.28)";
		if (b.attack === "charge") {
			const x = b.facing > 0 ? b.x + b.w : 0;
			const w = b.facing > 0 ? WORLD_W - x : b.x;
			ctx.fillRect(x, b.y + 20, w, b.h - 30);
		} else if (b.attack === "slam") ctx.fillRect(b.slamX, 40, b.w, 596);
		else {
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
	drawProjectiles(ctx, sim, art) {
		for (const pr of sim.projectiles) {
			if (pr.kind === "ember" && pr.warn > 0) {
				ctx.strokeStyle = "#ff9900";
				ctx.globalAlpha = .8;
				ctx.beginPath();
				ctx.ellipse(pr.x + 11, 634, 16, 6, 0, 0, Math.PI * 2);
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
			if (img) blit(ctx, img, pr.x + pr.w / 2, pr.y + pr.h, pr.friendly ? 40 : 34, false, 1, 1, false);
			else {
				ctx.fillStyle = pr.friendly ? "#00ffcc" : "#ff3366";
				ctx.beginPath();
				ctx.arc(pr.x + pr.w / 2, pr.y + pr.h / 2, pr.w / 2, 0, Math.PI * 2);
				ctx.fill();
			}
		}
	}
	drawDrones(ctx, sim, art) {
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
	drawBoss(ctx, sim, art) {
		const b = sim.boss;
		ctx.fillStyle = "rgba(0,0,0,0.35)";
		ctx.beginPath();
		ctx.ellipse(b.x + b.w / 2, 636, 46, 10, 0, 0, Math.PI * 2);
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
		if (sim.ending === "win") ctx.globalAlpha = Math.max(.25, sim.endTimer / 1.5);
		if (img) blit(ctx, img, b.x + b.w / 2, b.y + b.h, 300, b.facing < 0, 1, 1, flash);
		else drawQueenFallback(ctx, b.x, b.y, b.w, b.h, b.facing, flash);
		ctx.globalAlpha = 1;
	}
	drawPlayer(ctx, sim, art) {
		const p = sim.player;
		for (const g of sim.ghosts) {
			ctx.globalAlpha = g.life * 2;
			const ghost = pick(art.run, 0) ?? pick(art.idle, 0);
			if (ghost) blit(ctx, ghost, g.x + p.w / 2, g.y + p.h, 124, g.facing < 0, 1, 1, false);
			ctx.globalAlpha = 1;
		}
		if (p.invuln > 0 && Math.floor(p.anim * 20) % 2 === 0) ctx.globalAlpha = .35;
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
		const sy = 1 - squash * .18;
		const sx = 1 + squash * .16;
		if (img) blit(ctx, img, p.x + p.w / 2, p.y + p.h, 128, p.facing < 0, sx, sy, false);
		else drawJacketFallback(ctx, p.x, p.y, p.w, p.h, p.facing, p.latched);
		if (p.attackTimer > 0) {
			const u = 1 - p.attackTimer / ATTACK_DUR;
			ctx.strokeStyle = p.combo === 2 ? "#ff9900" : "#ff3366";
			ctx.globalAlpha = .85;
			ctx.lineWidth = p.combo === 2 ? 5 : 3;
			ctx.beginPath();
			const cx = p.facing > 0 ? p.x + p.w + 8 : p.x - 8;
			const cy = p.y + p.h * .42;
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
			ctx.fillRect(x, p.y + p.h * .35, reach, 8);
			ctx.globalAlpha = 1;
		}
		ctx.globalAlpha = 1;
	}
	drawImpacts(ctx, art) {
		for (const hit of this.impacts) {
			const idx = Math.min(3, Math.floor((1 - hit.life / .28) * 4));
			const img = pick(art.impact, idx);
			ctx.globalAlpha = Math.min(1, hit.life * 4);
			if (img) blit(ctx, img, hit.x, hit.y + 30, 90, false, 1, 1, false);
			ctx.globalAlpha = 1;
		}
	}
	drawParticles(ctx) {
		for (const p of this.particles) {
			ctx.globalAlpha = Math.max(0, p.life / p.max);
			ctx.fillStyle = p.color;
			ctx.fillRect(p.x, p.y, p.size, p.size);
		}
		ctx.globalAlpha = 1;
	}
	drawFloaters(ctx) {
		ctx.textAlign = "center";
		ctx.font = "600 18px 'Chakra Petch', sans-serif";
		for (const f of this.floaters) {
			ctx.globalAlpha = Math.min(1, f.life * 2);
			ctx.fillStyle = f.color;
			ctx.fillText(f.text, f.x, f.y);
		}
		ctx.globalAlpha = 1;
	}
	drawBanner(ctx, sim) {
		let text = "";
		if (sim.mode === "playing" && sim.boss.mode === "intro") text = "SHE IS WAKING";
		else if (sim.bannerT > 0) text = sim.banner;
		if (!text) return;
		ctx.textAlign = "center";
		ctx.fillStyle = "#ff3366";
		ctx.font = "700 28px 'Chakra Petch', sans-serif";
		ctx.fillText(text, WORLD_W / 2, 168);
	}
};
function blit(ctx, img, feetX, feetY, height, flip, sx, sy, flash) {
	const width = height * (img.width / img.height);
	ctx.save();
	ctx.translate(feetX, feetY);
	ctx.scale((flip ? -1 : 1) * sx, sy);
	if (flash) ctx.filter = "brightness(3)";
	ctx.drawImage(img, -width / 2, -height, width, height);
	ctx.restore();
}
function drawJacketFallback(ctx, x, y, w, h, facing, readyCore) {
	ctx.fillStyle = "#10141c";
	ctx.fillRect(x, y + 8, w, h - 8);
	ctx.fillStyle = readyCore ? "#00ffcc" : "#ff9900";
	ctx.fillRect(x + 8, y + 22, w - 16, 10);
	ctx.fillStyle = "#00ffcc";
	ctx.fillRect(facing > 0 ? x + w - 12 : x + 4, y + 14, 8, 4);
}
function drawQueenFallback(ctx, x, y, w, h, _facing, flash) {
	ctx.fillStyle = flash ? "#e7fff8" : "#1a1c29";
	ctx.fillRect(x, y + 16, w, h - 16);
	ctx.fillStyle = "#ff3366";
	ctx.fillRect(x + w * .3, y + 48, w * .4, 40);
	ctx.beginPath();
	ctx.moveTo(x + 8, y + 18);
	ctx.lineTo(x + 28, y - 8);
	ctx.lineTo(x + w / 2, y + 18);
	ctx.lineTo(x + w - 28, y - 8);
	ctx.lineTo(x + w - 8, y + 18);
	ctx.fill();
}
var SAVE_KEY = "ash-forge-v1";
var STEP = 1 / 60;
function loadSave() {
	const fallback = {
		version: 1,
		bestMs: null,
		shake: true,
		muted: false
	};
	try {
		const raw = localStorage.getItem(SAVE_KEY);
		if (!raw) {
			const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
			return {
				...fallback,
				shake: !reduce
			};
		}
		const parsed = JSON.parse(raw);
		return {
			version: 1,
			bestMs: typeof parsed.bestMs === "number" ? parsed.bestMs : null,
			shake: parsed.shake !== false,
			muted: parsed.muted === true
		};
	} catch {
		return fallback;
	}
}
function writeSave(save) {
	localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}
function formatTime(ms) {
	const s = Math.max(0, ms) / 1e3;
	const m = Math.floor(s / 60);
	return `${m}:${(s - m * 60).toFixed(2).padStart(5, "0")}`;
}
var PHASE = [
	"",
	"KINDLE",
	"CINDER",
	"WHITE ASH"
];
function ForgeGame() {
	const canvasRef = (0, import_react.useRef)(null);
	const stageRef = (0, import_react.useRef)(null);
	const hpRef = (0, import_react.useRef)(null);
	const heatRef = (0, import_react.useRef)(null);
	const bossRef = (0, import_react.useRef)(null);
	const timeRef = (0, import_react.useRef)(null);
	const phaseRef = (0, import_react.useRef)(null);
	const dashRef = (0, import_react.useRef)(null);
	const coreRef = (0, import_react.useRef)(null);
	const coreLabelRef = (0, import_react.useRef)(null);
	const fuseRef = (0, import_react.useRef)(null);
	const shakeRef = (0, import_react.useRef)(true);
	const simRef = (0, import_react.useRef)(null);
	const inputRef = (0, import_react.useRef)(null);
	const audioRef = (0, import_react.useRef)(null);
	const [mode, setMode] = (0, import_react.useState)("title");
	const [bestMs, setBestMs] = (0, import_react.useState)(null);
	const [shake, setShake] = (0, import_react.useState)(true);
	const [muted, setMuted] = (0, import_react.useState)(false);
	const [clearMs, setClearMs] = (0, import_react.useState)(0);
	const [hits, setHits] = (0, import_react.useState)({
		landed: 0,
		taken: 0
	});
	const [mounted, setMounted] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setMounted(true);
		const save = loadSave();
		shakeRef.current = save.shake;
		setBestMs(save.bestMs);
		setShake(save.shake);
		setMuted(save.muted);
		const sim = new GameSim();
		const input = new Input();
		const audio = new AudioEngine();
		const renderer = new WorldRenderer();
		const art = loadArt();
		simRef.current = sim;
		inputRef.current = input;
		audioRef.current = audio;
		audio.setMuted(save.muted);
		const canvas = canvasRef.current;
		const stage = stageRef.current;
		if (!canvas || !stage) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		let raf = 0;
		let last = performance.now();
		let acc = 0;
		let seenMode = "title";
		const fit = () => {
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			const w = Math.max(1, stage.clientWidth);
			const h = Math.max(1, stage.clientHeight);
			const bw = Math.floor(w * dpr);
			const bh = Math.floor(h * dpr);
			if (canvas.width !== bw || canvas.height !== bh) {
				canvas.width = bw;
				canvas.height = bh;
			}
		};
		fit();
		const resize = new ResizeObserver(fit);
		resize.observe(stage);
		const onVis = () => audio.resume();
		document.addEventListener("visibilitychange", onVis);
		const loop = (now) => {
			const dt = Math.min(.05, (now - last) / 1e3);
			last = now;
			acc += dt;
			let guard = 0;
			while (acc >= STEP && guard < 5) {
				sim.step(STEP, input.sample());
				acc -= STEP;
				guard += 1;
			}
			if (acc > STEP * 2) acc = 0;
			const events = sim.pullEvents();
			for (const e of events) if (e.t === "sfx") audio.play(e.name);
			else if (e.t === "hitstop") sim.hitstop = Math.max(sim.hitstop, e.n);
			const shakeOn = shakeRef.current;
			renderer.apply(events, shakeOn);
			renderer.update(dt);
			audio.intensity = sim.mode === "playing" ? sim.boss.phase : 0;
			audio.tick();
			fit();
			renderer.draw(ctx, sim, art, shakeOn);
			paintHud(sim);
			if (new URLSearchParams(location.search).has("qa")) window.__controlsTest = {
				getYaw: () => 0,
				getSpeed: () => sim.player.vx,
				getX: () => sim.player.x,
				getFacing: () => sim.player.facing,
				setKeys: (codes) => input.setKeys(codes)
			};
			if (sim.mode !== seenMode) {
				seenMode = sim.mode;
				setMode(sim.mode);
				if (sim.mode === "won") {
					setClearMs(sim.clearMs);
					setHits({
						landed: sim.hitsLanded,
						taken: sim.hitsTaken
					});
					setBestMs((prev) => {
						const next = prev == null ? sim.clearMs : Math.min(prev, sim.clearMs);
						writeSave({
							...loadSave(),
							bestMs: next,
							shake: shakeOn,
							muted: audio.muted
						});
						return next;
					});
				}
				if (sim.mode === "dead") setHits({
					landed: sim.hitsLanded,
					taken: sim.hitsTaken
				});
				if (sim.mode === "playing" && !audio.muted) audio.startMusic();
			}
			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => {
			cancelAnimationFrame(raf);
			resize.disconnect();
			input.destroy();
			document.removeEventListener("visibilitychange", onVis);
			delete window.__controlsTest;
		};
		function paintHud(current) {
			const hp = Math.max(0, current.player.hp / current.player.maxHp);
			const heat = current.player.heat / 100;
			const boss = Math.max(0, current.boss.hp / current.boss.maxHp);
			if (hpRef.current) hpRef.current.style.transform = `scaleX(${hp})`;
			if (heatRef.current) {
				heatRef.current.style.transform = `scaleX(${heat})`;
				heatRef.current.parentElement?.classList.toggle("ready", current.player.latched);
			}
			if (bossRef.current) bossRef.current.style.width = `${boss * 100}%`;
			if (timeRef.current) timeRef.current.textContent = formatTime(current.time * 1e3);
			if (phaseRef.current) phaseRef.current.textContent = `PHASE ${current.boss.phase}  ·  ${PHASE[current.boss.phase]}`;
			if (dashRef.current) {
				const ready = 1 - Math.min(1, current.player.dashCd / .58);
				dashRef.current.style.transform = `scaleX(${ready})`;
			}
			if (coreRef.current) coreRef.current.classList.toggle("is-ready", current.player.latched);
			if (coreLabelRef.current) coreLabelRef.current.textContent = current.player.latched ? "DUMP" : "CORE";
			if (fuseRef.current) fuseRef.current.textContent = current.player.latched ? `DUMP ${Math.max(0, OVERHEAT_TIME - current.player.heatHold).toFixed(1)}` : "";
		}
	}, []);
	const playing = mode === "playing" || mode === "paused";
	function unlock() {
		audioRef.current?.unlock();
	}
	function begin() {
		unlock();
		audioRef.current?.startMusic();
		simRef.current?.start();
	}
	function toggleShake() {
		setShake((prev) => {
			const next = !prev;
			const save = loadSave();
			writeSave({
				...save,
				shake: next,
				muted: audioRef.current?.muted ?? save.muted
			});
			return next;
		});
	}
	function toggleMute() {
		setMuted((prev) => {
			const next = !prev;
			audioRef.current?.setMuted(next);
			if (!next) audioRef.current?.startMusic();
			writeSave({
				...loadSave(),
				muted: next
			});
			return next;
		});
	}
	function bindTouch(key) {
		return {
			onPointerDown: (e) => {
				e.preventDefault();
				e.currentTarget.setPointerCapture(e.pointerId);
				unlock();
				inputRef.current?.setTouch(key, true);
			},
			onPointerUp: (e) => {
				inputRef.current?.setTouch(key, false);
				e.currentTarget.blur();
			},
			onPointerCancel: () => inputRef.current?.setTouch(key, false)
		};
	}
	(0, import_react.useEffect)(() => {
		shakeRef.current = shake;
	}, [shake]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "shell",
		onPointerDown: unlock,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "stage",
			ref: stageRef,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
					ref: canvasRef,
					"aria-label": "Ash Queen's Forge"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "hud",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: playing ? "flex gap-4" : "invisible",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mb-1 text-xs text-cyan",
										children: "SYS.INTEGRITY"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "bar",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											ref: hpRef,
											className: "origin-left"
										})
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mb-1 text-xs text-ember",
											children: "CORE.HEAT"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "bar ember",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												ref: heatRef,
												className: "origin-left"
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											ref: fuseRef,
											className: "mt-1 h-4 text-xs text-ember"
										})
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "hidden sm:block",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mb-1 text-xs text-muted",
											children: "DASH"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "bar",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												ref: dashRef,
												className: "origin-left"
											})
										})]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs tracking-widest text-ember",
									children: "SLICK JACKET"
								}), playing && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "btn ghost pointer-events-auto px-3 py-1",
									"aria-label": "Pause",
									onClick: (e) => {
										e.currentTarget.blur();
										if (simRef.current && simRef.current.mode === "playing") simRef.current.mode = "paused";
										else if (simRef.current?.mode === "paused") simRef.current.mode = "playing";
									},
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "h-4 w-4" })
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-col items-center gap-1",
							children: playing && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									ref: phaseRef,
									className: "text-xs tracking-widest text-ash",
									children: "PHASE 1 · KINDLE"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-fg",
									children: "THE ASH QUEEN"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "bar ash w-48 sm:w-72",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { ref: bossRef })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									ref: timeRef,
									className: "text-xs text-muted",
									children: "0:00.00"
								})
							] })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {})
					]
				}),
				mode === "title" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overlay",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "panel",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs tracking-widest text-ember",
								children: "SLICK JACKET — WEIRD BY DESIGN"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-display text-4xl font-semibold tracking-wide text-cyan sm:text-5xl",
								children: "SYSTEM BREACH"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-lg tracking-widest text-ash",
								children: "THE ASH QUEEN'S FORGE"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "max-w-md text-sm text-muted",
								children: "Slash her core. Dash through fire to throw it back. When the heat latches, dump it before it cooks you."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "btn",
								onClick: begin,
								children: "Initiate breach"
							}),
							mounted && bestMs != null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted",
								children: ["Best breach ", formatTime(bestMs)]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
								className: "grid w-full gap-1 text-left text-xs text-muted sm:grid-cols-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Move — A D or arrows" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Jump — W or Space. Hold for height." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Dash — Shift. Invincible, reflects fire." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Slash — J or X. Three hits build heat." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Core dump — C or K when the bar latches." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Drop — Down plus jump. Pause — Esc." })
								]
							})
						]
					})
				}),
				mode === "paused" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, {
					title: "HOLD",
					detail: "The forge is waiting.",
					primary: "Resume",
					onPrimary: () => {
						if (simRef.current) simRef.current.mode = "playing";
					},
					shake,
					muted,
					onShake: toggleShake,
					onMute: toggleMute,
					onTitle: () => simRef.current?.showTitle()
				}),
				mode === "dead" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, {
					title: "CRITICAL FAILURE",
					detail: `Hits landed ${hits.landed}. Hits taken ${hits.taken}.`,
					primary: "Reboot",
					onPrimary: begin,
					shake,
					muted,
					onShake: toggleShake,
					onMute: toggleMute,
					tone: "ash"
				}),
				mode === "won" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, {
					title: "BREACH SUCCESSFUL",
					detail: `Cleared in ${formatTime(clearMs)}. Hits landed ${hits.landed}. Hits taken ${hits.taken}.`,
					primary: "Breach again",
					onPrimary: begin,
					shake,
					muted,
					onShake: toggleShake,
					onMute: toggleMute,
					extra: mounted && bestMs != null ? `Best ${formatTime(bestMs)}` : void 0
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: playing ? "dock is-on" : "dock",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "dock-group",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "touch",
					"aria-label": "Move left",
					...bindTouch("left"),
					children: "Left"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "touch",
					"aria-label": "Move right",
					...bindTouch("right"),
					children: "Right"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "dock-group",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "touch",
						"aria-label": "Dash",
						...bindTouch("dash"),
						children: "Dash"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "touch",
						"aria-label": "Jump",
						...bindTouch("jump"),
						children: "Jump"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "touch ash",
						"aria-label": "Attack",
						...bindTouch("attack"),
						children: "Atk"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "touch ember",
						"aria-label": "Core dump",
						ref: coreRef,
						...bindTouch("special"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							ref: coreLabelRef,
							children: "Core"
						})
					})
				]
			})]
		})]
	});
}
function Menu({ title, detail, primary, onPrimary, shake, muted, onShake, onMute, onTitle, extra, tone = "cyan" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overlay",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "panel",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: `font-display text-3xl font-semibold sm:text-4xl ${tone === "ash" ? "text-ash" : "text-cyan"}`,
					children: title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: detail
				}),
				extra && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-ember",
					children: extra
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: tone === "ash" ? "btn ash" : "btn",
					onClick: onPrimary,
					children: primary
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap justify-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "btn ghost",
							onClick: onShake,
							children: ["Shake ", shake ? "on" : "off"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "btn ghost",
							onClick: onMute,
							"aria-label": muted ? "Unmute" : "Mute",
							children: [muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "h-4 w-4" }), muted ? "Sound off" : "Sound on"]
						}),
						onTitle && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn ghost",
							onClick: onTitle,
							children: "Retreat"
						})
					]
				})
			]
		})
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ForgeGame, {});
}
//#endregion
export { Home as component };
