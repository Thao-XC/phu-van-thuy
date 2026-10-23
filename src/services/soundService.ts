/**
 * Pure Web Audio sound for the temple: bells, the moon lute, chầu văn, fire and water
 * Generates zero-dependency procedural audio for bells, gongs, coins, water, and chants.
 */

class SoundService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private ambientGain: GainNode | null = null;
  private ambientInterval: number | null = null;
  private isAmbientRunning: boolean = false;

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ambientGain) {
      this.ambientGain.gain.setValueAtTime(muted ? 0 : 0.15, this.ctx?.currentTime || 0);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Shinto Suzu Bell: Brass hand-shaken bell with internal balls and resonant high shimmer
   */
  public playSuzuBell() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const frequencies = [1480, 2220, 2960, 3700, 4440];

    // Play 3 rapid shakes mimicking the rope pull
    [0, 0.12, 0.26].forEach((offset) => {
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq + (Math.random() * 40 - 20), now + offset);

        const volume = (0.15 / (idx + 1)) * (offset === 0.26 ? 1.4 : 0.8);
        gain.gain.setValueAtTime(volume, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 1.2 + idx * 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 1.6);
      });
    });
  }

  /**
   * Buddhist Bonshō Temple Gong: Deep, meditative bronze bell with rich harmonic resonance
   */
  /** Filtered noise burst — the building block for thunder, splashes and rumbles */
  private noise(dur: number, freq: number, q: number, vol: number, attack = 0.01, type: BiquadFilterType = 'lowpass') {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, now);
    f.Q.setValueAtTime(q, now);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(vol, now + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(f);
    f.connect(g);
    g.connect(ctx.destination);
    src.start(now);
  }

  /** Thunder: sharp crack, then a long rolling rumble */
  public playThunder() {
    this.noise(0.4, 2400, 0.7, 0.5, 0.005, 'highpass');
    setTimeout(() => this.noise(3.5, 180, 0.8, 0.7, 0.15), 120);
  }

  /** Deep underwater / stone rumble */
  public playRumble(seconds = 2.5) {
    this.noise(seconds, 90, 1.2, 0.6, 0.4);
  }

  /** Splash as you go into the water */
  public playSplash() {
    this.noise(0.9, 1200, 0.6, 0.45, 0.01, 'bandpass');
    this.noise(1.6, 400, 0.6, 0.25, 0.05);
  }

  /** a paddle dipping and pulling through the water */
  public playPaddle() {
    this.noise(0.5, 900, 0.8, 0.12, 0.04, 'bandpass');
    setTimeout(() => this.noise(0.7, 500, 0.7, 0.07, 0.1), 180);
  }

  /** Rooster crow: a rising-falling sawtooth with vibrato */
  public playRooster() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.25);
    osc.frequency.setValueAtTime(880, now + 0.7);
    osc.frequency.linearRampToValueAtTime(600, now + 1.2);
    lfo.frequency.setValueAtTime(28, now);
    lfoGain.gain.setValueAtTime(25, now);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(1400, now);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.12, now + 0.05);
    g.gain.setValueAtTime(0.12, now + 1.0);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);
    osc.connect(f);
    f.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    lfo.start(now);
    osc.stop(now + 1.35);
    lfo.stop(now + 1.35);
  }

  /** Two notes up for gaining luck, two down for losing it */
  public playLuck(up: boolean) {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    (up ? [784, 1175] : [392, 311]).forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = up ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      g.gain.setValueAtTime(0, now + i * 0.12);
      g.gain.linearRampToValueAtTime(0.12, now + i * 0.12 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.6);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.65);
    });
  }

  public playTempleGong() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Deep fundamental around 110Hz, with slight inharmonic partials
    const partials = [
      { freq: 108, gain: 0.5, decay: 6.0 },
      { freq: 216, gain: 0.35, decay: 4.5 },
      { freq: 328, gain: 0.22, decay: 3.5 },
      { freq: 442, gain: 0.15, decay: 2.8 },
      { freq: 654, gain: 0.08, decay: 1.8 },
      { freq: 880, gain: 0.04, decay: 1.2 }
    ];

    partials.forEach(({ freq, gain: vol, decay }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol * 0.7, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + decay);
    });
  }

  /**
   * Saisen Offering: Metallic coin flick and rattle against wooden slats
   */
  public playCoinToss() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Metallic ping of 5-yen brass coin
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(3200, now);
    osc.frequency.exponentialRampToValueAtTime(4500, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);

    // Wood clatters inside the box
    [0.15, 0.24, 0.31].forEach((delay) => {
      const woodOsc = ctx.createOscillator();
      const woodGain = ctx.createGain();
      woodOsc.type = 'triangle';
      woodOsc.frequency.setValueAtTime(320 + Math.random() * 80, now + delay);

      woodGain.gain.setValueAtTime(0.18, now + delay);
      woodGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.1);

      woodOsc.connect(woodGain);
      woodGain.connect(ctx.destination);
      woodOsc.start(now + delay);
      woodOsc.stop(now + delay + 0.12);
    });
  }

  /**
   * Temizu Water: Soothing stream pouring from bamboo pipe / wooden hishaku
   */
  public playTemizuWater() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 1.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.9));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 0.8);
    filter.Q.setValueAtTime(4.0, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
  }

  /**
   * Traditional Two Claps (Ni-hai)
   */
  public playClap(count = 2) {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    for (let c = 0; c < count; c++) {
      const delay = c * 0.35;
      const now = ctx.currentTime + delay;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.06);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  }

  /**
   * Omikuji Canister Shaking (wooden dowels knocking)
   */
  public playOmikujiShake() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const offset = i * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440 + Math.random() * 120, now + offset);

      gain.gain.setValueAtTime(0.2, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.1);
    }
  }

  /**
   * Wind Chime (Fuurin)
   */
  public playFuurin() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [2093, 2349, 2793, 3135, 3520];
    const pitch = notes[Math.floor(Math.random() * notes.length)];

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 2.0);
  }

  /**
   * Auspicious Milestone Bell Chime
   */
  public playBellChime() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [1046.5, 1318.51, 1567.98, 2093.0]; // C6, E6, G6, C7 arpeggio
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.12, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 1.3);
    });
  }

  /**
   * Gentle Footstep sound (gravel / wood)
   */
  public playFootstep() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90 + Math.random() * 30, now);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * Zen Shakuhachi / Flute Note in Japanese Insen Pentatonic Scale
   */
  public playZenTone(noteIndex = 0) {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const scale = [293.66, 311.13, 392.00, 440.00, 523.25, 587.33]; // D, Eb, G, A, C, D
    const freq = scale[noteIndex % scale.length];
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    // Subtle breathy vibrato
    vibrato.frequency.setValueAtTime(5, now);
    vibratoGain.gain.setValueAtTime(3.5, now);
    vibrato.connect(osc.frequency);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    vibrato.start(now);
    osc.start(now);
    vibrato.stop(now + 3.0);
    osc.stop(now + 3.0);
  }

  /* ---------------------------------------------------------------- */
  /* Vietnamese temple sounds                                          */
  /* ---------------------------------------------------------------- */
  private tone(freq: number, at: number, dur: number, vol: number, type: OscillatorType = 'sine', bendTo?: number) {
    const ctx = this.ctx;
    if (!ctx || this.isMuted) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    if (bendTo) osc.frequency.exponentialRampToValueAtTime(bendTo, at + dur * 0.6);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(vol, at + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }

  /* ---------------- the living soundscape ---------------- */
  private echo: GainNode | null = null;
  /** a stone-hall echo for the night drum */
  private echoBus(): GainNode | null {
    const ctx = this.ctx;
    if (!ctx) return null;
    if (!this.echo) {
      const input = ctx.createGain();
      const d = ctx.createDelay(1);
      d.delayTime.value = 0.23;
      const fb = ctx.createGain();
      fb.gain.value = 0.42;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 900;
      input.connect(ctx.destination);
      input.connect(d);
      d.connect(lp);
      lp.connect(fb);
      fb.connect(d);
      lp.connect(ctx.destination);
      this.echo = input;
    }
    return this.echo;
  }
  private boom(at: number, vol: number, f = 70) {
    const ctx = this.ctx;
    const bus = this.echoBus();
    if (!ctx || !bus || this.isMuted) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f * 1.8, at);
    o.frequency.exponentialRampToValueAtTime(f, at + 0.09);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(vol, at + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.5);
    o.connect(g);
    g.connect(bus);
    o.start(at);
    o.stop(at + 0.6);
  }
  private scape = { tea: 0, birds: 0, lute: 0, drum: 0, trance: 0 };
  private scapeTimer: number | null = null;
  private nextDrum = 0;
  private drumPhase = 0;
  private lutePhrase = 0;
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  /**
   * The temple's sound, mixed by where you stand:
   * tea = cups clinking at the keeper's table, birds = the banyan, lute = a musician practising,
   * drum = the trống văn heartbeat of the night, trance = the hum of a statue's gaze.
   */
  public setScape(v: Partial<{ tea: number; birds: number; lute: number; drum: number; trance: number }>) {
    Object.assign(this.scape, v);
    const ctx = this.initContext();
    if (!ctx) return;
    if (this.scapeTimer === null) this.scapeTimer = window.setInterval(() => this.scapeTick(), 120);
    // the trance drone
    if (!this.droneOsc) {
      this.droneOsc = ctx.createOscillator();
      this.droneOsc.type = 'sawtooth';
      this.droneOsc.frequency.value = 55;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 220;
      this.droneGain = ctx.createGain();
      this.droneGain.gain.value = 0;
      this.droneOsc.connect(lp);
      lp.connect(this.droneGain);
      this.droneGain.connect(ctx.destination);
      this.droneOsc.start();
    }
    this.droneGain!.gain.setTargetAtTime(this.isMuted ? 0 : this.scape.trance * 0.09, ctx.currentTime, 0.4);
    this.droneOsc.frequency.setTargetAtTime(55 + this.scape.trance * 12, ctx.currentTime, 0.6);
  }
  public stopScape() {
    if (this.scapeTimer !== null) clearInterval(this.scapeTimer);
    this.scapeTimer = null;
    if (this.droneGain && this.ctx) this.droneGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
  }
  private scapeTick() {
    const ctx = this.ctx;
    if (!ctx || this.isMuted) return;
    const now = ctx.currentTime;
    const S = this.scape;
    // porcelain teacups: two light clinks
    if (S.tea > 0.02 && Math.random() < 0.035) {
      const f = 2600 + Math.random() * 900;
      this.tone(f, now, 0.18, 0.05 * S.tea, 'sine', f * 1.003);
      this.tone(f * 1.34, now + 0.06 + Math.random() * 0.1, 0.14, 0.03 * S.tea, 'sine');
    }
    // birds in the banyan
    if (S.birds > 0.02 && Math.random() < 0.06) {
      const f = 2200 + Math.random() * 1400;
      for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) this.tone(f + i * 120, now + i * 0.09, 0.08, 0.03 * S.birds, 'sine', f * 1.25);
    }
    // a musician practising the moon lute: a phrase, a stop, try again
    if (S.lute > 0.02 && Math.random() < 0.05) {
      const scale = [293.7, 349.2, 392.0, 440.0, 523.3];
      const phrase = [0, 1, 2, 1, 3, 2][this.lutePhrase % 6];
      const len = 2 + Math.floor(Math.random() * 4);
      for (let i = 0; i < len; i++) this.playLute(scale[(phrase + i) % 5], now + i * 0.3, 0.05 * S.lute);
      this.lutePhrase++;
    }
    // trống văn: a heartbeat that quickens and slows, echoing off stone
    if (S.drum > 0.02) {
      if (this.nextDrum < now) this.nextDrum = now + 0.05;
      while (this.nextDrum < now + 0.3) {
        this.drumPhase += 1;
        const tempo = 0.62 - 0.22 * (0.5 + 0.5 * Math.sin(this.drumPhase / 40));
        const t = this.nextDrum;
        this.boom(t, 0.32 * S.drum, 68);
        this.boom(t + tempo * 0.28, 0.2 * S.drum, 82);
        if (this.drumPhase % 8 === 0) this.tone(1700, t + tempo * 0.5, 0.05, 0.05 * S.drum, 'square', 1500);
        this.nextDrum += tempo;
      }
    }
  }

  /** The great bronze bell of the bell tower: low, long, with beating partials */
  public playGreatBell() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [[72, 0.55, 9], [73.4, 0.4, 9], [146, 0.3, 7], [198, 0.2, 6], [243, 0.14, 4.5], [392, 0.06, 2.5]].forEach(([f, v, d]) => this.tone(f, now, d, v));
    this.noise(0.25, 300, 1, 0.25, 0.005);
  }

  /** Mõ, the wooden fish knocked during prayers */
  public playMo() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;
    this.tone(420, ctx.currentTime, 0.18, 0.3, 'triangle', 300);
  }

  /** Paper petitions catching fire in the furnace */
  public playPaperBurn() {
    this.noise(2.4, 2600, 0.5, 0.25, 0.3, 'highpass');
    for (let i = 0; i < 10; i++) setTimeout(() => this.noise(0.06, 3000, 1, 0.3, 0.002, 'bandpass'), 200 + Math.random() * 2000);
  }

  /** A plucked note on the đàn nguyệt (moon lute) */
  public playLute(freq: number, at?: number, vol = 0.14) {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;
    const t = at ?? ctx.currentTime;
    this.tone(freq, t, 1.1, vol, 'triangle');
    this.tone(freq * 2, t, 0.5, vol * 0.35, 'sine');
    // the slight upward bend Vietnamese players add (nhấn)
    if (Math.random() < 0.3) this.tone(freq, t + 0.25, 0.7, vol * 0.5, 'triangle', freq * 1.06);
  }

  /** the audio clock, for things that must land on the beat */
  public get audioTime(): number {
    return this.initContext()?.currentTime ?? 0;
  }
  /** phách: the bamboo clapper that keeps the beat */
  public phach(at: number, accent = false) {
    this.tone(1800, at, 0.05, accent ? 0.13 : 0.06, 'square', 1500);
  }
  public drum(at: number, vol = 0.24) {
    this.tone(110, at, 0.32, vol, 'sine', 68);
  }
  /** a bright chime for a well-kept beat */
  public sparkle(at: number, freq = 1568) {
    this.tone(freq, at, 0.25, 0.05, 'sine', freq * 1.01);
  }

  /* ---------------- inside the medium ---------------- */
  private pos: { bus: GainNode; lp: BiquadFilterNode; ring: GainNode; ringOsc: OscillatorNode; drone: GainNode; droneOsc: OscillatorNode; timer: number; nextHeart: number; nextDrum: number; nextNote: number; bpm: number; drumBpm: number; note: number } | null = null;
  /**
   * Under the veil the world is a room away: the band muffled as if through cloth, your own
   * heart loud in your ears, a thin ringing, and a drone that is not quite music.
   */
  public startPossession() {
    const ctx = this.initContext();
    if (!ctx || this.pos) return;
    const now = ctx.currentTime;
    const bus = ctx.createGain();
    bus.gain.value = this.isMuted ? 0 : 1;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 320;
    lp.Q.value = 0.8;
    bus.connect(lp);
    lp.connect(ctx.destination);
    const ringOsc = ctx.createOscillator();
    ringOsc.frequency.value = 3520;
    const ring = ctx.createGain();
    ring.gain.value = 0;
    ringOsc.connect(ring);
    ring.connect(ctx.destination);
    ringOsc.start();
    const droneOsc = ctx.createOscillator();
    droneOsc.type = 'sawtooth';
    droneOsc.frequency.value = 49;
    const dlp = ctx.createBiquadFilter();
    dlp.type = 'lowpass';
    dlp.frequency.value = 180;
    const drone = ctx.createGain();
    drone.gain.value = 0;
    droneOsc.connect(dlp);
    dlp.connect(drone);
    drone.connect(ctx.destination);
    droneOsc.start();
    drone.gain.setTargetAtTime(this.isMuted ? 0 : 0.08, now, 1.5);
    this.pos = { bus, lp, ring, ringOsc, drone, droneOsc, timer: 0, nextHeart: now + 0.4, nextDrum: now + 0.2, nextNote: now + 1, bpm: 128, drumBpm: 76, note: 0 };
    this.pos.timer = window.setInterval(() => this.posTick(), 100);
  }
  /** heart = your pulse (bpm), muffle 0..1 (1 = under the veil), ring = the ringing in the ears */
  public setPossession(v: { heart?: number; muffle?: number; ring?: number; drone?: number; drum?: number }) {
    const p = this.pos, ctx = this.ctx;
    if (!p || !ctx) return;
    const now = ctx.currentTime;
    if (v.heart !== undefined) p.bpm = v.heart;
    if (v.drum !== undefined) p.drumBpm = v.drum;
    if (v.muffle !== undefined) p.lp.frequency.setTargetAtTime(320 + (1 - v.muffle) * 9000, now, 0.25);
    if (v.ring !== undefined) p.ring.gain.setTargetAtTime(this.isMuted ? 0 : v.ring * 0.012, now, 0.6);
    if (v.drone !== undefined) p.drone.gain.setTargetAtTime(this.isMuted ? 0 : v.drone * 0.1, now, 0.8);
  }
  private posTone(freq: number, at: number, dur: number, vol: number, type: OscillatorType, bendTo?: number, dest?: AudioNode) {
    const ctx = this.ctx;
    if (!ctx || this.isMuted) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, at);
    if (bendTo) o.frequency.exponentialRampToValueAtTime(bendTo, at + dur * 0.6);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(vol, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g);
    g.connect(dest ?? ctx.destination);
    o.start(at);
    o.stop(at + dur + 0.05);
  }
  private posTick() {
    const p = this.pos, ctx = this.ctx;
    if (!p || !ctx) return;
    const now = ctx.currentTime;
    // your heart: lub-dub, close and dry
    while (p.nextHeart < now + 0.25) {
      const t = Math.max(p.nextHeart, now);
      this.posTone(58, t, 0.22, 0.5, 'sine', 40);
      this.posTone(52, t + 0.16, 0.2, 0.32, 'sine', 38);
      p.nextHeart = t + 60 / p.bpm;
    }
    // the band, heard through cloth
    while (p.nextDrum < now + 0.25) {
      const t = Math.max(p.nextDrum, now);
      this.posTone(110, t, 0.4, 0.5, 'sine', 66, p.bus);
      this.posTone(1800, t, 0.05, 0.12, 'square', 1500, p.bus);
      p.nextDrum = t + 60 / p.drumBpm;
    }
    if (p.nextNote < now) {
      const scale = [261.6, 293.7, 349.2, 392.0, 440.0];
      const n = [0, 2, 3, 4, 3, 2, 1, 0][p.note++ % 8];
      this.posTone(scale[n], now, 1.2, 0.18, 'triangle', undefined, p.bus);
      p.nextNote = now + (60 / p.drumBpm) * (p.note % 4 === 0 ? 2 : 1);
    }
  }
  /** a voice that is breath more than voice, from one side then the other */
  public whisper(len = 6, pan = 0) {
    const ctx = this.initContext();
    if (!ctx || this.isMuted) return;
    const now = ctx.currentTime;
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    panner.connect(ctx.destination);
    for (let i = 0; i < len; i++) {
      const at = now + i * (0.16 + Math.random() * 0.12);
      const dur = 0.12 + Math.random() * 0.18;
      const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let j = 0; j < d.length; j++) d[j] = (Math.random() * 2 - 1) * Math.sin((j / d.length) * Math.PI);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.Q.value = 6;
      const f0 = 700 + Math.random() * 1600;
      f.frequency.setValueAtTime(f0, at);
      f.frequency.linearRampToValueAtTime(f0 * (0.7 + Math.random() * 0.6), at + dur);
      const g = ctx.createGain();
      g.gain.value = 0.55;
      src.connect(f);
      f.connect(g);
      g.connect(panner);
      src.start(at);
    }
  }
  /** the veil lifts: a long indrawn breath of sound, then the gong */
  public veilLift() {
    const ctx = this.initContext();
    if (!ctx || this.isMuted) return;
    const now = ctx.currentTime;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(300, now);
    f.frequency.exponentialRampToValueAtTime(5000, now + 1.8);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.4, now + 1.8);
    g.gain.linearRampToValueAtTime(0, now + 1.95);
    src.connect(f);
    f.connect(g);
    g.connect(ctx.destination);
    src.start(now);
    setTimeout(() => this.playTempleGong(), 1850);
  }
  /** everything stops at once */
  public stopPossession() {
    const p = this.pos;
    if (!p) return;
    clearInterval(p.timer);
    try {
      p.ringOsc.stop();
      p.droneOsc.stop();
    } catch {
      /* already stopped */
    }
    p.bus.disconnect();
    p.ring.disconnect();
    p.drone.disconnect();
    this.pos = null;
  }

  /* ---------------- múa rối nước: the water-puppet band ---------------- */
  private pup: { timer: number; next: number; step: number; phrase: number } | null = null;
  /** sáo trúc: a bamboo flute note with vibrato and a breath of air */
  private flute(f: number, at: number, dur: number, vol = 0.07) {
    const ctx = this.ctx;
    if (!ctx || this.isMuted) return;
    const o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f * 0.985, at);
    o.frequency.linearRampToValueAtTime(f, at + 0.06);
    lfo.frequency.value = 5.5;
    lg.gain.setValueAtTime(0, at);
    lg.gain.linearRampToValueAtTime(f * 0.012, at + dur * 0.5);
    lfo.connect(lg);
    lg.connect(o.frequency);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(vol, at + 0.05);
    g.gain.setValueAtTime(vol, at + dur * 0.75);
    g.gain.linearRampToValueAtTime(0, at + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(at);
    lfo.start(at);
    o.stop(at + dur + 0.05);
    lfo.stop(at + dur + 0.05);
  }
  /** đàn bầu: the monochord's sliding voice */
  private danBau(f: number, at: number, dur: number) {
    this.tone(f, at, dur, 0.06, 'sine', f * (Math.random() < 0.5 ? 1.12 : 0.9));
    this.tone(f * 2, at, dur * 0.6, 0.02, 'sine');
  }
  public startPuppetMusic() {
    const ctx = this.initContext();
    if (!ctx || this.pup) return;
    this.pup = { timer: 0, next: ctx.currentTime + 0.2, step: 0, phrase: 0 };
    const beat = 0.25;
    // hò xự xang xê cống on G
    const sc = [392, 440, 523.3, 587.3, 659.3, 784, 880];
    const tunes = [
      [0, 2, 3, 4, 3, 2, 1, 0],
      [4, 5, 4, 3, 2, 3, 4, -1],
      [2, 3, 4, 6, 5, 4, 3, 2],
      [3, 2, 1, 0, 1, 2, 0, -1],
    ];
    const tick = () => {
      const p = this.pup, c = this.ctx;
      if (!p || !c) return;
      while (p.next < c.currentTime + 0.3) {
        const t = p.next, s = p.step;
        // trống cơm and the mõ: a skipping village rhythm
        if (s % 8 === 0 || s % 8 === 3 || s % 8 === 6) this.tone(s % 8 === 0 ? 150 : 190, t, 0.18, 0.18, 'sine', 110);
        if (s % 2 === 1) this.tone(950, t, 0.05, 0.06, 'triangle', 800);
        if (s % 16 === 0) this.boom(t, 0.18, 62);
        // the flute sings a phrase every two bars, the đàn bầu answers
        if (s % 2 === 0) {
          const tune = tunes[p.phrase % tunes.length];
          const n = tune[(s / 2) % 8];
          if (Math.floor(s / 16) % 2 === 0) {
            if (n >= 0) this.flute(sc[n], t, beat * 1.9);
          } else if (s % 4 === 0 && n >= 0) this.danBau(sc[n] / 2, t, beat * 3.5);
        }
        if (s % 16 === 15) p.phrase++;
        p.step++;
        p.next += beat;
      }
    };
    tick();
    this.pup.timer = window.setInterval(tick, 100);
  }
  public stopPuppetMusic() {
    if (this.pup) clearInterval(this.pup.timer);
    this.pup = null;
  }
  /** each act opens with a drum roll and a cymbal-ish crash */
  public puppetCue(i: number) {
    const ctx = this.initContext();
    if (!ctx || this.isMuted) return;
    const t0 = ctx.currentTime;
    for (let k = 0; k < 8; k++) this.tone(170 + k * 4, t0 + k * 0.06, 0.12, 0.08 + k * 0.015, 'sine', 120);
    this.noise(0.9, 6000, 0.7, 0.12, 0.005, 'highpass');
    if (i === 0) this.playTempleGong();
  }
  /** a dragon spits water */
  public puppetSpray() {
    this.noise(0.6, 2500, 0.8, 0.12, 0.02, 'bandpass');
  }

  private chauVanTimer: number | null = null;
  private cvVol = 1;
  /** distant or close: the hầu đồng music fades with distance from the hall */
  public setChauVanVolume(v: number) {
    this.cvVol = Math.max(0, Math.min(1, v));
  }
  /**
   * A loop in the spirit of chầu văn: moon-lute phrases on the Vietnamese pentatonic
   * (hò xự xang xê cống), over the "phách" clapper and a soft drum.
   */
  public startChauVan() {
    const ctx = this.initContext();
    if (!ctx || this.chauVanTimer !== null) return;
    const scale = [261.6, 293.7, 349.2, 392.0, 440.0, 523.3, 587.3, 698.5];
    const phrases = [
      [0, 2, 3, 4, 3, 2, 3, -1],
      [4, 5, 4, 3, 2, 3, 0, -1],
      [3, 4, 6, 5, 4, 3, 4, -1],
      [2, 3, 2, 0, 1, 2, 0, -1],
    ];
    let bar = 0;
    const beat = 0.34;
    const playBar = () => {
      if (!this.ctx) return;
      const t0 = this.ctx.currentTime + 0.05;
      const ph = phrases[bar % phrases.length];
      ph.forEach((n, i) => {
        if (n >= 0 && this.cvVol > 0.02) this.playLute(scale[n], t0 + i * beat, 0.12 * this.cvVol);
        // phách: wooden clapper on every beat, accent on 1 and 5
        if (this.cvVol > 0.02) this.tone(1800, t0 + i * beat, 0.05, (i % 4 === 0 ? 0.12 : 0.05) * this.cvVol, 'square', 1500);
      });
      // drum on the downbeats
      if (this.cvVol > 0.02) [0, 4].forEach((i) => this.tone(110, t0 + i * beat, 0.3, 0.22 * this.cvVol, 'sine', 70));
      bar++;
    };
    playBar();
    this.chauVanTimer = window.setInterval(playBar, beat * 8 * 1000);
  }
  public stopChauVan() {
    if (this.chauVanTimer !== null) clearInterval(this.chauVanTimer);
    this.chauVanTimer = null;
  }

  /** Evening by the river: crickets, the odd bird, and now and then a đàn bầu glide */
  private mood: 'day' | 'twilight' | 'night' = 'twilight';
  /** the soundscape follows the time of day: birds by day, crickets and frogs at night */
  public setMood(m: 'day' | 'twilight' | 'night') {
    this.mood = m;
  }

  public startAmbient() {
    if (this.isAmbientRunning) return;
    this.isAmbientRunning = true;
    const ctx = this.initContext();
    if (!ctx) return;
    this.ambientInterval = window.setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const night = this.mood === 'night';
      const r = Math.random();
      if (r < 0.1) {
        // far away in the hall, someone is singing chầu văn: a few plucks of the moon lute
        const scale = [293.7, 349.2, 392.0, 440.0, 523.3];
        for (let i = 0; i < 4; i++) this.tone(scale[Math.floor(Math.random() * 5)], now + i * 0.32, 0.5, 0.018, 'triangle');
        return;
      }
      if (r < 0.16) {
        // the wooden fish (mõ) of a visitor's prayer
        for (let i = 0; i < 3; i++) this.tone(820, now + i * 0.45, 0.06, 0.03, 'square', 760);
        return;
      }
      if (night ? r < 0.85 : r < 0.3) {
        if (night && Math.random() < 0.35) {
          // frogs by the pond
          this.tone(180 + Math.random() * 60, now, 0.12, 0.04, 'sawtooth', 120);
          this.tone(200, now + 0.18, 0.1, 0.035, 'sawtooth', 130);
          return;
        }
        // crickets: quick high chirps
        const f = 4200 + Math.random() * 800;
        for (let i = 0; i < 3; i++) this.tone(f, now + i * 0.07, 0.05, 0.025, 'sine');
      } else if (r < 0.9) {
        // a bird
        this.tone(2400 + Math.random() * 600, now, 0.18, 0.03, 'sine', 3200);
        this.tone(2800, now + 0.22, 0.14, 0.025, 'sine', 2200);
      } else {
        // đàn bầu: one note that bends and sighs
        const base = [349.2, 392.0, 440.0][Math.floor(Math.random() * 3)];
        this.tone(base, now, 2.2, 0.05, 'sine', base * 1.12);
      }
    }, 1800);
  }

  public stopAmbient() {
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
    this.isAmbientRunning = false;
  }
}

export const soundService = new SoundService();
