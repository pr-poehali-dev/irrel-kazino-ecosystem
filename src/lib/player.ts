import { useSyncExternalStore } from 'react';
import func2url from '../../backend/func2url.json';

const AUTH_URL = func2url.auth;
const GAME_URL = func2url.game;
const TOKEN_KEY = 'irrelevant_kazino_token';

export type GameKey = 'miner' | 'slots' | 'crash' | 'case' | 'minedrop';

export interface PlayerState {
  id: number;
  email: string;
  name: string;
  balance: number;
  xp: number;
  level: number;
  totalBets: number;
  totalWins: number;
  totalWagered: number;
  biggestWin: number;
  role: 'user' | 'admin';
}

let user: PlayerState | null = null;
let loading = true;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(t: string | null) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const t = getToken();
  return t
    ? { 'X-Auth-Token': t, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

export function xpForLevel(level: number) {
  return level * 500;
}

export async function fetchMe() {
  const t = getToken();
  if (!t) {
    user = null;
    loading = false;
    emit();
    return;
  }
  try {
    const res = await fetch(`${AUTH_URL}?action=me`, { headers: authHeaders() });
    if (res.ok) {
      const data = await res.json();
      user = data.user;
    } else {
      setToken(null);
      user = null;
    }
  } catch {
    user = null;
  }
  loading = false;
  emit();
}

export async function register(email: string, password: string, name: string) {
  const res = await fetch(`${AUTH_URL}?action=register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка регистрации');
  setToken(data.token);
  user = data.user;
  loading = false;
  emit();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${AUTH_URL}?action=login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка входа');
  setToken(data.token);
  user = data.user;
  loading = false;
  emit();
}

export function logout() {
  setToken(null);
  user = null;
  emit();
}

async function gameAction(action: string, body: Record<string, unknown>): Promise<PlayerState> {
  const res = await fetch(`${GAME_URL}?action=${action}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка');
  if (data.user) {
    user = data.user;
    emit();
  }
  return data.user;
}

export function resolveBet(bet: number, payout: number) {
  return gameAction('bet', { bet, payout });
}

export function purchase(amount: number) {
  return gameAction('purchase', { amount });
}

export function claimReward(amount: number) {
  return gameAction('claim', { amount });
}

export async function fetchLeaderboard(): Promise<{ name: string; score: number }[]> {
  const res = await fetch(`${GAME_URL}?action=leaderboard`);
  const data = await res.json();
  return data.board || [];
}

export async function adminUsers() {
  const res = await fetch(`${GAME_URL}?action=admin_users`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка');
  return data.users as {
    id: number; email: string; name: string; role: string; balance: number; totalBets: number;
  }[];
}

export async function adminGrant(userId: number, amount: number) {
  await fetch(`${GAME_URL}?action=admin_grant`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify({ userId, amount }),
  });
}

export async function adminSetRole(userId: number, role: 'user' | 'admin') {
  await fetch(`${GAME_URL}?action=admin_role`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify({ userId, role }),
  });
}

export function usePlayer(): PlayerState | null {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => user,
    () => user,
  );
}

export function useAuthLoading(): boolean {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => loading,
    () => loading,
  );
}

export const GAME_LABELS: Record<GameKey, string> = {
  miner: 'Miner',
  slots: '777 Slots',
  crash: 'Crash',
  case: 'Case',
  minedrop: 'Mine Drop',
};
