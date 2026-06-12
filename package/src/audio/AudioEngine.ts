/**
 * GLYPHWARS audio: 100% synthesized with the Web Audio API — zero asset
 * files. SFX are short envelope-shaped oscillator/noise bursts; the
 * soundtrack is a generative synthwave pad + arpeggio whose layers fade in
 * with danger ("intensity"), so the music escalates as the screen fills.
 */

const NOTE = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);

// Am – F – C – G progression, low register. [root, third, fifth] as MIDI.
const CHORDS: number[][] = [
  [45, 48, 52],
  [41, 45, 48],
  [48, 52, 55],
  [43, 47, 50],
];
// A-minor pentatonic for the arp layer
const ARP_SCALE = [57, 60, 62, 64, 67, 69, 72, 76];

class AudioEngineImpl {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfx!: GainNode;
  private music!: GainNode;
  private padGain!: GainNode;
  private arpGain!: GainNode;
  private bassGain!: GainNode;
  private noiseBuffer!: AudioBuffer;

  private musicTimer: number | null = null;
  private nextChordTime = 0;
  private nextArpTime = 0;
  private chordIndex = 0;
  private intensity = 0;

  private volumes = { master: 0.8, sfx: 0.9, music: 0.55 };

  /** Must be called from a user gesture (browsers block audio before that). */
  init(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.connect(ctx.destination);
    this.sfx = ctx.createGain();
    this.sfx.connect(this.master);
    this.music = ctx.createGain();
    this.music.connect(this.master);

    this.padGain = ctx.createGain();
    this.padGain.connect(this.music);
    this.arpGain = ctx.createGain();
    this.arpGain.gain.value = 0;
    this.arpGain.connect(this.music);
    this.bassGain = ctx.createGain();
    this.bassGain.gain.value = 0;
    this.bassGain.connect(this.music);

    // 1s of white noise, reused by every impact/explosion
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buf;

    this.applyVolumes();
  }

  setVolumes(master: number, sfx: number, music: number): void {
    this.volumes = { master, sfx, music };
    if (this.ctx) this.applyVolumes();
  }

  private applyVolumes(): void {
    const t = this.ctx!.currentTime;
    this.master.gain.setTargetAtTime(this.volumes.master, t, 0.05);
    this.sfx.gain.setTargetAtTime(this.volumes.sfx, t, 0.05);
    this.music.gain.setTargetAtTime(this.volumes.music * 0.5, t, 0.05);
  }

  /* ── SFX ──────────────────────────────────────────────────────────── */

  private env(peak: number, attack: number, decay: number): GainNode {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0001), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    g.connect(this.sfx);
    return g;
  }

  private noise(peak: number, decay: number, filterFreq: number, type: BiquadFilterType = 'bandpass'): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = filterFreq;
    const g = this.env(peak, 0.002, decay);
    src.connect(f).connect(g);
    src.start();
    src.stop(ctx.currentTime + decay + 0.05);
  }

  /** Laser fire — pitch rises slightly with combo so streaks *sound* hot. */
  laser(combo = 0): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'square';
    const base = 760 + Math.min(combo, 30) * 14 + Math.random() * 40;
    o.frequency.setValueAtTime(base, t);
    o.frequency.exponentialRampToValueAtTime(base * 0.24, t + 0.09);
    const g = this.env(0.16, 0.003, 0.1);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.13);
    // Mechanical key "thock" layered underneath
    this.noise(0.12, 0.03, 2600, 'highpass');
  }

  impact(): void {
    this.noise(0.18, 0.06, 1800);
  }

  explosion(scale = 1): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    this.noise(0.35 * scale, 0.32 * scale, 420, 'lowpass');
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(36, t + 0.35);
    const g = this.env(0.4 * scale, 0.004, 0.38);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.45);
  }

  error(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(130, t);
    o.frequency.linearRampToValueAtTime(90, t + 0.14);
    const g = this.env(0.16, 0.004, 0.16);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.2);
  }

  powerup(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    [0, 0.07, 0.14].forEach((d, i) => {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = NOTE(76 + i * 5);
      const t = ctx.currentTime + d;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      g.connect(this.sfx);
      o.connect(g);
      o.start(t);
      o.stop(t + 0.25);
    });
  }

  hullHit(): void {
    this.noise(0.4, 0.25, 240, 'lowpass');
    this.error();
  }

  uiMove(): void {
    this.noise(0.07, 0.02, 3200, 'highpass');
  }

  uiSelect(): void {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = NOTE(81);
    const g = this.env(0.12, 0.005, 0.12);
    o.connect(g);
    o.start();
    o.stop(this.ctx.currentTime + 0.15);
  }

  bossAlarm(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    for (let i = 0; i < 3; i++) {
      const t = ctx.currentTime + i * 0.3;
      const o = ctx.createOscillator();
      o.type = 'square';
      o.frequency.value = i % 2 ? 220 : 196;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.1, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
      g.connect(this.sfx);
      o.connect(g);
      o.start(t);
      o.stop(t + 0.28);
    }
  }

  /* ── Generative soundtrack ────────────────────────────────────────── */

  startMusic(): void {
    if (!this.ctx || this.musicTimer !== null) return;
    this.nextChordTime = this.ctx.currentTime + 0.1;
    this.nextArpTime = this.ctx.currentTime + 0.1;
    this.chordIndex = 0;
    // Lookahead scheduler: wake every 100ms, schedule 600ms ahead.
    this.musicTimer = window.setInterval(() => this.scheduleMusic(), 100);
  }

  stopMusic(): void {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  /** 0 = calm drift, 1 = screen full of hostiles. Fades music layers. */
  setIntensity(value: number): void {
    this.intensity = Math.max(0, Math.min(1, value));
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.arpGain.gain.setTargetAtTime(this.intensity * 0.5, t, 0.8);
    this.bassGain.gain.setTargetAtTime(Math.max(0, this.intensity - 0.25) * 0.7, t, 0.8);
    this.padGain.gain.setTargetAtTime(0.5 + this.intensity * 0.2, t, 1.2);
  }

  private scheduleMusic(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const ahead = ctx.currentTime + 0.6;
    const CHORD_LEN = 3.2;
    const ARP_STEP = 0.2;

    while (this.nextChordTime < ahead) {
      this.playChord(CHORDS[this.chordIndex % CHORDS.length], this.nextChordTime, CHORD_LEN);
      this.chordIndex++;
      this.nextChordTime += CHORD_LEN;
    }
    while (this.nextArpTime < ahead) {
      if (Math.random() < 0.7) {
        const chord = CHORDS[Math.max(0, this.chordIndex - 1) % CHORDS.length];
        const pick =
          Math.random() < 0.5
            ? chord[Math.floor(Math.random() * 3)] + 24
            : ARP_SCALE[Math.floor(Math.random() * ARP_SCALE.length)];
        this.pluck(pick, this.nextArpTime);
      }
      this.nextArpTime += ARP_STEP;
    }
  }

  private playChord(midis: number[], when: number, len: number): void {
    const ctx = this.ctx!;
    for (const m of midis) {
      for (const detune of [-6, 6]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = NOTE(m);
        o.detune.value = detune;
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = 520;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, when);
        g.gain.linearRampToValueAtTime(0.05, when + len * 0.35);
        g.gain.linearRampToValueAtTime(0.0001, when + len * 1.05);
        o.connect(f).connect(g).connect(this.padGain);
        o.start(when);
        o.stop(when + len * 1.1);
      }
      // Pulsing sub-bass an octave down (gain controlled by intensity)
      const b = ctx.createOscillator();
      b.type = 'sine';
      b.frequency.value = NOTE(midis[0] - 12);
      const bg = ctx.createGain();
      bg.gain.setValueAtTime(0.0001, when);
      bg.gain.linearRampToValueAtTime(0.12, when + 0.05);
      bg.gain.linearRampToValueAtTime(0.0001, when + len);
      b.connect(bg).connect(this.bassGain);
      b.start(when);
      b.stop(when + len);
    }
  }

  private pluck(midi: number, when: number): void {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = NOTE(midi);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.09, when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.28);
    o.connect(g).connect(this.arpGain);
    o.start(when);
    o.stop(when + 0.32);
  }
}

/** Singleton — the whole app shares one AudioContext. */
export const Audio = new AudioEngineImpl();
