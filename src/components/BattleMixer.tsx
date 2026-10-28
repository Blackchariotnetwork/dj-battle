import React, { useEffect, useState } from 'react';
import { djAudio } from '../audio/djAudioEngine';
import { Volume2, Zap, Radio, Sparkles } from 'lucide-react';

interface BattleMixerProps {
  crossfaderPos: number; // -1 to 1
  crossfaderCurve: 'CUT' | 'SMOOTH';
  volumeA: number;
  volumeB: number;
  masterVolume: number;
  onCrossfaderChange: (pos: number) => void;
  onCurveToggle: () => void;
  onVolumeAChange: (vol: number) => void;
  onVolumeBChange: (vol: number) => void;
  onMasterVolumeChange: (vol: number) => void;
  onClashFX: (fxType: string) => void;
}

export const BattleMixer: React.FC<BattleMixerProps> = ({
  crossfaderPos,
  crossfaderCurve,
  volumeA,
  volumeB,
  masterVolume,
  onCrossfaderChange,
  onCurveToggle,
  onVolumeAChange,
  onVolumeBChange,
  onMasterVolumeChange,
  onClashFX,
}) => {
  const [levelA, setLevelA] = useState(0);
  const [levelB, setLevelB] = useState(0);
  const [levelMaster, setLevelMaster] = useState(0);

  // Poll Web Audio analyser for dancing LED VU meters
  useEffect(() => {
    let animId: number;
    const updateMeters = () => {
      const mA = djAudio.getMeterLevel(djAudio.deckAAnalyser);
      const mB = djAudio.getMeterLevel(djAudio.deckBAnalyser);
      const mM = djAudio.getMeterLevel(djAudio.masterAnalyser);

      setLevelA(mA);
      setLevelB(mB);
      setLevelMaster(mM);

      animId = requestAnimationFrame(updateMeters);
    };

    animId = requestAnimationFrame(updateMeters);
    return () => cancelAnimationFrame(animId);
  }, []);

  const renderMeterBars = (level: number) => {
    const totalBars = 10;
    const activeCount = Math.round(level * totalBars);

    return (
      <div className="flex flex-col-reverse gap-0.5 h-28 w-2.5 bg-neutral-900 rounded p-0.5 border border-white/5">
        {Array.from({ length: totalBars }).map((_, idx) => {
          const isActive = idx < activeCount;
          let colorClass = 'bg-neutral-800';
          if (isActive) {
            if (idx >= 8) colorClass = 'led-active-red';
            else if (idx >= 6) colorClass = 'led-active-amber';
            else colorClass = 'led-active-green';
          }
          return <div key={idx} className={`h-2 w-full rounded-xs transition-all duration-75 ${colorClass}`} />;
        })}
      </div>
    );
  };

  return (
    <div className="mixer-plate rounded-2xl p-4 flex flex-col justify-between w-full lg:w-72 xl:w-80 shadow-2xl shrink-0 my-2 lg:my-0">
      {/* Mixer Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
        <span className="text-xs font-extrabold tracking-widest uppercase text-neutral-300">
          PRO CLASH MIXER
        </span>
        <button
          onClick={onCurveToggle}
          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider transition-colors cursor-pointer border ${
            crossfaderCurve === 'CUT'
              ? 'bg-amber-500 text-neutral-950 border-amber-400'
              : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-white'
          }`}
          title="Toggle between sharp scratch cut and smooth crossfade curve"
        >
          {crossfaderCurve === 'CUT' ? 'SHARP CUT' : 'SMOOTH BLEND'}
        </button>
      </div>

      {/* LED VU Peak Meters & Channel Faders */}
      <div className="grid grid-cols-3 gap-3 items-center justify-items-center py-2 bg-neutral-900/60 rounded-xl p-3 border border-white/5">
        {/* Deck A Level */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] font-mono-numbers text-neutral-400 font-bold">CH 1</span>
          {renderMeterBars(levelA)}
          <span className="text-[9px] font-mono-numbers text-neutral-500">
            {Math.round(levelA * 100)}%
          </span>
        </div>

        {/* Master Output Level */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] font-mono-numbers text-amber-400 font-bold">MASTER</span>
          <div className="flex gap-1">
            {renderMeterBars(levelMaster)}
            {renderMeterBars(levelMaster * 0.95)}
          </div>
          <span className="text-[9px] font-mono-numbers text-amber-400">
            {Math.round(levelMaster * 100)}%
          </span>
        </div>

        {/* Deck B Level */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] font-mono-numbers text-neutral-400 font-bold">CH 2</span>
          {renderMeterBars(levelB)}
          <span className="text-[9px] font-mono-numbers text-neutral-500">
            {Math.round(levelB * 100)}%
          </span>
        </div>
      </div>

      {/* Instant Clash FX Launchpad */}
      <div className="my-3">
        <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block mb-2">
          CLASH BATTLE DROPS
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onClashFX('airhorn')}
            className="py-2 px-2.5 rounded-lg bg-neutral-800 hover:bg-amber-600 hover:text-neutral-950 text-neutral-200 border border-neutral-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
          >
            <Radio className="w-3.5 h-3.5 text-amber-400 fill-current" />
            <span>AIR HORN</span>
          </button>

          <button
            onClick={() => onClashFX('crowd')}
            className="py-2 px-2.5 rounded-lg bg-neutral-800 hover:bg-cyan-600 hover:text-neutral-950 text-neutral-200 border border-neutral-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>CROWD ROAR</span>
          </button>
        </div>
      </div>

      {/* Crossfader Section with Quick Cut Triggers */}
      <div className="bg-neutral-900/90 rounded-xl p-3.5 border border-white/10 mt-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">
            CROSSFADER
          </span>
          <div className="flex items-center gap-1 text-[10px] font-mono-numbers text-neutral-400">
            <span className={crossfaderPos < -0.3 ? 'text-amber-400 font-bold' : ''}>A</span>
            <span>·</span>
            <span className={Math.abs(crossfaderPos) <= 0.3 ? 'text-white font-bold' : ''}>CTR</span>
            <span>·</span>
            <span className={crossfaderPos > 0.3 ? 'text-cyan-400 font-bold' : ''}>B</span>
          </div>
        </div>

        {/* Crossfader Slider */}
        <div className="relative flex items-center py-2">
          <input
            type="range"
            min="-1"
            max="1"
            step="0.02"
            value={crossfaderPos}
            onChange={(e) => onCrossfaderChange(parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-3 bg-neutral-800 rounded-lg appearance-none shadow-inner"
          />
        </div>

        {/* Quick Snapping Cut Buttons */}
        <div className="grid grid-cols-3 gap-1.5 mt-2">
          <button
            onClick={() => onCrossfaderChange(-1)}
            className={`py-1 text-[10px] font-bold rounded border transition-colors cursor-pointer ${
              crossfaderPos === -1
                ? 'bg-amber-500 text-neutral-950 border-amber-400'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
            }`}
          >
            DECK A (100%)
          </button>
          <button
            onClick={() => onCrossfaderChange(0)}
            className={`py-1 text-[10px] font-bold rounded border transition-colors cursor-pointer ${
              crossfaderPos === 0
                ? 'bg-neutral-200 text-neutral-950 border-white'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
            }`}
          >
            CENTER
          </button>
          <button
            onClick={() => onCrossfaderChange(1)}
            className={`py-1 text-[10px] font-bold rounded border transition-colors cursor-pointer ${
              crossfaderPos === 1
                ? 'bg-cyan-500 text-neutral-950 border-cyan-400'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
            }`}
          >
            DECK B (100%)
          </button>
        </div>
      </div>
    </div>
  );
};
