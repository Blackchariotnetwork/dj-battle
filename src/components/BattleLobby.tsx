import React, { useState } from 'react';
import { BattleMode, DJProfile } from '../types/dj';
import { SOUND_KITS, BOT_DJS, SLIPMAT_STYLES } from '../data/djPresets';
import { DJAvatar } from './DJAvatar';
import { Users, Bot, Disc, Flame, Shield, ArrowRight, HelpCircle } from 'lucide-react';

interface BattleLobbyProps {
  onStartBattle: (config: {
    mode: BattleMode;
    player1: DJProfile;
    player2: DJProfile;
    kitIdA: string;
    kitIdB: string;
    roundSeconds: number;
    slipmatA: string;
    slipmatB: string;
  }) => void;
  onOpenHowToPlay: () => void;
}

export const BattleLobby: React.FC<BattleLobbyProps> = ({ onStartBattle, onOpenHowToPlay }) => {
  const [mode, setMode] = useState<BattleMode>('LOCAL_DUEL');
  const [player1Name, setPlayer1Name] = useState('DJ Crossfader');
  const [player2Name, setPlayer2Name] = useState('DJ Beat Beast');
  const [selectedBotIndex, setSelectedBotIndex] = useState(0);
  const [kitIdA, setKitIdA] = useState('hiphop_classic');
  const [kitIdB, setKitIdB] = useState('cyber_trap');
  const [roundSeconds, setRoundSeconds] = useState(30);
  const [slipmatA, setSlipmatA] = useState('classic');
  const [slipmatB, setSlipmatB] = useState('neon');

  const selectedBot = BOT_DJS[selectedBotIndex];

  const handleLaunch = () => {
    const p1: DJProfile = {
      id: 'player_1',
      name: player1Name.trim() || 'DJ Crossfader',
      title: 'Challenger 1',
      tagline: 'Scratch technician and groove architect.',
      avatarSeed: 'p1',
      accentColor: '#f59e0b',
      genre: SOUND_KITS.find((k) => k.id === kitIdA)?.genre || 'Hip-Hop',
      signatureMove: 'Tear Scratch Tornado',
    };

    const p2: DJProfile =
      mode === 'BOT_BATTLE'
        ? selectedBot
        : {
            id: 'player_2',
            name: player2Name.trim() || 'DJ Beat Beast',
            title: 'Challenger 2',
            tagline: 'Pad finger drummer and bass dropper.',
            avatarSeed: 'p2',
            accentColor: '#06b6d4',
            genre: SOUND_KITS.find((k) => k.id === kitIdB)?.genre || 'Trap',
            signatureMove: 'Sub Drop Shockwave',
          };

    onStartBattle({
      mode,
      player1: p1,
      player2: p2,
      kitIdA,
      kitIdB,
      roundSeconds,
      slipmatA,
      slipmatB,
    });
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Hero Banner Header */}
      <div className="text-center mb-8 relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 font-mono-numbers mb-3">
          <Flame className="w-3.5 h-3.5 text-amber-500 fill-current" />
          <span>HEAD-TO-HEAD TURNTABLE ARENA</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
          Crossfader Battle
        </h1>
        <p className="text-sm md:text-base text-neutral-400 max-w-xl mx-auto leading-relaxed">
          Step into the battle arena. Scratch vinyl records in real time, drop hard drum combos, sweep filters, and dominate the crowd decision.
        </p>

        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            onClick={onOpenHowToPlay}
            className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>How to Battle & Controls</span>
          </button>
        </div>
      </div>

      {/* Mode Selector Segmented Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        <button
          onClick={() => setMode('LOCAL_DUEL')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
            mode === 'LOCAL_DUEL'
              ? 'bg-neutral-900 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
              : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700 text-neutral-400'
          }`}
        >
          <div
            className={`p-2.5 rounded-xl border ${
              mode === 'LOCAL_DUEL'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-neutral-800 border-neutral-700 text-neutral-400'
            }`}
          >
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-sm text-white">2-Player Dual Clash</span>
              <span className="text-[10px] font-mono-numbers px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                P1 vs P2
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-normal">
              Two DJs share the decks on one screen with split keyboard hotkeys and live scratch battles.
            </p>
          </div>
        </button>

        <button
          onClick={() => setMode('BOT_BATTLE')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
            mode === 'BOT_BATTLE'
              ? 'bg-neutral-900 border-cyan-500/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/50'
              : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700 text-neutral-400'
          }`}
        >
          <div
            className={`p-2.5 rounded-xl border ${
              mode === 'BOT_BATTLE'
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                : 'bg-neutral-800 border-neutral-700 text-neutral-400'
            }`}
          >
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-sm text-white">AI Rival Clash</span>
              <span className="text-[10px] font-mono-numbers px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                BOT ARENA
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-normal">
              Face off against championship turntable bots with realistic scratch routines and drops.
            </p>
          </div>
        </button>

        <button
          onClick={() => setMode('FREESTYLE')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
            mode === 'FREESTYLE'
              ? 'bg-neutral-900 border-emerald-500/80 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/50'
              : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700 text-neutral-400'
          }`}
        >
          <div
            className={`p-2.5 rounded-xl border ${
              mode === 'FREESTYLE'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-neutral-800 border-neutral-700 text-neutral-400'
            }`}
          >
            <Disc className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-sm text-white">Freestyle Studio Jam</span>
              <span className="text-[10px] font-mono-numbers px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                PRACTICE
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-normal">
              No timer, no round pressure. Freely mix both turntables, practice scratching and build beats.
            </p>
          </div>
        </button>
      </div>

      {/* Setup Decks & Roster Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Deck A / Player 1 Configuration */}
        <div className="p-5 rounded-3xl bg-neutral-900/80 border border-neutral-800 relative">
          <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              DECK 1 (LEFT TURN TABLE)
            </span>
            <span className="text-xs font-mono-numbers text-neutral-400">Keys: Q-W-E-R / A-S-D-F</span>
          </div>

          {/* Name input */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-neutral-300 mb-1">DJ Stage Name</label>
            <input
              type="text"
              value={player1Name}
              onChange={(e) => setPlayer1Name(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="e.g. DJ Crossfader"
            />
          </div>

          {/* Sound Kit Picker */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-neutral-300 mb-1">Sound Kit & Genre</label>
            <div className="grid grid-cols-2 gap-2">
              {SOUND_KITS.map((kit) => (
                <button
                  key={kit.id}
                  onClick={() => setKitIdA(kit.id)}
                  className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    kitIdA === kit.id
                      ? 'bg-amber-500/10 border-amber-500 text-white'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-bold block truncate">{kit.name}</span>
                  <span className="text-[10px] text-amber-400 font-mono-numbers">
                    {kit.defaultBpm} BPM · {kit.genre}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Slipmat Picker */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Vinyl Slipmat Skin</label>
            <div className="flex flex-wrap gap-2">
              {SLIPMAT_STYLES.map((sm) => (
                <button
                  key={sm.id}
                  onClick={() => setSlipmatA(sm.id)}
                  className={`px-3 py-1 text-xs rounded-lg border transition-colors cursor-pointer ${
                    slipmatA === sm.id
                      ? 'bg-amber-500 text-neutral-950 border-amber-400 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {sm.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Deck B / Player 2 or Bot Configuration */}
        <div className="p-5 rounded-3xl bg-neutral-900/80 border border-neutral-800 relative">
          <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              {mode === 'BOT_BATTLE' ? 'AI OPPONENT ROSTER' : 'DECK 2 (RIGHT TURN TABLE)'}
            </span>
            <span className="text-xs font-mono-numbers text-neutral-400">
              {mode === 'BOT_BATTLE' ? 'BOT CONTROLLED' : 'Keys: U-I-O-P / J-K-L-;'}
            </span>
          </div>

          {mode === 'BOT_BATTLE' ? (
            /* Bot selection cards */
            <div className="space-y-3 mb-4">
              <label className="block text-xs font-medium text-neutral-300 mb-1">Choose AI Rival</label>
              <div className="grid grid-cols-2 gap-2">
                {BOT_DJS.map((bot, idx) => (
                  <button
                    key={bot.id}
                    onClick={() => {
                      setSelectedBotIndex(idx);
                      // Set matching kit
                      if (bot.genre === 'Hip-Hop') setKitIdB('hiphop_classic');
                      else if (bot.genre === 'Tech House') setKitIdB('tech_house');
                      else if (bot.genre === 'Trap') setKitIdB('cyber_trap');
                      else setKitIdB('dnb_warzone');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      selectedBotIndex === idx
                        ? 'bg-cyan-950/30 border-cyan-500 text-white shadow-md'
                        : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <DJAvatar dj={bot} size="sm" />
                    <div className="truncate">
                      <span className="text-xs font-bold block truncate text-white">{bot.name}</span>
                      <span className="text-[10px] text-cyan-400 font-mono-numbers">
                        {bot.skillLevel} · {bot.genre}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Bot Details Card */}
              <div className="p-3 rounded-xl bg-neutral-950 border border-white/5 text-xs text-neutral-300 mt-3">
                <span className="font-bold text-white block mb-0.5">{selectedBot.title}</span>
                <p className="text-neutral-400 mb-1.5">{selectedBot.tagline}</p>
                <div className="text-[10px] text-neutral-400 font-mono-numbers">
                  Signature Move: <span className="text-cyan-300 font-medium">{selectedBot.signatureMove}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Human Player 2 inputs */
            <>
              <div className="mb-4">
                <label className="block text-xs font-medium text-neutral-300 mb-1">Player 2 Stage Name</label>
                <input
                  type="text"
                  value={player2Name}
                  onChange={(e) => setPlayer2Name(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="e.g. DJ Beat Beast"
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-neutral-300 mb-1">Sound Kit & Genre</label>
                <div className="grid grid-cols-2 gap-2">
                  {SOUND_KITS.map((kit) => (
                    <button
                      key={kit.id}
                      onClick={() => setKitIdB(kit.id)}
                      className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        kitIdB === kit.id
                          ? 'bg-cyan-500/10 border-cyan-500 text-white'
                          : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-bold block truncate">{kit.name}</span>
                      <span className="text-[10px] text-cyan-400 font-mono-numbers">
                        {kit.defaultBpm} BPM · {kit.genre}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Vinyl Slipmat Skin</label>
                <div className="flex flex-wrap gap-2">
                  {SLIPMAT_STYLES.map((sm) => (
                    <button
                      key={sm.id}
                      onClick={() => setSlipmatB(sm.id)}
                      className={`px-3 py-1 text-xs rounded-lg border transition-colors cursor-pointer ${
                        slipmatB === sm.id
                          ? 'bg-cyan-500 text-neutral-950 border-cyan-400 font-bold'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {sm.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Battle Match Settings Bar */}
      {mode !== 'FREESTYLE' && (
        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              Round Duration (3 Rounds Total):
            </span>
          </div>

          <div className="flex items-center gap-2">
            {[30, 45, 60].map((secs) => (
              <button
                key={secs}
                onClick={() => setRoundSeconds(secs)}
                className={`px-3 py-1.5 text-xs font-mono-numbers rounded-lg border transition-colors cursor-pointer ${
                  roundSeconds === secs
                    ? 'bg-amber-500 text-neutral-950 font-bold border-amber-400'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
                }`}
              >
                {secs}s per round
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Primary Action Button */}
      <div className="text-center">
        <button
          onClick={handleLaunch}
          className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-black text-base tracking-wider uppercase transition-all cursor-pointer shadow-xl shadow-amber-500/25 active:scale-95 flex items-center justify-center gap-3 mx-auto"
        >
          <span>ENTER THE BATTLE ARENA</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
