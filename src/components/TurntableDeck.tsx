import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DeckState, DJProfile, SoundKit } from '../types/dj';
import { djAudio } from '../audio/djAudioEngine';
import { RotaryKnob } from './RotaryKnob';
import { Play, Pause, Disc, RotateCcw, Zap, Volume2 } from 'lucide-react';
import { SLIPMAT_STYLES } from '../data/djPresets';

interface TurntableDeckProps {
  deck: DeckState;
  profile: DJProfile;
  soundKit: SoundKit;
  isCurrentTurn: boolean;
  onUpdateDeck: (updates: Partial<DeckState>) => void;
  onAction: (actionType: string, points: number, label: string) => void;
  onSyncTempo?: () => void;
}

export const TurntableDeck: React.FC<TurntableDeckProps> = ({
  deck,
  profile,
  soundKit,
  isCurrentTurn,
  onUpdateDeck,
  onAction,
  onSyncTempo,
}) => {
  const [activePad, setActivePad] = useState<string | null>(null);
  const vinylRef = useRef<HTMLDivElement>(null);
  const isScratchingRef = useRef(false);
  const lastAngleRef = useRef(0);
  const rotationAngleRef = useRef(0);
  const lastScratchTimeRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const [, setRerender] = useState(0);

  const effectiveBpm = Math.round(deck.bpm * (1 + deck.pitch / 100) * 10) / 10;

  // Turntable motor spin loop
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const delta = currentTime - lastTime;
      lastTime = currentTime;

      if (deck.isPlaying && !isScratchingRef.current) {
        // Standard 33.3 RPM = 360 degrees in ~1.8 seconds, scaled by pitch
        const speedMultiplier = 1 + deck.pitch / 100;
        const degreesPerMs = (360 / 1800) * speedMultiplier;
        rotationAngleRef.current = (rotationAngleRef.current + degreesPerMs * delta) % 360;
        if (vinylRef.current) {
          vinylRef.current.style.transform = `rotate(${rotationAngleRef.current}deg)`;
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [deck.isPlaying, deck.pitch]);

  // Handle Play / Pause motor
  const togglePlay = () => {
    djAudio.ensureContext();
    if (deck.isPlaying) {
      djAudio.stopLoop(deck.deckId);
      onUpdateDeck({ isPlaying: false });
      onAction('STOP', 10, 'Motor Stop');
    } else {
      djAudio.startLoop(deck.deckId, deck.baseBpm, soundKit.genre, deck.pitch);
      onUpdateDeck({ isPlaying: true });
      onAction('DROP', 50, 'Track Dropped');
    }
  };

  // Cue button: instant return to start
  const handleCue = () => {
    djAudio.ensureContext();
    djAudio.stopLoop(deck.deckId);
    rotationAngleRef.current = 0;
    if (vinylRef.current) {
      vinylRef.current.style.transform = `rotate(0deg)`;
    }
    onUpdateDeck({ isPlaying: false, activeHotCue: 1 });
    // Quick scrub cue audio
    djAudio.triggerScratch(deck.deckId, 0.5, -1);
    onAction('CUE', 15, 'Cue Point Snapped');
  };

  // Pitch Fader Change
  const handlePitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPitch = parseFloat(e.target.value);
    onUpdateDeck({ pitch: newPitch });
    if (deck.isPlaying) {
      djAudio.updateLoopTempo(deck.deckId, deck.baseBpm, soundKit.genre, newPitch);
    }
    onAction('PITCH', 5, `${newPitch > 0 ? '+' : ''}${newPitch.toFixed(1)}% Pitch`);
  };

  // Reset Pitch to 0
  const handleResetPitch = () => {
    onUpdateDeck({ pitch: 0 });
    if (deck.isPlaying) {
      djAudio.updateLoopTempo(deck.deckId, deck.baseBpm, soundKit.genre, 0);
    }
    onAction('PITCH', 10, 'Pitch Centered 0.0%');
  };

  // Performance Pad Triggering
  const triggerPad = useCallback(
    (padId: string, label: string) => {
      djAudio.ensureContext();
      setActivePad(padId);
      setTimeout(() => setActivePad((curr) => (curr === padId ? null : curr)), 120);

      const pitchMult = 1 + deck.pitch / 100;

      // Map to synthesized instruments
      switch (padId) {
        case 'kick':
          djAudio.playKick(deck.deckId, pitchMult);
          onAction('PAD', 20, `${label} Hit`);
          break;
        case 'snare':
          djAudio.playSnare(deck.deckId, pitchMult);
          onAction('PAD', 20, `${label} Hit`);
          break;
        case 'hihat_c':
          djAudio.playHiHat(deck.deckId, false, pitchMult);
          onAction('PAD', 15, `${label} Hit`);
          break;
        case 'hihat_o':
          djAudio.playHiHat(deck.deckId, true, pitchMult);
          onAction('PAD', 15, `${label} Hit`);
          break;
        case 'bass808':
          djAudio.play808Bass(deck.deckId, 55, pitchMult);
          onAction('PAD', 30, 'Sub Bass Boom');
          break;
        case 'vocal_yeah':
          djAudio.playVocalChant(deck.deckId, 'yeah');
          onAction('VOCAL', 35, 'Yeah! Vocal Chop');
          break;
        case 'vocal_drop':
          djAudio.playVocalChant(deck.deckId, 'drop');
          onAction('DROP', 40, 'Bass Drop Vocal');
          break;
        case 'laser':
          djAudio.playVocalChant(deck.deckId, 'laser');
          onAction('FX', 25, 'Laser Riser');
          break;
        case 'scratch':
          djAudio.triggerScratch(deck.deckId, 0.9, 1);
          onAction('SCRATCH', 30, 'Baby Scratch Pad');
          break;
        case 'backspin':
          djAudio.playBackspin(deck.deckId);
          onAction('BACKSPIN', 45, 'Tape Rewind');
          break;
        case 'airhorn':
          djAudio.playAirHorn();
          onAction('AIRHORN', 50, 'Clash Air Horn!');
          break;
        default:
          djAudio.playKick(deck.deckId, pitchMult);
          onAction('PAD', 15, label);
      }
    },
    [deck.deckId, deck.pitch, onAction]
  );

  // Scratch vinyl pointer interactions
  const handleVinylPointerDown = (e: React.PointerEvent) => {
    djAudio.ensureContext();
    isScratchingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const rect = vinylRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    lastAngleRef.current = angle;
    lastScratchTimeRef.current = performance.now();

    // Trigger subtle needle touch click
    djAudio.triggerScratch(deck.deckId, 0.25, 1);
  };

  const handleVinylPointerMove = (e: React.PointerEvent) => {
    if (!isScratchingRef.current || !vinylRef.current) return;

    const rect = vinylRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);

    let deltaAngle = currentAngle - lastAngleRef.current;
    // Normalize angular wrap around (-180 to 180)
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;

    const now = performance.now();
    const deltaTime = Math.max(1, now - lastScratchTimeRef.current);
    const angularSpeed = Math.abs(deltaAngle) / deltaTime; // degrees per ms

    rotationAngleRef.current = (rotationAngleRef.current + deltaAngle) % 360;
    vinylRef.current.style.transform = `rotate(${rotationAngleRef.current}deg)`;

    // Audio scratching triggering when moving meaningfully
    if (Math.abs(deltaAngle) > 2) {
      const velocity = Math.min(1.8, Math.max(0.2, angularSpeed * 1.8));
      const direction: 1 | -1 = deltaAngle > 0 ? 1 : -1;
      djAudio.triggerScratch(deck.deckId, velocity, direction);

      const comboPoints = Math.round(velocity * 25);
      onAction('SCRATCH', comboPoints, deltaAngle > 0 ? 'Forward Scrub' : 'Back Tear Scratch');
    }

    lastAngleRef.current = currentAngle;
    lastScratchTimeRef.current = now;
  };

  const handleVinylPointerUp = (e: React.PointerEvent) => {
    if (isScratchingRef.current) {
      isScratchingRef.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // EQ changes
  const handleEqChange = (band: 'low' | 'mid' | 'high', val: number) => {
    djAudio.setEQ(deck.deckId, band, val);
    if (band === 'low') onUpdateDeck({ eqLow: val });
    if (band === 'mid') onUpdateDeck({ eqMid: val });
    if (band === 'high') onUpdateDeck({ eqHigh: val });
    onAction('EQ', 5, `${band.toUpperCase()} EQ Adjusted`);
  };

  // Filter change
  const handleFilterChange = (val: number) => {
    djAudio.setFilter(deck.deckId, val);
    onUpdateDeck({ filter: val });
    onAction('FILTER', 10, val === 0 ? 'Filter Flat' : val < 0 ? 'Low Pass Filter' : 'High Pass Filter');
  };

  const currentSlipmat = SLIPMAT_STYLES.find((s) => s.id === deck.slipmat) || SLIPMAT_STYLES[0];

  return (
    <div
      className={`relative rounded-2xl p-4 md:p-5 flex flex-col justify-between transition-all duration-300 ${
        isCurrentTurn ? 'ring-2 shadow-2xl' : 'ring-1 ring-white/10 opacity-95'
      }`}
      style={{
        backgroundColor: '#0f1118',
        borderColor: isCurrentTurn ? profile.accentColor : 'rgba(255, 255, 255, 0.08)',
        boxShadow: isCurrentTurn ? `0 0 35px ${profile.accentColor}25` : undefined,
      }}
    >
      {/* Top Deck Status Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: profile.accentColor }}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-white">{profile.name}</span>
              <span className="text-xs text-neutral-400 font-mono-numbers">
                {deck.deckId === 'deckA' ? 'DECK 1' : 'DECK 2'}
              </span>
            </div>
            <div className="text-xs text-neutral-400 truncate max-w-[180px] md:max-w-[220px]">
              {soundKit.name} · {soundKit.genre}
            </div>
          </div>
        </div>

        {/* BPM & Sync Lock Controls */}
        <div className="flex items-center gap-2">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-right">
            <span className="text-[10px] uppercase tracking-wider text-neutral-400 block leading-none">BPM</span>
            <span className="text-sm font-bold font-mono-numbers text-amber-400">
              {effectiveBpm.toFixed(1)}
            </span>
          </div>

          {onSyncTempo && (
            <button
              onClick={onSyncTempo}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
              title="Sync tempo to match opponent deck"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>SYNC</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Turntable Workstation: Platter + Pitch Fader */}
      <div className="flex flex-col xl:flex-row items-center justify-center gap-5 my-2">
        {/* Interactive Vinyl Platter */}
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full p-2 bg-gradient-to-tr from-neutral-900 via-neutral-800 to-neutral-700 border border-neutral-700 shadow-2xl flex items-center justify-center select-none">
          {/* Strobe pattern ring on platter edge */}
          <div className="absolute inset-1 rounded-full border border-dashed border-neutral-600/50 pointer-events-none" />

          {/* Rotating Vinyl Record */}
          <div
            ref={vinylRef}
            onPointerDown={handleVinylPointerDown}
            onPointerMove={handleVinylPointerMove}
            onPointerUp={handleVinylPointerUp}
            onPointerCancel={handleVinylPointerUp}
            className="relative w-full h-full rounded-full vinyl-grooves cursor-grab active:cursor-grabbing flex items-center justify-center transition-shadow active:shadow-inner"
            title="Grab and drag to scratch like a real DJ turntable!"
          >
            {/* Vinyl light sheen conic reflection */}
            <div className="absolute inset-0 rounded-full vinyl-sheen pointer-events-none" />

            {/* Slipmat / Center Label Art */}
            <div
              className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br ${currentSlipmat.bgClass} shadow-md border-2 border-white/20 flex flex-col items-center justify-center text-center p-2`}
            >
              <Disc className="w-6 h-6 text-white/80 mb-0.5 animate-pulse" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-white drop-shadow-md leading-tight">
                {deck.deckId === 'deckA' ? 'A-SIDE' : 'B-SIDE'}
              </span>
              <span className="text-[9px] font-mono-numbers text-white/70">
                {deck.isPlaying ? 'RUNNING' : 'STOPPED'}
              </span>

              {/* Red scratch cue tape stripe indicator */}
              <div className="absolute top-1 inset-x-1/2 -ml-0.5 w-1 h-6 bg-red-500 rounded-full shadow-sm" />
            </div>

            {/* Center Spindle Metal Peg */}
            <div className="absolute w-4 h-4 rounded-full bg-neutral-200 border border-neutral-400 shadow-inner" />
          </div>

          {/* Stylus Tone Arm Overlay */}
          <div
            className={`absolute top-2 right-2 pointer-events-none transition-transform duration-500 origin-top-right ${
              deck.isPlaying ? 'rotate-[-6deg]' : 'rotate-[-28deg]'
            }`}
          >
            <div className="w-16 sm:w-20 h-1 bg-gradient-to-r from-neutral-400 to-neutral-200 shadow-md relative">
              {/* Cartridge head */}
              <div className="absolute left-0 -top-1 w-3 h-3 bg-red-600 rounded-sm shadow-sm" />
            </div>
            {/* Tone arm base pivot */}
            <div className="absolute right-0 -top-2 w-5 h-5 rounded-full bg-neutral-600 border border-neutral-400" />
          </div>
        </div>

        {/* Pitch Tempo Fader Strip */}
        <div className="flex flex-row xl:flex-col items-center justify-between gap-3 bg-neutral-900/80 border border-white/5 p-3 rounded-xl w-full xl:w-24">
          <div className="flex xl:flex-col items-center justify-between w-full">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">PITCH</span>
            <button
              onClick={handleResetPitch}
              className="text-[10px] font-mono-numbers text-neutral-400 hover:text-amber-400 px-1 py-0.5 rounded border border-neutral-700 bg-neutral-800 transition-colors"
              title="Reset pitch slider to 0%"
            >
              0.0%
            </button>
          </div>

          {/* Range Slider for Pitch */}
          <div className="relative flex items-center justify-center py-1 w-full">
            <input
              type="range"
              min="-16"
              max="16"
              step="0.1"
              value={deck.pitch}
              onChange={handlePitchChange}
              className="w-full accent-amber-400 cursor-pointer h-2 bg-neutral-800 rounded-lg appearance-none"
            />
          </div>

          <span className="text-xs font-mono-numbers text-neutral-300 font-semibold">
            {deck.pitch > 0 ? `+${deck.pitch.toFixed(1)}%` : `${deck.pitch.toFixed(1)}%`}
          </span>
        </div>
      </div>

      {/* Turntable Action Controls: Play/Stop, Cue, Rewind */}
      <div className="grid grid-cols-3 gap-2 my-3">
        <button
          onClick={togglePlay}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 ${
            deck.isPlaying
              ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-amber-500/20'
              : 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700'
          }`}
        >
          {deck.isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          <span>{deck.isPlaying ? 'MOTOR ON' : 'PLAY MOTOR'}</span>
        </button>

        <button
          onClick={handleCue}
          className="py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
          title="Instant Snap Back to Cue 1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>CUE</span>
        </button>

        <button
          onClick={() => {
            djAudio.playBackspin(deck.deckId);
            onAction('BACKSPIN', 40, 'Vinyl Backspin');
          }}
          className="py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
          title="Simulate motor backspin brake"
        >
          <Disc className="w-3.5 h-3.5 text-amber-400" />
          <span>BRAKE</span>
        </button>
      </div>

      {/* 3-Band EQ & Dual Filter Knobs */}
      <div className="bg-neutral-900/60 rounded-xl p-3 border border-white/5 my-2">
        <div className="flex items-center justify-between gap-2">
          <RotaryKnob
            label="HI"
            value={deck.eqHigh}
            min={-24}
            max={6}
            unit="dB"
            onChange={(v) => handleEqChange('high', v)}
            color={profile.accentColor}
            size="sm"
          />
          <RotaryKnob
            label="MID"
            value={deck.eqMid}
            min={-24}
            max={6}
            unit="dB"
            onChange={(v) => handleEqChange('mid', v)}
            color={profile.accentColor}
            size="sm"
          />
          <RotaryKnob
            label="LOW"
            value={deck.eqLow}
            min={-24}
            max={6}
            unit="dB"
            onChange={(v) => handleEqChange('low', v)}
            color={profile.accentColor}
            size="sm"
          />
          <RotaryKnob
            label="FILTER"
            value={deck.filter}
            min={-100}
            max={100}
            onChange={handleFilterChange}
            color="#06b6d4"
            size="sm"
          />
        </div>
      </div>

      {/* 8 Performance Drum & Sample Pads */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            PERFORMANCE MPC PADS
          </span>
          <span className="text-[10px] text-neutral-500 font-mono-numbers">
            {deck.deckId === 'deckA' ? 'Keys: Q-W-E-R / A-S-D-F' : 'Keys: U-I-O-P / J-K-L-;'}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {soundKit.pads.map((pad) => {
            const keyLabel = deck.deckId === 'deckA' ? pad.keyLabelP1 : pad.keyLabelP2;
            const isPressed = activePad === pad.id;

            return (
              <button
                key={pad.id}
                onClick={() => triggerPad(pad.id, pad.label)}
                className={`relative rounded-xl p-2.5 text-center transition-all cursor-pointer active:scale-95 flex flex-col items-center justify-between h-16 border ${
                  isPressed
                    ? 'bg-amber-400 border-amber-300 text-neutral-950 scale-95 shadow-lg shadow-amber-400/40'
                    : 'bg-neutral-800/90 hover:bg-neutral-700/90 border-neutral-700/80 text-neutral-200'
                }`}
                title={`Trigger ${pad.label} (Press ${keyLabel})`}
              >
                {/* Key shortcut badge */}
                <span className="absolute top-1 left-1.5 text-[9px] font-mono-numbers font-bold opacity-60">
                  {keyLabel}
                </span>

                <div className="w-1.5 h-1.5 rounded-full mt-0.5 ml-auto" style={{ backgroundColor: profile.accentColor }} />

                <span className="text-xs font-bold tracking-tight truncate w-full block">
                  {pad.label}
                </span>

                <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-mono-numbers truncate">
                  {pad.category}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
