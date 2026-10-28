/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BattleMode,
  BattleState,
  DeckState,
  DJProfile,
  PlayerScore,
  SoundKit,
} from './types/dj';
import {
  SOUND_KITS,
  BOT_DJS,
  DEFAULT_PLAYER_1,
  DEFAULT_PLAYER_2,
} from './data/djPresets';
import { djAudio } from './audio/djAudioEngine';
import { TurntableDeck } from './components/TurntableDeck';
import { BattleMixer } from './components/BattleMixer';
import { CrowdMeter } from './components/CrowdMeter';
import { BattleLobby } from './components/BattleLobby';
import { BattleVictoryModal } from './components/BattleVictoryModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { Zap, HelpCircle, Trophy, Disc, Flame } from 'lucide-react';

export default function App() {
  const [inLobby, setInLobby] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // Deck A State
  const [deckA, setDeckA] = useState<DeckState>({
    deckId: 'deckA',
    isPlaying: false,
    bpm: 90,
    baseBpm: 90,
    pitch: 0,
    volume: 0.9,
    filter: 0,
    eqLow: 0,
    eqMid: 0,
    eqHigh: 0,
    isCueing: false,
    isScratching: false,
    scratchAngle: 0,
    scratchVelocity: 0,
    loopActive: false,
    slipmat: 'classic',
    activeHotCue: null,
    lastPadHit: null,
    activeRoll: null,
  });

  // Deck B State
  const [deckB, setDeckB] = useState<DeckState>({
    deckId: 'deckB',
    isPlaying: false,
    bpm: 140,
    baseBpm: 140,
    pitch: 0,
    volume: 0.9,
    filter: 0,
    eqLow: 0,
    eqMid: 0,
    eqHigh: 0,
    isCueing: false,
    isScratching: false,
    scratchAngle: 0,
    scratchVelocity: 0,
    loopActive: false,
    slipmat: 'neon',
    activeHotCue: null,
    lastPadHit: null,
    activeRoll: null,
  });

  // Battle Arena State
  const [battleState, setBattleState] = useState<BattleState>({
    mode: 'LOCAL_DUEL',
    status: 'BATTLE_ACTIVE',
    currentRound: 1,
    totalRounds: 3,
    roundDurationSeconds: 30,
    timeRemainingSeconds: 30,
    activeTurnPlayer: 'both',
    player1: DEFAULT_PLAYER_1,
    player2: DEFAULT_PLAYER_2,
    player1Score: {
      rhythmScore: 0,
      scratchScore: 0,
      crowdCheerScore: 0,
      comboCount: 0,
      maxCombo: 0,
      totalScore: 0,
      hypePercentage: 50,
      recentActions: [],
    },
    player2Score: {
      rhythmScore: 0,
      scratchScore: 0,
      crowdCheerScore: 0,
      comboCount: 0,
      maxCombo: 0,
      totalScore: 0,
      hypePercentage: 50,
      recentActions: [],
    },
    crossfaderPosition: 0,
    crossfaderCurve: 'SMOOTH',
    selectedKitA: 'hiphop_classic',
    selectedKitB: 'cyber_trap',
    winner: null,
    commentaryLog: [],
  });

  const [masterVolume, setMasterVolume] = useState(0.85);

  const kitA = SOUND_KITS.find((k) => k.id === battleState.selectedKitA) || SOUND_KITS[0];
  const kitB = SOUND_KITS.find((k) => k.id === battleState.selectedKitB) || SOUND_KITS[1];

  // Ref to track latest battleState in intervals without staleness
  const battleStateRef = useRef(battleState);
  battleStateRef.current = battleState;

  // Bot AI routine execution interval
  useEffect(() => {
    if (battleState.mode !== 'BOT_BATTLE' || battleState.status !== 'BATTLE_ACTIVE') return;

    const botInterval = setInterval(() => {
      const state = battleStateRef.current;
      // Bot only performs if active turn includes player 2
      if (state.activeTurnPlayer === 'player1') return;

      const actions = ['PAD_KICK', 'PAD_SNARE', 'PAD_HAT', 'PAD_808', 'SCRATCH', 'DROP'];
      const chosen = actions[Math.floor(Math.random() * actions.length)];

      switch (chosen) {
        case 'PAD_KICK':
          djAudio.playKick('deckB', 1);
          handleRecordAction('player2', 'PAD', 25, '808 Kick Hit');
          break;
        case 'PAD_SNARE':
          djAudio.playSnare('deckB', 1);
          handleRecordAction('player2', 'PAD', 20, 'Snare Clap');
          break;
        case 'PAD_HAT':
          djAudio.playHiHat('deckB', Math.random() > 0.6, 1);
          handleRecordAction('player2', 'PAD', 15, 'Hat Roll');
          break;
        case 'PAD_808':
          djAudio.play808Bass('deckB', 50, 1);
          handleRecordAction('player2', 'PAD', 30, 'Deep Sub');
          break;
        case 'SCRATCH':
          djAudio.triggerScratch('deckB', 0.8 + Math.random() * 0.5, Math.random() > 0.5 ? 1 : -1);
          handleRecordAction('player2', 'SCRATCH', 35, 'Crab Scratch Cut');
          break;
        case 'DROP':
          if (Math.random() > 0.7) {
            djAudio.playVocalChant('deckB', 'drop');
            handleRecordAction('player2', 'DROP', 40, 'Vocal Drop');
          }
          break;
      }
    }, 450);

    return () => clearInterval(botInterval);
  }, [battleState.mode, battleState.status]);

  // Battle Round Countdown Timer
  useEffect(() => {
    if (battleState.mode === 'FREESTYLE' || battleState.status !== 'BATTLE_ACTIVE') return;

    const timer = setInterval(() => {
      setBattleState((prev) => {
        if (prev.timeRemainingSeconds <= 1) {
          // Check if round finishes or match ends
          if (prev.currentRound < prev.totalRounds) {
            // Next round
            const nextRound = (prev.currentRound + 1) as 1 | 2 | 3;
            // Play round gong / cheer
            djAudio.playCrowdCheer(0.8);
            return {
              ...prev,
              currentRound: nextRound,
              timeRemainingSeconds: prev.roundDurationSeconds,
              // Round 1: Turn P1, Round 2: Turn P2, Round 3: Both Clash!
              activeTurnPlayer: nextRound === 2 ? 'player2' : 'both',
            };
          } else {
            // Match Finished! Calculate Winner
            const p1Total = prev.player1Score.totalScore;
            const p2Total = prev.player2Score.totalScore;
            const winner = p1Total > p2Total ? 'player1' : p2Total > p1Total ? 'player2' : 'TIE';

            djAudio.playCrowdCheer(1.0);
            return {
              ...prev,
              status: 'MATCH_OVER',
              timeRemainingSeconds: 0,
              winner,
            };
          }
        }

        return {
          ...prev,
          timeRemainingSeconds: prev.timeRemainingSeconds - 1,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [battleState.mode, battleState.status]);

  // Action recording for score and crowd hype
  const handleRecordAction = useCallback(
    (player: 'player1' | 'player2', actionType: string, points: number, label: string) => {
      setBattleState((prev) => {
        const isP1 = player === 'player1';
        const currentScore = isP1 ? prev.player1Score : prev.player2Score;

        const newCombo = currentScore.comboCount + 1;
        const comboMultiplier = Math.min(3, 1 + Math.floor(newCombo / 5) * 0.25);
        const earned = Math.round(points * comboMultiplier);

        const updatedScore: PlayerScore = {
          ...currentScore,
          totalScore: currentScore.totalScore + earned,
          comboCount: newCombo,
          maxCombo: Math.max(currentScore.maxCombo, newCombo),
          rhythmScore:
            actionType === 'PAD' ? currentScore.rhythmScore + earned : currentScore.rhythmScore,
          scratchScore:
            actionType === 'SCRATCH' || actionType === 'BACKSPIN'
              ? currentScore.scratchScore + earned
              : currentScore.scratchScore,
          crowdCheerScore:
            actionType === 'DROP' || actionType === 'AIRHORN'
              ? currentScore.crowdCheerScore + earned
              : currentScore.crowdCheerScore,
          recentActions: [label, ...currentScore.recentActions.slice(0, 3)],
        };

        // If big combo reached, play crowd hype burst
        if (newCombo % 10 === 0) {
          djAudio.playCrowdCheer(0.6);
        }

        return {
          ...prev,
          player1Score: isP1 ? updatedScore : prev.player1Score,
          player2Score: !isP1 ? updatedScore : prev.player2Score,
        };
      });
    },
    []
  );

  // Global Keyboard shortcuts for dual DJ battles
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      djAudio.ensureContext();
      const key = e.key.toLowerCase();

      // Deck A (Player 1) Hotkeys: Q, W, E, R, A, S, D, F
      if (key === 'q') {
        djAudio.playKick('deckA');
        handleRecordAction('player1', 'PAD', 20, 'Kick Drum');
      } else if (key === 'w') {
        djAudio.playSnare('deckA');
        handleRecordAction('player1', 'PAD', 20, 'Snare Clap');
      } else if (key === 'e') {
        djAudio.playHiHat('deckA', false);
        handleRecordAction('player1', 'PAD', 15, 'Closed Hat');
      } else if (key === 'r') {
        djAudio.playHiHat('deckA', true);
        handleRecordAction('player1', 'PAD', 15, 'Open Hat');
      } else if (key === 'a') {
        djAudio.play808Bass('deckA', 55);
        handleRecordAction('player1', 'PAD', 30, '808 Sub');
      } else if (key === 's') {
        djAudio.triggerScratch('deckA', 0.9, 1);
        handleRecordAction('player1', 'SCRATCH', 30, 'Baby Scratch');
      } else if (key === 'd') {
        djAudio.playVocalChant('deckA', 'yeah');
        handleRecordAction('player1', 'VOCAL', 35, 'Yeah! Vocal');
      } else if (key === 'f') {
        djAudio.playBackspin('deckA');
        handleRecordAction('player1', 'BACKSPIN', 45, 'Backspin Brake');
      }

      // Deck B (Player 2) Hotkeys: U, I, O, P, J, K, L, ;
      else if (key === 'u') {
        djAudio.playKick('deckB');
        handleRecordAction('player2', 'PAD', 20, 'Kick Drum');
      } else if (key === 'i') {
        djAudio.playSnare('deckB');
        handleRecordAction('player2', 'PAD', 20, 'Snare Clap');
      } else if (key === 'o') {
        djAudio.playHiHat('deckB', false);
        handleRecordAction('player2', 'PAD', 15, 'Closed Hat');
      } else if (key === 'p') {
        djAudio.playHiHat('deckB', true);
        handleRecordAction('player2', 'PAD', 15, 'Open Hat');
      } else if (key === 'j') {
        djAudio.play808Bass('deckB', 50);
        handleRecordAction('player2', 'PAD', 30, '808 Sub');
      } else if (key === 'k') {
        djAudio.triggerScratch('deckB', 0.9, 1);
        handleRecordAction('player2', 'SCRATCH', 30, 'Baby Scratch');
      } else if (key === 'l') {
        djAudio.playVocalChant('deckB', 'drop');
        handleRecordAction('player2', 'DROP', 40, 'Drop Bass');
      } else if (key === ';' || key === ':') {
        djAudio.playBackspin('deckB');
        handleRecordAction('player2', 'BACKSPIN', 45, 'Backspin Brake');
      }

      // Crossfader Quick Nudges: ArrowLeft, ArrowRight, ArrowDown (center)
      else if (e.key === 'ArrowLeft') {
        setBattleState((prev) => {
          const next = Math.max(-1, prev.crossfaderPosition - 0.2);
          djAudio.updateCrossfader(next, prev.crossfaderCurve);
          return { ...prev, crossfaderPosition: next };
        });
      } else if (e.key === 'ArrowRight') {
        setBattleState((prev) => {
          const next = Math.min(1, prev.crossfaderPosition + 0.2);
          djAudio.updateCrossfader(next, prev.crossfaderCurve);
          return { ...prev, crossfaderPosition: next };
        });
      } else if (e.key === 'ArrowDown') {
        setBattleState((prev) => {
          djAudio.updateCrossfader(0, prev.crossfaderCurve);
          return { ...prev, crossfaderPosition: 0 };
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRecordAction]);

  // Crossfader Position Change
  const handleCrossfaderChange = (pos: number) => {
    djAudio.updateCrossfader(pos, battleState.crossfaderCurve);
    setBattleState((prev) => ({ ...prev, crossfaderPosition: pos }));
  };

  // Crossfader Curve Toggle (Cut vs Smooth)
  const handleCurveToggle = () => {
    const next = battleState.crossfaderCurve === 'CUT' ? 'SMOOTH' : 'CUT';
    djAudio.updateCrossfader(battleState.crossfaderPosition, next);
    setBattleState((prev) => ({ ...prev, crossfaderCurve: next }));
  };

  // Clash FX drop
  const handleClashFX = (fxType: string) => {
    djAudio.ensureContext();
    if (fxType === 'airhorn') {
      djAudio.playAirHorn();
      handleRecordAction('player1', 'AIRHORN', 35, 'Clash Air Horn!');
    } else if (fxType === 'crowd') {
      djAudio.playCrowdCheer(0.9);
      handleRecordAction('player2', 'CROWD', 35, 'Crowd Roar!');
    }
  };

  // Sync BPM
  const handleSyncDeckA = () => {
    // Sync Deck A pitch to match Deck B's effective BPM
    const targetBpm = deckB.bpm * (1 + deckB.pitch / 100);
    const requiredPitch = ((targetBpm - deckA.bpm) / deckA.bpm) * 100;
    setDeckA((prev) => ({ ...prev, pitch: requiredPitch }));
    if (deckA.isPlaying) {
      djAudio.updateLoopTempo('deckA', deckA.baseBpm, kitA.genre, requiredPitch);
    }
  };

  const handleSyncDeckB = () => {
    const targetBpm = deckA.bpm * (1 + deckA.pitch / 100);
    const requiredPitch = ((targetBpm - deckB.bpm) / deckB.bpm) * 100;
    setDeckB((prev) => ({ ...prev, pitch: requiredPitch }));
    if (deckB.isPlaying) {
      djAudio.updateLoopTempo('deckB', deckB.baseBpm, kitB.genre, requiredPitch);
    }
  };

  // Start Battle from Lobby
  const handleStartBattleFromLobby = (config: {
    mode: BattleMode;
    player1: DJProfile;
    player2: DJProfile;
    kitIdA: string;
    kitIdB: string;
    roundSeconds: number;
    slipmatA: string;
    slipmatB: string;
  }) => {
    djAudio.ensureContext();
    const newKitA = SOUND_KITS.find((k) => k.id === config.kitIdA) || SOUND_KITS[0];
    const newKitB = SOUND_KITS.find((k) => k.id === config.kitIdB) || SOUND_KITS[1];

    setDeckA((prev) => ({
      ...prev,
      bpm: newKitA.defaultBpm,
      baseBpm: newKitA.defaultBpm,
      pitch: 0,
      slipmat: config.slipmatA,
      isPlaying: false,
    }));

    setDeckB((prev) => ({
      ...prev,
      bpm: newKitB.defaultBpm,
      baseBpm: newKitB.defaultBpm,
      pitch: 0,
      slipmat: config.slipmatB,
      isPlaying: false,
    }));

    setBattleState({
      mode: config.mode,
      status: 'BATTLE_ACTIVE',
      currentRound: 1,
      totalRounds: 3,
      roundDurationSeconds: config.roundSeconds,
      timeRemainingSeconds: config.roundSeconds,
      activeTurnPlayer: config.mode === 'LOCAL_DUEL' ? 'player1' : 'both',
      player1: config.player1,
      player2: config.player2,
      player1Score: {
        rhythmScore: 0,
        scratchScore: 0,
        crowdCheerScore: 0,
        comboCount: 0,
        maxCombo: 0,
        totalScore: 0,
        hypePercentage: 50,
        recentActions: [],
      },
      player2Score: {
        rhythmScore: 0,
        scratchScore: 0,
        crowdCheerScore: 0,
        comboCount: 0,
        maxCombo: 0,
        totalScore: 0,
        hypePercentage: 50,
        recentActions: [],
      },
      crossfaderPosition: 0,
      crossfaderCurve: 'SMOOTH',
      selectedKitA: config.kitIdA,
      selectedKitB: config.kitIdB,
      winner: null,
      commentaryLog: [],
    });

    setInLobby(false);
  };

  // Rematch action
  const handleRematch = () => {
    setBattleState((prev) => ({
      ...prev,
      status: 'BATTLE_ACTIVE',
      currentRound: 1,
      timeRemainingSeconds: prev.roundDurationSeconds,
      activeTurnPlayer: prev.mode === 'LOCAL_DUEL' ? 'player1' : 'both',
      player1Score: {
        rhythmScore: 0,
        scratchScore: 0,
        crowdCheerScore: 0,
        comboCount: 0,
        maxCombo: 0,
        totalScore: 0,
        hypePercentage: 50,
        recentActions: [],
      },
      player2Score: {
        rhythmScore: 0,
        scratchScore: 0,
        crowdCheerScore: 0,
        comboCount: 0,
        maxCombo: 0,
        totalScore: 0,
        hypePercentage: 50,
        recentActions: [],
      },
      winner: null,
    }));
  };

  // Quick switch modes from header
  const handleNavClick = (mode: BattleMode | 'HOW_TO') => {
    if (mode === 'HOW_TO') {
      setShowHowToPlay(true);
      return;
    }
    setBattleState((prev) => ({
      ...prev,
      mode,
      status: 'BATTLE_ACTIVE',
      currentRound: 1,
      timeRemainingSeconds: prev.roundDurationSeconds,
      activeTurnPlayer: mode === 'LOCAL_DUEL' ? 'player1' : 'both',
    }));
    setInLobby(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between selection:bg-amber-500 selection:text-neutral-950">
      {/* ========================================================
          TOP BAR CONTRACT: [Brand Wordmark] - [4-5 Links] - [1 CTA]
          ======================================================== */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-white/5 bg-neutral-950/90 backdrop-blur-md sticky top-0 z-40">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => setInLobby(false)}
          className="text-lg font-black tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
        >
          <Disc className="w-5 h-5 text-amber-500 fill-current animate-spin-slow" />
          <span>CROSSFADER BATTLE</span>
        </button>

        {/* Zone 2: 4-5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
          <button
            onClick={() => {
              setInLobby(false);
              setBattleState((p) => ({ ...p, mode: 'LOCAL_DUEL' }));
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              !inLobby && battleState.mode === 'LOCAL_DUEL' ? 'text-white font-bold' : ''
            }`}
          >
            2-Player Dual
          </button>
          <button
            onClick={() => {
              setInLobby(false);
              setBattleState((p) => ({ ...p, mode: 'BOT_BATTLE', player2: BOT_DJS[0] }));
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              !inLobby && battleState.mode === 'BOT_BATTLE' ? 'text-white font-bold' : ''
            }`}
          >
            Rival Bots
          </button>
          <button
            onClick={() => {
              setInLobby(false);
              setBattleState((p) => ({ ...p, mode: 'FREESTYLE' }));
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              !inLobby && battleState.mode === 'FREESTYLE' ? 'text-white font-bold' : ''
            }`}
          >
            Freestyle Jam
          </button>
          <button
            onClick={() => setShowHowToPlay(true)}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Rules & Hotkeys
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {inLobby ? (
            <button
              onClick={() => setInLobby(false)}
              className="px-4 py-2 text-xs font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-md shadow-amber-500/20 active:scale-95"
            >
              Resume Clash
            </button>
          ) : (
            <button
              onClick={() => setInLobby(true)}
              className="px-4 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer active:scale-95"
            >
              Match Settings
            </button>
          )}
        </div>
      </header>

      {/* Main App Content Viewport */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto p-4 md:p-6 flex flex-col justify-between">
        {inLobby ? (
          /* Match Setup Lobby */
          <BattleLobby
            onStartBattle={handleStartBattleFromLobby}
            onOpenHowToPlay={() => setShowHowToPlay(true)}
          />
        ) : (
          /* Live DJ Battle Arena */
          <div className="flex flex-col justify-between h-full">
            {/* Top Crowd Hype & Scoreboard */}
            <CrowdMeter battleState={battleState} />

            {/* Battle Stage: Deck A - Center Mixer - Deck B */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch my-2">
              {/* Deck A (Player 1) */}
              <div className="lg:col-span-5 flex flex-col justify-between">
                <TurntableDeck
                  deck={deckA}
                  profile={battleState.player1}
                  soundKit={kitA}
                  isCurrentTurn={
                    battleState.activeTurnPlayer === 'player1' ||
                    battleState.activeTurnPlayer === 'both'
                  }
                  onUpdateDeck={(updates) => setDeckA((prev) => ({ ...prev, ...updates }))}
                  onAction={(actionType, pts, label) =>
                    handleRecordAction('player1', actionType, pts, label)
                  }
                  onSyncTempo={handleSyncDeckA}
                />
              </div>

              {/* Central Battle Mixer & Crossfader */}
              <div className="lg:col-span-2 flex flex-col justify-center">
                <BattleMixer
                  crossfaderPos={battleState.crossfaderPosition}
                  crossfaderCurve={battleState.crossfaderCurve}
                  volumeA={deckA.volume}
                  volumeB={deckB.volume}
                  masterVolume={masterVolume}
                  onCrossfaderChange={handleCrossfaderChange}
                  onCurveToggle={handleCurveToggle}
                  onVolumeAChange={(v) => setDeckA((prev) => ({ ...prev, volume: v }))}
                  onVolumeBChange={(v) => setDeckB((prev) => ({ ...prev, volume: v }))}
                  onMasterVolumeChange={(v) => {
                    setMasterVolume(v);
                    djAudio.setMasterVolume(v);
                  }}
                  onClashFX={handleClashFX}
                />
              </div>

              {/* Deck B (Player 2 or Bot) */}
              <div className="lg:col-span-5 flex flex-col justify-between">
                <TurntableDeck
                  deck={deckB}
                  profile={battleState.player2}
                  soundKit={kitB}
                  isCurrentTurn={
                    battleState.activeTurnPlayer === 'player2' ||
                    battleState.activeTurnPlayer === 'both'
                  }
                  onUpdateDeck={(updates) => setDeckB((prev) => ({ ...prev, ...updates }))}
                  onAction={(actionType, pts, label) =>
                    handleRecordAction('player2', actionType, pts, label)
                  }
                  onSyncTempo={handleSyncDeckB}
                />
              </div>
            </div>

            {/* Quick Battle Pro Tips Bar */}
            <div className="mt-4 p-3 rounded-xl bg-neutral-900/60 border border-white/5 flex flex-wrap items-center justify-between text-xs text-neutral-400 gap-2">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  <strong>Pro Tip:</strong> Click & drag vinyl to scratch, tap pads for drum combos, and use Arrow keys to cut the crossfader!
                </span>
              </div>
              <div className="flex items-center gap-3 text-neutral-400 font-mono-numbers">
                <span>P1: Q-W-E-R / A-S-D-F</span>
                <span>·</span>
                <span>P2: U-I-O-P / J-K-L-;</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-white/5 py-4 px-6 text-center text-xs text-neutral-400 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-mono-numbers">
          <span>CROSSFADER BATTLE ARENA</span>
          <span>·</span>
          <span>Web Audio Turntable Synthesis</span>
        </div>
        <div className="flex items-center gap-4 text-neutral-400">
          <button
            onClick={() => setShowHowToPlay(true)}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Controls & Hotkeys
          </button>
          <span>·</span>
          <button
            onClick={() => setInLobby(true)}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Change Sound Kits
          </button>
        </div>
      </footer>

      {/* Victory Celebration Modal */}
      {battleState.status === 'MATCH_OVER' && (
        <BattleVictoryModal
          battleState={battleState}
          onRematch={handleRematch}
          onExitToLobby={() => setInLobby(true)}
        />
      )}

      {/* How to Play & Hotkeys Modal */}
      {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}
    </div>
  );
}
