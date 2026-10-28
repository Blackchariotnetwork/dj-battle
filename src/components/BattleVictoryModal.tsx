import React from 'react';
import { BattleState } from '../types/dj';
import { DJAvatar } from './DJAvatar';
import { Trophy, RotateCcw, Flame, Sparkles, Award } from 'lucide-react';

interface BattleVictoryModalProps {
  battleState: BattleState;
  onRematch: () => void;
  onExitToLobby: () => void;
}

export const BattleVictoryModal: React.FC<BattleVictoryModalProps> = ({
  battleState,
  onRematch,
  onExitToLobby,
}) => {
  const { player1, player2, player1Score, player2Score, winner } = battleState;

  const winningDJ = winner === 'player1' ? player1 : winner === 'player2' ? player2 : null;
  const isTie = winner === 'TIE';

  const winningScore = winner === 'player1' ? player1Score : player2Score;
  const losingScore = winner === 'player1' ? player2Score : player1Score;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-700/80 rounded-3xl p-6 md:p-8 shadow-2xl text-center overflow-hidden">
        {/* Glow ambient background behind modal */}
        <div
          className="absolute -top-24 inset-x-1/4 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ backgroundColor: winningDJ ? winningDJ.accentColor : '#f59e0b' }}
        />

        {/* Trophy icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-4 text-amber-400 shadow-lg shadow-amber-500/20">
          <Trophy className="w-8 h-8 fill-current" />
        </div>

        {/* Title */}
        <span className="text-xs uppercase tracking-widest font-extrabold text-amber-400 block mb-1">
          BATTLE RESULTS
        </span>
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-2">
          {isTie ? 'DEAD HEAT TIE!' : `${winningDJ?.name} TAKES THE CROWN!`}
        </h2>
        <p className="text-sm text-neutral-400 mb-6">
          {isTie
            ? 'Both DJs brought undeniable heat! The crowd is calling for an immediate overtime rematch.'
            : `${winningDJ?.name} dominated the turntables with superior scratch combos and audience hype.`}
        </p>

        {/* Head to Head Score Breakdown Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Player 1 Card */}
          <div
            className={`p-4 rounded-2xl border text-left transition-all ${
              winner === 'player1'
                ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-500/10'
                : 'bg-neutral-800/40 border-white/5 opacity-80'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <DJAvatar dj={player1} size="md" isSpotlight={winner === 'player1'} />
              <div>
                <span className="font-extrabold text-sm text-white block truncate">{player1.name}</span>
                <span className="text-xs font-mono-numbers text-amber-400 font-bold">
                  {player1Score.totalScore.toLocaleString()} PTS
                </span>
              </div>
            </div>
            <div className="space-y-1.5 text-xs font-mono-numbers text-neutral-400">
              <div className="flex justify-between">
                <span>Rhythm Accuracy:</span>
                <span className="text-white font-medium">{player1Score.rhythmScore} pts</span>
              </div>
              <div className="flex justify-between">
                <span>Scratch Mastery:</span>
                <span className="text-white font-medium">{player1Score.scratchScore} pts</span>
              </div>
              <div className="flex justify-between">
                <span>Max Combo:</span>
                <span className="text-amber-400 font-bold">{player1Score.maxCombo}x</span>
              </div>
            </div>
          </div>

          {/* Player 2 Card */}
          <div
            className={`p-4 rounded-2xl border text-left transition-all ${
              winner === 'player2'
                ? 'bg-cyan-950/20 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                : 'bg-neutral-800/40 border-white/5 opacity-80'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <DJAvatar dj={player2} size="md" isSpotlight={winner === 'player2'} />
              <div>
                <span className="font-extrabold text-sm text-white block truncate">{player2.name}</span>
                <span className="text-xs font-mono-numbers text-cyan-400 font-bold">
                  {player2Score.totalScore.toLocaleString()} PTS
                </span>
              </div>
            </div>
            <div className="space-y-1.5 text-xs font-mono-numbers text-neutral-400">
              <div className="flex justify-between">
                <span>Rhythm Accuracy:</span>
                <span className="text-white font-medium">{player2Score.rhythmScore} pts</span>
              </div>
              <div className="flex justify-between">
                <span>Scratch Mastery:</span>
                <span className="text-white font-medium">{player2Score.scratchScore} pts</span>
              </div>
              <div className="flex justify-between">
                <span>Max Combo:</span>
                <span className="text-cyan-400 font-bold">{player2Score.maxCombo}x</span>
              </div>
            </div>
          </div>
        </div>

        {/* Celebrity DJ Judge Panel Scorecards */}
        <div className="bg-neutral-950/80 rounded-2xl p-4 border border-white/5 text-left mb-6">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>JUDGES SCORECARD VERDICT</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-neutral-300">
            <div className="p-2.5 rounded-lg bg-neutral-900 border border-white/5">
              <span className="font-bold text-amber-300 block mb-0.5">Grandmaster Scratch</span>
              <p className="text-neutral-400">
                {winner === 'player1'
                  ? `"${player1.name}'s vinyl scrubs and pitch control were sharp as a razor."`
                  : `"${player2.name}'s rapid pad timing sealed the win in the final round."`}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-neutral-900 border border-white/5">
              <span className="font-bold text-cyan-300 block mb-0.5">DJ Redline (Club DMC)</span>
              <p className="text-neutral-400">
                "The energy on the floor was unprecedented. Every drop hit like an earthquake."
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onRematch}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>IMMEDIATE REMATCH</span>
          </button>
          <button
            onClick={onExitToLobby}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-bold text-sm tracking-wide transition-colors cursor-pointer active:scale-95"
          >
            BACK TO LOBBY
          </button>
        </div>
      </div>
    </div>
  );
};
