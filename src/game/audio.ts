export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  private sfx: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private next = 0;
  private step = 0;
  private wantMusic = false;
  muted = false;
  intensity = 0;

  unlock() {
    if (!this.ctx) {
      this.ctx = new AudioContext({ latencyHint: "interactive" });
      this.master = this.ctx.createGain();
      this.music = this.ctx.createGain();
      this.sfx = this.ctx.createGain();
      this.music.gain.value = 0.16;
      this.sfx.gain.value = 0.85;
      this.master.gain.value = this.muted ? 0 : 0.9;
      this.music.connect(this.master);
      this.sfx.connect(this.master);
      this.master.connect(this.ctx.destination);
      const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.4), this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this.noise = buffer;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (!this.ctx || !this.master) return;
    this.master.gain.setTargetAtTime(muted ? 0 : 0.9, this.ctx.currentTime, 0.03);
  }

  startMusic() {
    this.wantMusic = true;
    this.unlock();
    if (this.ctx) this.next = this.ctx.currentTime + 0.05;
  }

  tick() {
    if (!this.ctx || !this.music || !this.wantMusic) return;
    const beat = 60 / (90 + this.intensity * 16) / 2;
    if (this.next < this.ctx.currentTime) this.next = this.ctx.currentTime + 0.02;
    while (this.next < this.ctx.currentTime + 0.22) {
      this.blip(this.next);
      this.next += beat;
      this.step++;
    }
  }

  play(name: string) {
    this.unlock();
    if (!this.ctx || !this.sfx) return;
    const now = this.ctx.currentTime;
    const rate = 1 + (Math.random() - 0.5) * 0.08;
    switch (name) {
      case "jump":
        this.tone(340 * rate, "square", 0.12, 0.05, now, false);
        break;
      case "dash":
        this.noiseBurst(0.09, 0.08, now);
        this.tone(620 * rate, "sawtooth", 0.08, 0.04, now, false);
        break;
      case "slash":
        this.tone(180 * rate, "triangle", 0.1, 0.07, now, false);
        this.tone(420 * rate, "square", 0.06, 0.03, now, false);
        break;
      case "hit":
        this.tone(110 * rate, "sawtooth", 0.12, 0.08, now, false);
        break;
      case "hurt":
        this.tone(90, "square", 0.18, 0.09, now, false);
        this.noiseBurst(0.12, 0.06, now);
        break;
      case "roar":
        this.tone(70, "sawtooth", 0.45, 0.12, now, false);
        this.tone(48, "square", 0.4, 0.08, now + 0.12, false);
        break;
      case "boom":
        this.tone(60, "sawtooth", 0.4, 0.16, now, false);
        this.noiseBurst(0.3, 0.12, now);
        break;
      case "core":
        this.tone(220, "sawtooth", 0.22, 0.08, now, false);
        this.tone(660, "square", 0.18, 0.05, now + 0.05, false);
        break;
      case "land":
        this.noiseBurst(0.05, 0.04, now);
        break;
      case "reflect":
        this.tone(520 * rate, "square", 0.1, 0.05, now, false);
        break;
      case "win":
        this.tone(440, "square", 0.18, 0.06, now, false);
        this.tone(554, "square", 0.2, 0.06, now + 0.12, false);
        this.tone(659, "triangle", 0.35, 0.07, now + 0.24, false);
        break;
      case "lose":
        this.tone(160, "sawtooth", 0.35, 0.08, now, false);
        this.tone(90, "square", 0.4, 0.07, now + 0.16, false);
        break;
      default:
        break;
    }
  }

  private blip(when: number) {
    const bass = [110, 110, 130.81, 98, 110, 146.83, 130.81, 87.31];
    const arp = [220, 261.63, 329.63, 392, 329.63, 261.63, 196, 246.94];
    if (this.step % 2 === 0) {
      this.tone(bass[(this.step / 2) % bass.length]!, "sawtooth", 0.16, 0.035, when, true);
    }
    if (this.intensity > 0) {
      this.tone(arp[this.step % arp.length]!, "triangle", 0.07, 0.02, when, true);
    }
  }

  private tone(
    freq: number,
    type: OscillatorType,
    duration: number,
    vol: number,
    when: number,
    musical: boolean,
  ) {
    if (!this.ctx || !this.sfx || !this.music) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    gain.gain.setValueAtTime(vol, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(gain);
    gain.connect(musical ? this.music : this.sfx);
    osc.start(when);
    osc.stop(when + duration + 0.02);
  }

  private noiseBurst(duration: number, vol: number, when: number) {
    if (!this.ctx || !this.sfx || !this.noise) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 400;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, when);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfx);
    src.start(when);
    src.stop(when + duration + 0.02);
  }
}
