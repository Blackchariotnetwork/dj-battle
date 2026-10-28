export type BattleMode = 'LOCAL_DUEL' | 'BOT_BATTLE' | 'FREESTYLE';

export type BattleRound = 1 | 2 | 3;

export interface DJProfile {
  id: string;
  name: string;
  title: string;
  tagline: string;
  avatarSeed: string; // for stylized procedural SVG avatar
  accentColor: string; // e.g. '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6'
  genre: string;
  skillLevel?: 'Rookie' | 'Pro' | 'Grandmaster';
  signatureMove: string;
}

export interface SoundKit {
  id: string;
  name: string;
  genre: string;
  defaultBpm: number;
  description: string;
  pads: {
    id: string;
    label: string;
    category: 'kick' | 'snare' | 'hihat' | 'bass' | 'vocal' | 'scratch' | 'fx' | 'synth';
    keyLabelP1: string;
    keyLabelP2: string;
  }[];
}

export interface DeckState {
  deckId: 'deckA' | 'deckB';
  isPlaying: boolean;
  bpm: number;
  baseBpm: number;
  pitch: number; // -16 to +16 percentage
  volume: number; // 0 to 1
  filter: number; // -100 (LPF) to 0 (neutral) to +100 (HPF)
  eqLow: number; // -24 to +6 dB
  eqMid: number; // -24 to +6 dB
  eqHigh: number; // -24 to +6 dB
  isCueing: boolean;
  isScratching: boolean;
  scratchAngle: number;
  scratchVelocity: number;
  loopActive: boolean;
  slipmat: string;
  activeHotCue: number | null;
  lastPadHit: string | null;
  activeRoll: number | null; // 4 (1/4), 8 (1/8), 16 (1/16)
}

export interface PlayerScore {
  rhythmScore: number;
  scratchScore: number;
  crowdCheerScore: number;
  comboCount: number;
  maxCombo: number;
  totalScore: number;
  hypePercentage: number; // 0 to 100
  recentActions: string[];
}

export interface BattleState {
  mode: BattleMode;
  status: 'LOBBY' | 'COUNTDOWN' | 'BATTLE_ACTIVE' | 'ROUND_BREAK' | 'MATCH_OVER';
  currentRound: BattleRound;
  totalRounds: number;
  roundDurationSeconds: number;
  timeRemainingSeconds: number;
  activeTurnPlayer: 'player1' | 'player2' | 'both';
  player1: DJProfile;
  player2: DJProfile;
  player1Score: PlayerScore;
  player2Score: PlayerScore;
  crossfaderPosition: number; // -1 (Deck A) to 0 (Center) to 1 (Deck B)
  crossfaderCurve: 'CUT' | 'SMOOTH';
  selectedKitA: string;
  selectedKitB: string;
  winner: 'player1' | 'player2' | 'TIE' | null;
  commentaryLog: {
    id: string;
    speaker: string;
    message: string;
    timestamp: number;
    type: 'drop' | 'scratch' | 'combo' | 'round' | 'crowd';
  }[];
}
