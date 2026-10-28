/**
 * High-performance Web Audio DJ Engine
 * Includes real-time dual deck mixing, crossfader curves, 3-band EQ,
 * resonant filter sweep, vinyl scratching synthesis, drum synthesis,
 * beat loop sequencer, and clash sound effects.
 */

class DJAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  // Analysers for VU meters
  public masterAnalyser: AnalyserNode | null = null;
  public deckAAnalyser: AnalyserNode | null = null;
  public deckBAnalyser: AnalyserNode | null = null;

  // Decks gain & effects nodes
  private deckAGain: GainNode | null = null;
  private deckBGain: GainNode | null = null;

  // EQ Deck A
  private eqLowA: BiquadFilterNode | null = null;
  private eqMidA: BiquadFilterNode | null = null;
  private eqHighA: BiquadFilterNode | null = null;
  private filterA: BiquadFilterNode | null = null;

  // EQ Deck B
  private eqLowB: BiquadFilterNode | null = null;
  private eqMidB: BiquadFilterNode | null = null;
  private eqHighB: BiquadFilterNode | null = null;
  private filterB: BiquadFilterNode | null = null;

  // Sequencer / Loop state
  private isLoopRunningA = false;
  private isLoopRunningB = false;
  private timerIdA: number | null = null;
  private timerIdB: number | null = null;
  private stepA = 0;
  private stepB = 0;

  // Scratch sound nodes
  private scratchOscA: OscillatorNode | null = null;
  private scratchGainA: GainNode | null = null;
  private scratchOscB: OscillatorNode | null = null;
  private scratchGainB: GainNode | null = null;

  private isInitialized = false;

  public init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Compressor to prevent distortion on big drops
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-3, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(6, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

    // Master Gain & Analyser
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 64;

    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.ctx.destination);

    // Setup Deck A Channel Strip
    this.deckAGain = this.ctx.createGain();
    this.deckAAnalyser = this.ctx.createAnalyser();
    this.deckAAnalyser.fftSize = 64;

    this.eqLowA = this.ctx.createBiquadFilter();
    this.eqLowA.type = 'lowshelf';
    this.eqLowA.frequency.setValueAtTime(250, this.ctx.currentTime);

    this.eqMidA = this.ctx.createBiquadFilter();
    this.eqMidA.type = 'peaking';
    this.eqMidA.frequency.setValueAtTime(1500, this.ctx.currentTime);
    this.eqMidA.Q.setValueAtTime(1.0, this.ctx.currentTime);

    this.eqHighA = this.ctx.createBiquadFilter();
    this.eqHighA.type = 'highshelf';
    this.eqHighA.frequency.setValueAtTime(6000, this.ctx.currentTime);

    this.filterA = this.ctx.createBiquadFilter();
    this.filterA.type = 'allpass'; // Default neutral
    this.filterA.frequency.setValueAtTime(20000, this.ctx.currentTime);

    this.filterA.connect(this.eqLowA);
    this.eqLowA.connect(this.eqMidA);
    this.eqMidA.connect(this.eqHighA);
    this.eqHighA.connect(this.deckAGain);
    this.deckAGain.connect(this.deckAAnalyser);
    this.deckAAnalyser.connect(this.masterGain);

    // Setup Deck B Channel Strip
    this.deckBGain = this.ctx.createGain();
    this.deckBAnalyser = this.ctx.createAnalyser();
    this.deckBAnalyser.fftSize = 64;

    this.eqLowB = this.ctx.createBiquadFilter();
    this.eqLowB.type = 'lowshelf';
    this.eqLowB.frequency.setValueAtTime(250, this.ctx.currentTime);

    this.eqMidB = this.ctx.createBiquadFilter();
    this.eqMidB.type = 'peaking';
    this.eqMidB.frequency.setValueAtTime(1500, this.ctx.currentTime);
    this.eqMidB.Q.setValueAtTime(1.0, this.ctx.currentTime);

    this.eqHighB = this.ctx.createBiquadFilter();
    this.eqHighB.type = 'highshelf';
    this.eqHighB.frequency.setValueAtTime(6000, this.ctx.currentTime);

    this.filterB = this.ctx.createBiquadFilter();
    this.filterB.type = 'allpass'; // Default neutral
    this.filterB.frequency.setValueAtTime(20000, this.ctx.currentTime);

    this.filterB.connect(this.eqLowB);
    this.eqLowB.connect(this.eqMidB);
    this.eqMidB.connect(this.eqHighB);
    this.eqHighB.connect(this.deckBGain);
    this.deckBGain.connect(this.deckBAnalyser);
    this.deckBAnalyser.connect(this.masterGain);

    this.isInitialized = true;
  }

  public ensureContext() {
    if (!this.ctx || !this.isInitialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Crossfader Position: -1 (Deck A) to 0 (Center) to 1 (Deck B)
  public updateCrossfader(pos: number, curve: 'CUT' | 'SMOOTH' = 'SMOOTH') {
    this.ensureContext();
    if (!this.ctx || !this.deckAGain || !this.deckBGain) return;

    const clamped = Math.max(-1, Math.min(1, pos));
    let gainA = 1;
    let gainB = 1;

    if (curve === 'CUT') {
      // Sharp scratch cut curve: instant mute at extreme edges
      if (clamped > 0.8) {
        gainA = Math.max(0, (1 - clamped) / 0.2);
        gainB = 1;
      } else if (clamped < -0.8) {
        gainA = 1;
        gainB = Math.max(0, (clamped + 1) / 0.2);
      } else {
        gainA = 1;
        gainB = 1;
      }
    } else {
      // Equal power curve
      const angle = ((clamped + 1) / 2) * (Math.PI / 2);
      gainA = Math.cos(angle);
      gainB = Math.sin(angle);
    }

    const now = this.ctx.currentTime;
    this.deckAGain.gain.setTargetAtTime(gainA, now, 0.01);
    this.deckBGain.gain.setTargetAtTime(gainB, now, 0.01);
  }

  // 3-Band EQ adjustment (-24dB to +6dB)
  public setEQ(deck: 'deckA' | 'deckB', band: 'low' | 'mid' | 'high', valDb: number) {
    this.ensureContext();
    if (!this.ctx) return;
    const clamped = Math.max(-24, Math.min(6, valDb));
    const now = this.ctx.currentTime;
    if (deck === 'deckA') {
      if (band === 'low' && this.eqLowA) this.eqLowA.gain.setTargetAtTime(clamped, now, 0.02);
      if (band === 'mid' && this.eqMidA) this.eqMidA.gain.setTargetAtTime(clamped, now, 0.02);
      if (band === 'high' && this.eqHighA) this.eqHighA.gain.setTargetAtTime(clamped, now, 0.02);
    } else {
      if (band === 'low' && this.eqLowB) this.eqLowB.gain.setTargetAtTime(clamped, now, 0.02);
      if (band === 'mid' && this.eqMidB) this.eqMidB.gain.setTargetAtTime(clamped, now, 0.02);
      if (band === 'high' && this.eqHighB) this.eqHighB.gain.setTargetAtTime(clamped, now, 0.02);
    }
  }

  // High-Pass / Low-Pass Filter knob (-100 to +100)
  public setFilter(deck: 'deckA' | 'deckB', value: number) {
    this.ensureContext();
    if (!this.ctx) return;
    const node = deck === 'deckA' ? this.filterA : this.filterB;
    if (!node) return;

    const now = this.ctx.currentTime;
    if (Math.abs(value) < 4) {
      // Neutral bypass
      node.type = 'allpass';
      node.frequency.setTargetAtTime(20000, now, 0.02);
    } else if (value < 0) {
      // Low pass filter: from 20000Hz down to 180Hz
      node.type = 'lowpass';
      const norm = Math.abs(value) / 100; // 0 to 1
      const freq = 20000 * Math.pow(0.01, norm); // exponential curve
      node.frequency.setTargetAtTime(Math.max(120, freq), now, 0.02);
      node.Q.setTargetAtTime(2.5, now, 0.02);
    } else {
      // High pass filter: from 20Hz up to 6000Hz
      node.type = 'highpass';
      const norm = value / 100;
      const freq = 20 + Math.pow(norm, 2.2) * 6000;
      node.frequency.setTargetAtTime(freq, now, 0.02);
      node.Q.setTargetAtTime(2.5, now, 0.02);
    }
  }

  // Master Volume
  public setMasterVolume(vol: number) {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;
    const clamped = Math.max(0, Math.min(1, vol));
    this.masterGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.02);
  }

  // Deck destination input node (for triggering sounds through channel strip)
  public getDeckInput(deck: 'deckA' | 'deckB'): AudioNode | null {
    this.ensureContext();
    return deck === 'deckA' ? this.filterA : this.filterB;
  }

  // ==========================================
  // REAL-TIME SYNTHESIS SOUND GENERATORS
  // ==========================================

  // Kick Drum (deep punch + pitch drop)
  public playKick(deck: 'deckA' | 'deckB', pitchMultiplier = 1) {
    this.ensureContext();
    if (!this.ctx) return;
    const dest = this.getDeckInput(deck);
    if (!dest) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const startFreq = 145 * pitchMultiplier;
    const endFreq = 38 * pitchMultiplier;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.12);

    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Snare Drum (crack noise + tuned tone)
  public playSnare(deck: 'deckA' | 'deckB', pitchMultiplier = 1) {
    this.ensureContext();
    if (!this.ctx) return;
    const dest = this.getDeckInput(deck);
    if (!dest) return;

    const now = this.ctx.currentTime;

    // Noise buffer
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(900 * pitchMultiplier, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.85, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(dest);

    // Tonal Body
    const toneOsc = this.ctx.createOscillator();
    toneOsc.type = 'triangle';
    toneOsc.frequency.setValueAtTime(210 * pitchMultiplier, now);
    toneOsc.frequency.exponentialRampToValueAtTime(95 * pitchMultiplier, now + 0.08);

    const toneGain = this.ctx.createGain();
    toneGain.gain.setValueAtTime(0.5, now);
    toneGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    toneOsc.connect(toneGain);
    toneGain.connect(dest);

    noise.start(now);
    toneOsc.start(now);
    noise.stop(now + 0.2);
    toneOsc.stop(now + 0.15);
  }

  // Hi-Hat (crisp metallic noise)
  public playHiHat(deck: 'deckA' | 'deckB', isOpen = false, pitchMultiplier = 1) {
    this.ensureContext();
    if (!this.ctx) return;
    const dest = this.getDeckInput(deck);
    if (!dest) return;

    const now = this.ctx.currentTime;
    const dur = isOpen ? 0.28 : 0.05;

    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(8500 * pitchMultiplier, now);
    filter.Q.setValueAtTime(4.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(now);
    noise.stop(now + dur + 0.02);
  }

  // 808 Sub Bass Hit
  public play808Bass(deck: 'deckA' | 'deckB', noteFreq = 55, pitchMultiplier = 1) {
    this.ensureContext();
    if (!this.ctx) return;
    const dest = this.getDeckInput(deck);
    if (!dest) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const f = noteFreq * pitchMultiplier;
    osc.frequency.setValueAtTime(f * 1.5, now);
    osc.frequency.exponentialRampToValueAtTime(f, now + 0.06);

    gain.gain.setValueAtTime(0.9, now);
    gain.gain.setTargetAtTime(0.6, now + 0.05, 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + 0.7);
  }

  // Vocal / Hype Chants ("Yeah!", "Drop the Beat!", "Clash!")
  public playVocalChant(deck: 'deckA' | 'deckB', type: 'yeah' | 'drop' | 'letgo' | 'laser') {
    this.ensureContext();
    if (!this.ctx) return;
    const dest = this.getDeckInput(deck);
    if (!dest) return;

    const now = this.ctx.currentTime;

    if (type === 'laser') {
      // Sci-fi synth laser riser
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.22);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.26);
    } else if (type === 'drop') {
      // Pitch drop vocal bass stab
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc1.type = 'square';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(220, now);
      osc2.frequency.setValueAtTime(110, now);
      osc1.frequency.exponentialRampToValueAtTime(65, now + 0.35);
      osc2.frequency.exponentialRampToValueAtTime(45, now + 0.35);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, now);
      filter.frequency.exponentialRampToValueAtTime(250, now + 0.35);
      filter.Q.setValueAtTime(4, now);

      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
    } else {
      // Vocal resonant formant synth
      const osc = this.ctx.createOscillator();
      const f1 = this.ctx.createBiquadFilter();
      const f2 = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(type === 'yeah' ? 190 : 160, now);
      osc.frequency.exponentialRampToValueAtTime(type === 'yeah' ? 240 : 130, now + 0.18);

      // Formants for "Aah" / "Yeah" sound
      f1.type = 'bandpass';
      f1.frequency.setValueAtTime(800, now);
      f1.Q.setValueAtTime(5, now);

      f2.type = 'bandpass';
      f2.frequency.setValueAtTime(1200, now);
      f2.Q.setValueAtTime(6, now);

      gain.gain.setValueAtTime(0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

      osc.connect(f1);
      osc.connect(f2);
      f1.connect(gain);
      f2.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.25);
    }
  }

  // Turntable Vinyl Scratch Sound
  public triggerScratch(deck: 'deckA' | 'deckB', velocity: number, direction: 1 | -1) {
    this.ensureContext();
    if (!this.ctx) return;
    const dest = this.getDeckInput(deck);
    if (!dest) return;

    const absVel = Math.min(1.5, Math.max(0.1, Math.abs(velocity)));
    const now = this.ctx.currentTime;
    const dur = 0.08 + absVel * 0.06;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    const baseFreq = 380 * absVel;
    const startF = direction > 0 ? baseFreq * 0.7 : baseFreq * 1.5;
    const endF = direction > 0 ? baseFreq * 1.6 : baseFreq * 0.5;

    osc.frequency.setValueAtTime(startF, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(60, endF), now + dur);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(baseFreq * 1.8, now);
    filter.Q.setValueAtTime(3.5, now);

    gain.gain.setValueAtTime(0.5 * Math.min(1.2, absVel + 0.3), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + dur + 0.01);
  }

  // Classic DJ Clash Air Horn (3 bursts)
  public playAirHorn() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const bursts = [0, 0.16, 0.36];
    const notes = [466.16, 554.37, 698.46]; // Bb chord air horn cluster

    bursts.forEach((burstTime) => {
      const t = now + burstTime;
      notes.forEach((freq) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.setValueAtTime(freq * 1.02, t + 0.06);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.15);
      });
    });
  }

  // Vinyl Rewind / Backspin Effect
  public playBackspin(deck: 'deckA' | 'deckB') {
    this.ensureContext();
    if (!this.ctx) return;
    const dest = this.getDeckInput(deck);
    if (!dest) return;

    const now = this.ctx.currentTime;
    const dur = 0.55;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + dur);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + dur);
    filter.Q.setValueAtTime(4, now);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  // Crowd Cheering & Hype Noise
  public playCrowdCheer(intensity: number = 0.7) {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const dur = 1.2;

    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(1.5, now);

    const gain = this.ctx.createGain();
    const targetGain = Math.min(0.6, 0.2 + intensity * 0.4);
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(targetGain, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + dur + 0.05);
  }

  // ==========================================
  // BACKGROUND BEAT SEQUENCER LOOPS
  // ==========================================

  public startLoop(deck: 'deckA' | 'deckB', bpm: number, genre: string, pitchOffset = 0) {
    this.ensureContext();
    const effectiveBpm = bpm * (1 + pitchOffset / 100);
    const stepIntervalMs = (60 / effectiveBpm / 4) * 1000; // 16th notes

    if (deck === 'deckA') {
      if (this.isLoopRunningA) return;
      this.isLoopRunningA = true;
      this.stepA = 0;
      this.timerIdA = window.setInterval(() => {
        this.stepSequence('deckA', this.stepA, genre, 1 + pitchOffset / 100);
        this.stepA = (this.stepA + 1) % 16;
      }, stepIntervalMs);
    } else {
      if (this.isLoopRunningB) return;
      this.isLoopRunningB = true;
      this.stepB = 0;
      this.timerIdB = window.setInterval(() => {
        this.stepSequence('deckB', this.stepB, genre, 1 + pitchOffset / 100);
        this.stepB = (this.stepB + 1) % 16;
      }, stepIntervalMs);
    }
  }

  public stopLoop(deck: 'deckA' | 'deckB') {
    if (deck === 'deckA') {
      this.isLoopRunningA = false;
      if (this.timerIdA !== null) {
        clearInterval(this.timerIdA);
        this.timerIdA = null;
      }
    } else {
      this.isLoopRunningB = false;
      if (this.timerIdB !== null) {
        clearInterval(this.timerIdB);
        this.timerIdB = null;
      }
    }
  }

  public updateLoopTempo(deck: 'deckA' | 'deckB', bpm: number, genre: string, pitchOffset = 0) {
    const isRunning = deck === 'deckA' ? this.isLoopRunningA : this.isLoopRunningB;
    if (isRunning) {
      this.stopLoop(deck);
      this.startLoop(deck, bpm, genre, pitchOffset);
    }
  }

  private stepSequence(deck: 'deckA' | 'deckB', step: number, genre: string, pitchMultiplier: number) {
    // 16-step patterns depending on genre
    const isTrap = genre.toLowerCase().includes('trap');
    const isHouse = genre.toLowerCase().includes('house') || genre.toLowerCase().includes('techno');
    const isDnb = genre.toLowerCase().includes('drum') || genre.toLowerCase().includes('jungle');

    if (isHouse) {
      // 4-on-the-floor
      if (step % 4 === 0) this.playKick(deck, pitchMultiplier);
      if (step % 4 === 2) this.playHiHat(deck, true, pitchMultiplier);
      if (step === 4 || step === 12) this.playSnare(deck, pitchMultiplier);
      if (step % 2 === 1) this.playHiHat(deck, false, pitchMultiplier);
      if (step === 2 || step === 6 || step === 10 || step === 14) {
        this.play808Bass(deck, 65, pitchMultiplier);
      }
    } else if (isTrap) {
      // Trap / Half-time
      if (step === 0 || step === 10) this.playKick(deck, pitchMultiplier);
      if (step === 8) this.playSnare(deck, pitchMultiplier);
      // Fast rolling hi hats
      if (step % 2 === 0 || step >= 12) this.playHiHat(deck, false, pitchMultiplier);
      if (step === 0 || step === 6 || step === 11) {
        this.play808Bass(deck, 45, pitchMultiplier);
      }
    } else if (isDnb) {
      // Fast Jungle / D&B break
      if (step === 0 || step === 10) this.playKick(deck, pitchMultiplier);
      if (step === 4 || step === 12) this.playSnare(deck, pitchMultiplier);
      if (step % 2 === 0) this.playHiHat(deck, false, pitchMultiplier);
      if (step === 0 || step === 7) this.play808Bass(deck, 50, pitchMultiplier);
    } else {
      // Classic Hip-Hop Boombap (90 BPM)
      if (step === 0 || step === 7 || step === 10) this.playKick(deck, pitchMultiplier);
      if (step === 4 || step === 12) this.playSnare(deck, pitchMultiplier);
      if (step % 2 === 0) this.playHiHat(deck, false, pitchMultiplier);
      if (step === 2 || step === 6) this.playHiHat(deck, true, pitchMultiplier);
      if (step === 0 || step === 8) this.play808Bass(deck, 55, pitchMultiplier);
    }
  }

  // Get current RMS amplitude for meters (returns 0 to 1)
  public getMeterLevel(analyser: AnalyserNode | null): number {
    if (!analyser) return 0;
    const array = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(array);
    let sum = 0;
    for (let i = 0; i < array.length; i++) {
      sum += array[i];
    }
    const avg = sum / array.length;
    return Math.min(1, avg / 128);
  }
}

export const djAudio = new DJAudioEngine();
