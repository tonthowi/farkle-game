import type { GameMode } from './game';

export interface MatchPlayer {
  name: string;
  avatar: string;
  score: number;
  isHuman: boolean;
}

export interface MatchRecord {
  id: string;
  date: string;        // ISO string
  mode: GameMode;
  players: MatchPlayer[];
  winnerName: string;
  durationSeconds: number;
  targetScore: number;
}
