import React from 'react';
import { BattleState, DJProfile, PlayerScore } from '../types/dj';
import { DJAvatar } from './DJAvatar';
import { Flame, Trophy, Clock, Zap } from 'lucide-react';

interface CrowdMeterProps {
  battleState: BattleState;
}

export const CrowdMeter: React.FC<CrowdMeterProps> = ({ battleState }) => {
  const {
    player1,
    player2,
    player1Score,
    player2Score,
    currentRound,
    totalRounds,
    timeRemainingSeconds,
    status,
    activeTurnPlayer,
    mode,
  } = battleState;

  // Calculate crowd hype split percentage (default 50/50)
  const totalScore = player1Score.totalScore + player2Score.totalScore;
  let p1Percent = 50;
  if (totalScore > 0) {
    p1Percent = Math.min(85, Math.max(15, Math.round((player1Score.totalScore / totalScore) * 100)));
  }
  const p2Percent = 100 - p1Percent;

  // Round descriptions
  const roundTitles: Record<number, string> = {
    1: 'ROUND 1: BEATMATCH & GROOVE',
    2: 'ROUND 2: SCRATCH SHOWDOWN',
    3: 'ROUND 3: ULTIMATE CLIMAX DROP',
  };

  // Turn status label
  let turnLabel = 'OPEN FREESTYLE JAM';
  if (mode !== 'FREESTYLE') {
    if (activeTurnPlayer === 'player1') {
      turnLabel = `${player1.name.toUpperCase()}'S TURN`;
    } else if (activeTurnPlayer === 'player2') {
      turnLabel = `${player2.name.toUpperCase()}'S TURN`;
    } else {
      turnLabel = 'HEAD-TO-HEAD CLASH!';
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full bg-neutral-900/90 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-md relative overflow-hidden my-4">
      {/* Background Animated Crowd Silhouettes */}
      <div className="absolute inset-x-0 bottom-0 h-10 opacity-15 pointer-events-none flex items-end justify-between px-2">
        {Array.from({ length: 28 }).map((_, i) => (
          <div
            key={i}
            className="w-2.5 bg-white rounded-t-full"
            style={{
              height: `${20 + (i % 5) * 8 + Math.sin(i) * 6}px`,
              animation: 'bounce 1s infinite alternate',
              animationDelay: `${(i * 70) % 1000}ms`,
            }}
          />
        ))}
      </div>

      {/* Top Header: Round info, Timer, Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3 border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-amber-400">
            <Flame className="w-4 h-4 fill-current" />
            <span>{roundTitles[currentRound] || `ROUND ${currentRound}`}</span>
          </div>
          <span className="text-neutral-500 font-mono-numbers text-xs">/</span>
          <span className="text-xs text-neutral-400 font-medium tracking-wide">
            {turnLabel}
          </span>
        </div>

        {/* Center Countdown Clock */}
        {status === 'BATTLE_ACTIVE' && (
          <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1 rounded-xl border border-white/10">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-base font-bold font-mono-numbers text-white tracking-wider">
              {formatTime(timeRemainingSeconds)}
            </span>
          </div>
        )}

        {/* Total Battle Rounds Tracker */}
        <div className="flex items-center gap-1.5 text-xs font-mono-numbers text-neutral-400">
          <span>ROUND</span>
          <span className="font-bold text-white">{currentRound}</span>
          <span>OF</span>
          <span className="font-bold text-white">{totalRounds}</span>
        </div>
      </div>

      {/* Main Clash Scoreboard & Hype Tug-of-War Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Player 1 Stats */}
        <div className="md:col-span-4 flex items-center gap-3">
          <DJAvatar dj={player1} size="md" isSpotlight={activeTurnPlayer === 'player1'} />
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-wide text-white truncate">
                {player1.name}
              </span>
              {player1Score.comboCount > 1 && (
                <span className="text-[10px] font-bold font-mono-numbers px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {player1Score.comboCount}x COMBO
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs font-mono-numbers text-neutral-400">
              <span className="text-amber-400 font-bold">{player1Score.totalScore.toLocaleString()} PTS</span>
              <span>·</span>
              <span>Hype: {p1Percent}%</span>
            </div>
          </div>
        </div>

        {/* Center Tug-of-War Hype Bar */}
        <div className="md:col-span-4 flex flex-col items-center">
          <div className="flex items-center justify-between w-full text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-1">
            <span style={{ color: player1.accentColor }}>{p1Percent}% HYPE</span>
            <span className="text-neutral-500">CROWD DECISION</span>
            <span style={{ color: player2.accentColor }}>{p2Percent}% HYPE</span>
          </div>

          {/* Interactive Split Bar */}
          <div className="w-full h-3.5 bg-neutral-950 rounded-full overflow-hidden flex border border-white/10 shadow-inner">
            <div
              className="h-full transition-all duration-300 relative"
              style={{
                width: `${p1Percent}%`,
                backgroundColor: player1.accentColor,
              }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
            <div
              className="h-full transition-all duration-300 relative"
              style={{
                width: `${p2Percent}%`,
                backgroundColor: player2.accentColor,
              }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Player 2 Stats */}
        <div className="md:col-span-4 flex items-center justify-start md:justify-end gap-3 text-left md:text-right">
          <div className="truncate order-2 md:order-1">
            <div className="flex items-center md:justify-end gap-2">
              {player2Score.comboCount > 1 && (
                <span className="text-[10px] font-bold font-mono-numbers px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {player2Score.comboCount}x COMBO
                </span>
              )}
              <span className="font-extrabold text-sm tracking-wide text-white truncate">
                {player2.name}
              </span>
            </div>
            <div className="flex items-center md:justify-end gap-2 text-xs font-mono-numbers text-neutral-400">
              <span>Hype: {p2Percent}%</span>
              <span>·</span>
              <span className="text-cyan-400 font-bold">{player2Score.totalScore.toLocaleString()} PTS</span>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <DJAvatar dj={player2} size="md" isSpotlight={activeTurnPlayer === 'player2'} />
          </div>
        </div>
      </div>
    </div>
  );
};
