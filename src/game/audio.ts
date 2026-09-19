/**
 * High-performance Web Audio procedural synthesizer for low-latency combat sound effects.
 * Requires zero asset network downloads, perfectly responsive on mobile networks.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.8;

  constructor() {
    // AudioContext will be initialized on first user interaction to satisfy browser autoplay policy
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public playGunshot(weaponType: "AR" | "SMG" | "SNIPER" | "SHOTGUN" | "PISTOL" | "LAUNCHER" | "MELEE") {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const gainNode = this.ctx.createGain();
    gainNode.connect(this.ctx.destination);

    if (weaponType === "MELEE") {
      this.playRadioBeep();
      return;
    }

    if (weaponType === "SNIPER" || weaponType === "LAUNCHER") {
      // Heavy high-caliber rifle bang
      const osc = this.ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.35);

      gainNode.gain.setValueAtTime(this.volume * 0.95, t);
      gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.45);

      osc.connect(gainNode);
      osc.start(t);
      osc.stop(t + 0.45);

      // Noise crack
      this.playNoiseCrack(t, 0.4, 800, 1.2);
    } else if (weaponType === "SHOTGUN") {
      // Wide blast
      const osc = this.ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(240, t);
      osc.frequency.exponentialRampToValueAtTime(28, t + 0.28);

      gainNode.gain.setValueAtTime(this.volume * 0.9, t);
      gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

      osc.connect(gainNode);
      osc.start(t);
      osc.stop(t + 0.35);

      this.playNoiseCrack(t, 0.3, 1200, 1.0);
    } else if (weaponType === "SMG") {
      // Rapid light crack
      const osc = this.ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(460, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);

      gainNode.gain.setValueAtTime(this.volume * 0.7, t);
      gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

      osc.connect(gainNode);
      osc.start(t);
      osc.stop(t + 0.14);

      this.playNoiseCrack(t, 0.12, 2200, 0.6);
    } else {
      // Assault Rifle standard military crack
      const osc = this.ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(380, t);
      osc.frequency.exponentialRampToValueAtTime(55, t + 0.18);

      gainNode.gain.setValueAtTime(this.volume * 0.85, t);
      gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

      osc.connect(gainNode);
      osc.start(t);
      osc.stop(t + 0.22);

      this.playNoiseCrack(t, 0.18, 1600, 0.8);
    }
  }

  private playNoiseCrack(t: number, duration: number, cutoff: number, intensity: number) {
    if (!this.ctx) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cutoff, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.volume * intensity, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
  }

  public playHitmarker(isKill: boolean = false, isHeadshot: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    gain.connect(this.ctx.destination);

    if (isKill) {
      // Heavy kill confirmation chord
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = "sine";
      osc2.type = "triangle";
      osc1.frequency.setValueAtTime(520, t);
      osc1.frequency.exponentialRampToValueAtTime(780, t + 0.15);
      osc2.frequency.setValueAtTime(260, t);

      gain.gain.setValueAtTime(this.volume * 0.9, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc1.connect(gain);
      osc2.connect(gain);
      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.22);
      osc2.stop(t + 0.22);
    } else if (isHeadshot) {
      // CoD headshot ding bell
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, t);
      osc.frequency.setValueAtTime(1800, t + 0.04);

      gain.gain.setValueAtTime(this.volume * 0.8, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      osc.start(t);
      osc.stop(t + 0.18);
    } else {
      // CoD iconic sharp hitmarker tick "tink"
      const osc = this.ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(950, t);
      osc.frequency.exponentialRampToValueAtTime(450, t + 0.06);

      gain.gain.setValueAtTime(this.volume * 0.65, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      osc.start(t);
      osc.stop(t + 0.08);
    }
  }

  public playSlide() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const duration = 0.35;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.exponentialRampToValueAtTime(250, t + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t);
  }

  public playArmorPlate() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Metallic zip and snap
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.setValueAtTime(440, t + 0.12);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  public playReload() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Tactical magazine click and bolt lock
    const osc = this.ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.setValueAtTime(600, t + 0.15);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  public playExplosion() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.8);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.9);

    this.playNoiseCrack(t, 0.7, 500, 1.3);
  }

  public playRadioBeep() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.setValueAtTime(1200, t + 0.08);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.16);
  }
}

export const sounds = new SoundEngine();
