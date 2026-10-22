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

  private chauVanTimer: number | null = null;
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
        if (n >= 0) this.playLute(scale[n], t0 + i * beat, 0.12);
        // phách: wooden clapper on every beat, accent on 1 and 5
        this.tone(1800, t0 + i * beat, 0.05, i % 4 === 0 ? 0.12 : 0.05, 'square', 1500);
      });
      // drum on the downbeats
      [0, 4].forEach((i) => this.tone(110, t0 + i * beat, 0.3, 0.22, 'sine', 70));
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
  public startAmbient() {
    if (this.isAmbientRunning) return;
    this.isAmbientRunning = true;
    const ctx = this.initContext();
    if (!ctx) return;
    this.ambientInterval = window.setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const r = Math.random();
      if (r < 0.55) {
        // crickets: quick high chirps
        const f = 4200 + Math.random() * 800;
        for (let i = 0; i < 3; i++) this.tone(f, now + i * 0.07, 0.05, 0.025, 'sine');
      } else if (r < 0.8) {
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
