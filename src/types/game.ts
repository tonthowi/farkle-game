export type DieValue = 1 | 2 | 3 | 4 | 5 | 6;

export interface Die {
  id: number;
  value: DieValue;
  isSelected: boolean;  // chosen by player for scoring this roll
  isLocked: boolean;    // banked from a prior roll in the same turn
  isRolling: boolean;   // animation state
}

export type TurnPhase =
  | 'idle'        // waiting for player to roll
  | 'rolling'     // dice animation in progress
  | 'selecting'   // player picking scoring dice
  | 'farkled'     // bust — no scoring dice in roll
  | 'hot-dice'    // all dice scored, must roll all 6 again
  | 'game-over';  // winner determined

export type GameMode = 'vs-computer' | 'local-multiplayer';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface PlayerState {
  id: string;
  name: string;
  avatar: string;
  totalScore: number;
  isHuman: boolean;
}

export interface GameState {
  phase: TurnPhase;
  currentPlayerIndex: number;
  players: PlayerState[];
  dice: Die[];
  /** Points accumulated and locked in so far this turn */
  turnScore: number;
  /** Score of currently highlighted/selected dice (not yet locked) */
  selectedScore: number;
  rollCount: number;
  mode: GameMode;
  difficulty?: Difficulty;
  targetScore: number;
  winner: number | null;
  startTime: number;
  /** Show the "pass device" prompt in local multiplayer */
  showPassDevice: boolean;
}

export interface ScoreResult {
  score: number;
  label: string;
}

export type GameAction =
  | { type: 'ROLL' }
  | { type: 'ROLL_MORE' }
  | { type: 'ROLL_COMPLETE' }
  | { type: 'SELECT_DIE'; dieId: number }
  | { type: 'BANK' }
  | { type: 'CONFIRM_FARKLE' }
  | { type: 'CONFIRM_HOT_DICE' }
  | { type: 'CONFIRM_PASS' }
  | { type: 'NEW_GAME'; payload: NewGamePayload };

export interface NewGamePayload {
  mode: GameMode;
  difficulty?: Difficulty;
  players: { name: string; avatar: string; isHuman: boolean }[];
  targetScore: number;
}
