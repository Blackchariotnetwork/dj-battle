import React from 'react';
import { X, Disc, Sliders, Zap, Award, Flame } from 'lucide-react';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-700/80 rounded-3xl p-6 md:p-8 shadow-2xl text-left max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400 block mb-1">
          BATTLE RULES & MASTERY
        </span>
        <h2 className="text-2xl font-black text-white mb-4">
          How to Win the DJ Clash
        </h2>

        <div className="space-y-4 text-sm text-neutral-300">
          <div className="p-4 rounded-2xl bg-neutral-950/60 border border-white/5 flex gap-4 items-start">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <Disc className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white mb-1">Interactive Vinyl Scratching</h3>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Click and drag directly on the vinyl platter with your mouse or finger to scrub and scratch.
                Move back and forth quickly for chirps and tears; move slowly for deep bass scrubs. Speed and rhythm build your Scratch Score!
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-950/60 border border-white/5 flex gap-4 items-start">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white mb-1">Performance MPC Pads & Hotkeys</h3>
              <p className="text-neutral-400 text-xs leading-relaxed mb-2">
                Trigger kicks, snares, 808 bass booms, and vocal hype drops on the fly. Rapid pad routines generate combo multipliers!
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono-numbers">
                <div className="p-2 rounded bg-neutral-900 border border-white/5">
                  <span className="text-amber-400 font-bold block">Deck 1 Hotkeys:</span>
                  <span className="text-neutral-400">Q, W, E, R / A, S, D, F</span>
                </div>
                <div className="p-2 rounded bg-neutral-900 border border-white/5">
                  <span className="text-cyan-400 font-bold block">Deck 2 Hotkeys:</span>
                  <span className="text-neutral-400">U, I, O, P / J, K, L, ;</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-950/60 border border-white/5 flex gap-4 items-start">
            <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20 shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white mb-1">The Crossfader & Sharp Cut</h3>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Slide the central crossfader to transition between Deck A and Deck B. Switch the curve mode to <strong>SHARP CUT</strong> for instant scratch-cutting, or <strong>SMOOTH BLEND</strong> for seamless club transitions.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-950/60 border border-white/5 flex gap-4 items-start">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white mb-1">Winning the Crowd Decision</h3>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Each battle lasts 3 rounds. Chain scratches with drum rolls, drop backspins, blast air horns, and keep the groove continuous to push the tug-of-war crowd meter over to your side!
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm tracking-wide transition-all cursor-pointer shadow-lg shadow-amber-500/20"
          >
            GOT IT, LET'S BATTLE!
          </button>
        </div>
      </div>
    </div>
  );
};
