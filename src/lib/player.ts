import { useSyncExternalStore } from 'react';

export type GameKey = 'miner' | 'slots' | 'crash' | 'case' | 'minedrop';

export interface HistoryEntry {
  id: string;
  game: GameKey | 'purchase';
  bet: number;
  payout: number;
  time: number;
}

export interface PlayerState {
  name: string;
  balance: number;
  xp: number;
  level: number;
  totalBets: number;
  totalWins: number;
  totalWagered: number;
  biggestWin: number;
  history: HistoryEntry[];
  role: 'user' | 'admin';
}

const STORAGE_KEY = 'irrelevant_kazino_player';

const DEFAULT_STATE: PlayerState = {
  name: 'Игрок',
  balance: 1000,
  xp: 0,
  level: 1,
  totalBets: 0,
  totalWins: 0,
  totalWagered: 0,
  biggestWin: 0,
  history: [],
  role: 'admin',
};

function load(): PlayerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

let state: PlayerState = load();
const listeners = new Set<() => void>();

function emit() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export function xpForLevel(level: number) {
  return level * 500;
}

function applyXp(s: PlayerState, gained: number): PlayerState {
  let xp = s.xp + gained;
  let level = s.level;
  while (xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level += 1;
  }
  return { ...s, xp, level };
}

export function setState(updater: (s: PlayerState) => PlayerState) {
  state = updater(state);
  emit();
}

export function resolveGame(game: GameKey, bet: number, payout: number) {
  setState((s) => {
    const win = payout > 0;
    let next: PlayerState = {
      ...s,
      balance: Math.round((s.balance + payout - bet) * 100) / 100,
      totalBets: s.totalBets + 1,
      totalWins: s.totalWins + (win ? 1 : 0),
      totalWagered: s.totalWagered + bet,
      biggestWin: Math.max(s.biggestWin, payout),
      history: [
        { id: crypto.randomUUID(), game, bet, payout, time: Date.now() },
        ...s.history,
      ].slice(0, 50),
    };
    next = applyXp(next, Math.max(1, Math.round(bet / 10)));
    return next;
  });
}

export function addBalance(amount: number) {
  setState((s) => ({
    ...s,
    balance: Math.round((s.balance + amount) * 100) / 100,
    history: [
      { id: crypto.randomUUID(), game: 'purchase', bet: 0, payout: amount, time: Date.now() },
      ...s.history,
    ].slice(0, 50),
  }));
}

export function usePlayer(): PlayerState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state,
  );
}

export const GAME_LABELS: Record<GameKey | 'purchase', string> = {
  miner: 'Miner',
  slots: '777 Slots',
  crash: 'Crash',
  case: 'Case',
  minedrop: 'Mine Drop',
  purchase: 'Покупка Plazma',
};
