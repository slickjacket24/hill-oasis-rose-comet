import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Pause, Volume2, VolumeX } from "lucide-react";
import { loadArt, type Art } from "@/game/assets";
import { AudioEngine } from "@/game/audio";
import { Input } from "@/game/input";
import { WorldRenderer } from "@/game/render";
import { GameSim, OVERHEAT_TIME, type Mode } from "@/game/sim";

const SAVE_KEY = "ash-forge-v1";
const STEP = 1 / 60;

type Save = { version: 1; bestMs: number | null; shake: boolean; muted: boolean };

function loadSave(): Save {
  const fallback: Save = { version: 1, bestMs: null, shake: true, muted: false };
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      return { ...fallback, shake: !reduce };
    }
    const parsed = JSON.parse(raw) as Partial<Save>;
    return {
      version: 1,
      bestMs: typeof parsed.bestMs === "number" ? parsed.bestMs : null,
      shake: parsed.shake !== false,
      muted: parsed.muted === true,
    };
  } catch {
    return fallback;
  }
}

function writeSave(save: Save) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

export function formatTime(ms: number) {
  const s = Math.max(0, ms) / 1000;
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return `${m}:${r.toFixed(2).padStart(5, "0")}`;
}

const PHASE = ["", "KINDLE", "CINDER", "WHITE ASH"];

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      getX: () => number;
      getFacing: () => number;
      setKeys?: (codes: string[]) => void;
    };
  }
}

export function ForgeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const hpRef = useRef<HTMLSpanElement>(null);
  const heatRef = useRef<HTMLSpanElement>(null);
  const bossRef = useRef<HTMLSpanElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<HTMLDivElement>(null);
  const dashRef = useRef<HTMLSpanElement>(null);
  const coreRef = useRef<HTMLButtonElement>(null);
  const coreLabelRef = useRef<HTMLSpanElement>(null);
  const fuseRef = useRef<HTMLDivElement>(null);
  const shakeRef = useRef(true);
  const simRef = useRef<GameSim | null>(null);
  const inputRef = useRef<Input | null>(null);
  const audioRef = useRef<AudioEngine | null>(null);

  const [mode, setMode] = useState<Mode>("title");
  const [bestMs, setBestMs] = useState<number | null>(null);
  const [shake, setShake] = useState(true);
  const [muted, setMuted] = useState(false);
  const [clearMs, setClearMs] = useState(0);
  const [hits, setHits] = useState({ landed: 0, taken: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
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
    const art: Art = loadArt();
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
    let seenMode: Mode = "title";

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

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
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
      for (const e of events) {
        if (e.t === "sfx") audio.play(e.name);
        else if (e.t === "hitstop") sim.hitstop = Math.max(sim.hitstop, e.n);
      }
      const shakeOn = shakeRef.current;
      renderer.apply(events, shakeOn);
      renderer.update(dt);
      audio.intensity = sim.mode === "playing" ? sim.boss.phase : 0;
      audio.tick();
      fit();
      renderer.draw(ctx, sim, art, shakeOn);
      paintHud(sim);

      if (import.meta.env.DEV || new URLSearchParams(location.search).has("qa")) {
        window.__controlsTest = {
          getYaw: () => 0,
          getSpeed: () => sim.player.vx,
          getX: () => sim.player.x,
          getFacing: () => sim.player.facing,
          setKeys: (codes) => input.setKeys(codes),
        };
      }

      if (sim.mode !== seenMode) {
        seenMode = sim.mode;
        setMode(sim.mode);
        if (sim.mode === "won") {
          setClearMs(sim.clearMs);
          setHits({ landed: sim.hitsLanded, taken: sim.hitsTaken });
          setBestMs((prev) => {
            const next = prev == null ? sim.clearMs : Math.min(prev, sim.clearMs);
            const current = loadSave();
            writeSave({ ...current, bestMs: next, shake: shakeOn, muted: audio.muted });
            return next;
          });
        }
        if (sim.mode === "dead") {
          setHits({ landed: sim.hitsLanded, taken: sim.hitsTaken });
        }
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

    function paintHud(current: GameSim) {
      const hp = Math.max(0, current.player.hp / current.player.maxHp);
      const heat = current.player.heat / 100;
      const boss = Math.max(0, current.boss.hp / current.boss.maxHp);
      if (hpRef.current) hpRef.current.style.transform = `scaleX(${hp})`;
      if (heatRef.current) {
        heatRef.current.style.transform = `scaleX(${heat})`;
        heatRef.current.parentElement?.classList.toggle("ready", current.player.latched);
      }
      if (bossRef.current) bossRef.current.style.width = `${boss * 100}%`;
      if (timeRef.current) timeRef.current.textContent = formatTime(current.time * 1000);
      if (phaseRef.current) {
        phaseRef.current.textContent = `PHASE ${current.boss.phase}  ·  ${PHASE[current.boss.phase]}`;
      }
      if (dashRef.current) {
        const ready = 1 - Math.min(1, current.player.dashCd / 0.58);
        dashRef.current.style.transform = `scaleX(${ready})`;
      }
      if (coreRef.current) coreRef.current.classList.toggle("is-ready", current.player.latched);
      if (coreLabelRef.current) {
        coreLabelRef.current.textContent = current.player.latched ? "DUMP" : "CORE";
      }
      if (fuseRef.current) {
        fuseRef.current.textContent = current.player.latched
          ? `DUMP ${Math.max(0, OVERHEAT_TIME - current.player.heatHold).toFixed(1)}`
          : "";
      }
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
      writeSave({ ...save, shake: next, muted: audioRef.current?.muted ?? save.muted });
      return next;
    });
  }

  function toggleMute() {
    setMuted((prev) => {
      const next = !prev;
      audioRef.current?.setMuted(next);
      if (!next) audioRef.current?.startMusic();
      const save = loadSave();
      writeSave({ ...save, muted: next });
      return next;
    });
  }

  function bindTouch(key: "left" | "right" | "jump" | "dash" | "attack" | "special") {
    return {
      onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        unlock();
        inputRef.current?.setTouch(key, true);
      },
      onPointerUp: (e: ReactPointerEvent<HTMLButtonElement>) => {
        inputRef.current?.setTouch(key, false);
        e.currentTarget.blur();
      },
      onPointerCancel: () => inputRef.current?.setTouch(key, false),
    };
  }

  useEffect(() => {
    shakeRef.current = shake;
  }, [shake]);

  return (
    <div className="shell" onPointerDown={unlock}>
      <div className="stage" ref={stageRef}>
        <canvas ref={canvasRef} aria-label="Ash Queen's Forge" />
        <div className="hud">
          <div className="flex items-start justify-between gap-3">
            <div className={playing ? "flex gap-4" : "invisible"}>
              <div>
                <div className="mb-1 text-xs text-cyan">SYS.INTEGRITY</div>
                <div className="bar">
                  <span ref={hpRef} className="origin-left" />
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs text-ember">CORE.HEAT</div>
                <div className="bar ember">
                  <span ref={heatRef} className="origin-left" />
                </div>
                <div ref={fuseRef} className="mt-1 h-4 text-xs text-ember" />
              </div>
              <div className="hidden sm:block">
                <div className="mb-1 text-xs text-muted">DASH</div>
                <div className="bar">
                  <span ref={dashRef} className="origin-left" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs tracking-widest text-ember">SLICK JACKET</span>
              {playing && (
                <button
                  type="button"
                  className="btn ghost pointer-events-auto px-3 py-1"
                  aria-label="Pause"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    if (simRef.current && simRef.current.mode === "playing") simRef.current.mode = "paused";
                    else if (simRef.current?.mode === "paused") simRef.current.mode = "playing";
                  }}
                >
                  <Pause className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            {playing && (
              <>
                <div ref={phaseRef} className="text-xs tracking-widest text-ash">
                  PHASE 1 · KINDLE
                </div>
                <div className="text-xs text-fg">THE ASH QUEEN</div>
                <div className="bar ash w-48 sm:w-72">
                  <span ref={bossRef} />
                </div>
                <div ref={timeRef} className="text-xs text-muted">
                  0:00.00
                </div>
              </>
            )}
          </div>
          <div />
        </div>

        {mode === "title" && (
          <div className="overlay">
            <div className="panel">
              <p className="text-xs tracking-widest text-ember">SLICK JACKET — WEIRD BY DESIGN</p>
              <h1 className="font-display text-4xl font-semibold tracking-wide text-cyan sm:text-5xl">
                SYSTEM BREACH
              </h1>
              <p className="font-display text-lg tracking-widest text-ash">THE ASH QUEEN'S FORGE</p>
              <p className="max-w-md text-sm text-muted">
                Slash her core. Dash through fire to throw it back. When the heat latches, dump it before it cooks you.
              </p>
              <button type="button" className="btn" onClick={begin}>
                Initiate breach
              </button>
              {mounted && bestMs != null && (
                <p className="text-xs text-muted">Best breach {formatTime(bestMs)}</p>
              )}
              <ul className="grid w-full gap-1 text-left text-xs text-muted sm:grid-cols-2">
                <li>Move — A D or arrows</li>
                <li>Jump — W or Space. Hold for height.</li>
                <li>Dash — Shift. Invincible, reflects fire.</li>
                <li>Slash — J or X. Three hits build heat.</li>
                <li>Core dump — C or K when the bar latches.</li>
                <li>Drop — Down plus jump. Pause — Esc.</li>
              </ul>
            </div>
          </div>
        )}

        {mode === "paused" && (
          <Menu
            title="HOLD"
            detail="The forge is waiting."
            primary="Resume"
            onPrimary={() => {
              if (simRef.current) simRef.current.mode = "playing";
            }}
            shake={shake}
            muted={muted}
            onShake={toggleShake}
            onMute={toggleMute}
            onTitle={() => simRef.current?.showTitle()}
          />
        )}

        {mode === "dead" && (
          <Menu
            title="CRITICAL FAILURE"
            detail={`Hits landed ${hits.landed}. Hits taken ${hits.taken}.`}
            primary="Reboot"
            onPrimary={begin}
            shake={shake}
            muted={muted}
            onShake={toggleShake}
            onMute={toggleMute}
            tone="ash"
          />
        )}

        {mode === "won" && (
          <Menu
            title="BREACH SUCCESSFUL"
            detail={`Cleared in ${formatTime(clearMs)}. Hits landed ${hits.landed}. Hits taken ${hits.taken}.`}
            primary="Breach again"
            onPrimary={begin}
            shake={shake}
            muted={muted}
            onShake={toggleShake}
            onMute={toggleMute}
            extra={mounted && bestMs != null ? `Best ${formatTime(bestMs)}` : undefined}
          />
        )}
      </div>

      <div className={playing ? "dock is-on" : "dock"}>
        <div className="dock-group">
          <button type="button" className="touch" aria-label="Move left" {...bindTouch("left")}>
            Left
          </button>
          <button type="button" className="touch" aria-label="Move right" {...bindTouch("right")}>
            Right
          </button>
        </div>
        <div className="dock-group">
          <button type="button" className="touch" aria-label="Dash" {...bindTouch("dash")}>
            Dash
          </button>
          <button type="button" className="touch" aria-label="Jump" {...bindTouch("jump")}>
            Jump
          </button>
          <button type="button" className="touch ash" aria-label="Attack" {...bindTouch("attack")}>
            Atk
          </button>
          <button type="button" className="touch ember" aria-label="Core dump" ref={coreRef} {...bindTouch("special")}>
            <span ref={coreLabelRef}>Core</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Menu({
  title,
  detail,
  primary,
  onPrimary,
  shake,
  muted,
  onShake,
  onMute,
  onTitle,
  extra,
  tone = "cyan",
}: {
  title: string;
  detail: string;
  primary: string;
  onPrimary: () => void;
  shake: boolean;
  muted: boolean;
  onShake: () => void;
  onMute: () => void;
  onTitle?: () => void;
  extra?: string;
  tone?: "cyan" | "ash";
}) {
  return (
    <div className="overlay">
      <div className="panel">
        <h2 className={`font-display text-3xl font-semibold sm:text-4xl ${tone === "ash" ? "text-ash" : "text-cyan"}`}>
          {title}
        </h2>
        <p className="text-sm text-muted">{detail}</p>
        {extra && <p className="text-xs text-ember">{extra}</p>}
        <button type="button" className={tone === "ash" ? "btn ash" : "btn"} onClick={onPrimary}>
          {primary}
        </button>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" className="btn ghost" onClick={onShake}>
            Shake {shake ? "on" : "off"}
          </button>
          <button type="button" className="btn ghost" onClick={onMute} aria-label={muted ? "Unmute" : "Mute"}>
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            {muted ? "Sound off" : "Sound on"}
          </button>
          {onTitle && (
            <button type="button" className="btn ghost" onClick={onTitle}>
              Retreat
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
