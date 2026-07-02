import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  usePlayer, xpForLevel, claimReward, fetchLeaderboard,
  adminUsers, adminGrant, adminSetRole, type GameKey,
} from '@/lib/player';
import { toast } from 'sonner';

const GAMES: { key: GameKey; label: string; emoji: string; tag: string }[] = [
  { key: 'miner', label: 'Miner', emoji: '💣', tag: 'Логика' },
  { key: 'slots', label: '777 Slots', emoji: '🎰', tag: 'Слоты' },
  { key: 'crash', label: 'Crash', emoji: '🚀', tag: 'Множитель' },
  { key: 'case', label: 'Case', emoji: '📦', tag: 'Кейсы' },
  { key: 'minedrop', label: 'Mine Drop', emoji: '🔻', tag: 'Plinko' },
];

export function Catalog({ onPlay }: { onPlay: (g: GameKey) => void }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('Все');
  const tags = ['Все', ...new Set(GAMES.map((g) => g.tag))];
  const list = GAMES.filter(
    (g) => (filter === 'Все' || g.tag === filter) && g.label.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Icon name="Search" size={18} className="absolute left-3 top-3 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск игр..."
            className="w-full rounded-xl bg-secondary py-2.5 pl-10 pr-3 outline-none focus:neon-border" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {tags.map((t) => (
            <button key={t} onClick={() => setFilter(t)}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm transition ${filter === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>{t}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {list.map((g, i) => (
          <button key={g.key} onClick={() => onPlay(g.key)}
            style={{ animationDelay: `${i * 60}ms` }}
            className="group animate-float-up rounded-2xl glass p-5 text-left transition hover:neon-border hover:-translate-y-1">
            <div className="mb-3 text-4xl">{g.emoji}</div>
            <div className="font-display text-lg">{g.label}</div>
            <div className="text-xs text-muted-foreground">{g.tag}</div>
            <div className="mt-3 flex items-center gap-1 text-xs text-accent opacity-0 transition group-hover:opacity-100">
              Играть <Icon name="ArrowRight" size={12} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function Profile() {
  const p = usePlayer();
  if (!p) return null;
  const winrate = p.totalBets ? Math.round((p.totalWins / p.totalBets) * 100) : 0;
  const stats = [
    { label: 'Ставок', value: p.totalBets, icon: 'Dices' },
    { label: 'Побед', value: p.totalWins, icon: 'Trophy' },
    { label: 'Винрейт', value: `${winrate}%`, icon: 'Percent' },
    { label: 'Оборот', value: `${Math.round(p.totalWagered)}`, icon: 'Coins' },
    { label: 'Макс. выигрыш', value: Math.round(p.biggestWin), icon: 'Flame' },
    { label: 'Уровень', value: p.level, icon: 'Star' },
  ];
  return (
    <div className="space-y-6">
      <div className="rounded-2xl glass p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-3xl neon-border">🚀</div>
          <div className="flex-1">
            <div className="font-display text-2xl">{p.name}</div>
            <div className="text-sm text-muted-foreground">{p.email}</div>
            <div className="text-sm text-muted-foreground">Уровень {p.level} · {p.role === 'admin' ? 'Администратор' : 'Игрок'}</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>XP</span><span>{p.xp} / {xpForLevel(p.level)}</span>
          </div>
          <Progress value={(p.xp / xpForLevel(p.level)) * 100} className="h-2" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl glass p-4">
            <Icon name={s.icon} size={18} className="mb-2 text-accent" />
            <div className="font-display text-2xl">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Tournaments() {
  const p = usePlayer();
  const [board, setBoard] = useState<{ name: string; score: number }[]>([]);
  useEffect(() => { fetchLeaderboard().then(setBoard); }, []);
  return (
    <div className="space-y-5">
      <div className="rounded-2xl glass p-6">
        <div className="flex items-center gap-3">
          <Icon name="Trophy" size={28} className="text-accent" />
          <div>
            <div className="font-display text-xl">Еженедельный турнир</div>
            <div className="text-sm text-muted-foreground">Рейтинг по обороту Plazma · обновляется в реальном времени</div>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {board.length === 0 && <p className="text-sm text-muted-foreground">Пока нет данных — сыграйте первую партию.</p>}
        {board.map((b, i) => {
          const isMe = p && b.name === p.name;
          return (
            <div key={i} className={`flex items-center gap-4 rounded-xl px-4 py-3 ${isMe ? 'glass neon-border' : 'glass'}`}>
              <span className={`w-8 font-display text-lg ${i < 3 ? 'text-accent neon-text-cyan' : 'text-muted-foreground'}`}>#{i + 1}</span>
              <span className="flex-1">{b.name}{isMe ? ' (вы)' : ''}</span>
              <span className="font-display">{Math.round(b.score).toLocaleString()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const QUESTS = [
  { id: 1, text: 'Сделать 5 ставок', goal: 5, reward: 100, field: 'totalBets' as const },
  { id: 2, text: 'Одержать 3 победы', goal: 3, reward: 150, field: 'totalWins' as const },
  { id: 3, text: 'Наиграть оборот 500', goal: 500, reward: 250, field: 'totalWagered' as const },
];

export function Quests() {
  const p = usePlayer();
  const [claimed, setClaimed] = useState<number[]>([]);
  if (!p) return null;
  const claim = async (id: number, reward: number) => {
    await claimReward(reward);
    setClaimed((c) => [...c, id]);
    toast.success(`Награда получена: +${reward} Plazma`);
  };
  return (
    <div className="space-y-4">
      <h3 className="font-display text-xl">Ежедневные задания</h3>
      {QUESTS.map((q) => {
        const cur = Math.min(p[q.field], q.goal);
        const done = cur >= q.goal;
        const isClaimed = claimed.includes(q.id);
        return (
          <div key={q.id} className="rounded-2xl glass p-5">
            <div className="mb-2 flex items-center justify-between">
              <span>{q.text}</span>
              <span className="text-sm text-accent">+{q.reward} Plazma</span>
            </div>
            <Progress value={(cur / q.goal) * 100} className="mb-3 h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{Math.round(cur)} / {q.goal}</span>
              <Button size="sm" disabled={!done || isClaimed} onClick={() => claim(q.id, q.reward)}>
                {isClaimed ? 'Получено' : 'Забрать'}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const VIP_TIERS = [
  { name: 'Bronze', need: 0, perk: 'Кешбэк 1%', emoji: '🥉' },
  { name: 'Silver', need: 3, perk: 'Кешбэк 3% · бонус кейс', emoji: '🥈' },
  { name: 'Gold', need: 6, perk: 'Кешбэк 5% · турниры', emoji: '🥇' },
  { name: 'Diamond', need: 10, perk: 'Кешбэк 8% · персональный менеджер', emoji: '💎' },
  { name: 'Plazma', need: 15, perk: 'Кешбэк 12% · эксклюзив', emoji: '🚀' },
];

export function Vip() {
  const p = usePlayer();
  if (!p) return null;
  return (
    <div className="space-y-4">
      <h3 className="font-display text-xl">VIP-уровни и лояльность</h3>
      {VIP_TIERS.map((t) => {
        const active = p.level >= t.need;
        return (
          <div key={t.name} className={`flex items-center gap-4 rounded-2xl p-5 ${active ? 'glass neon-border' : 'glass opacity-60'}`}>
            <div className="text-3xl">{t.emoji}</div>
            <div className="flex-1">
              <div className="font-display text-lg">{t.name}</div>
              <div className="text-sm text-muted-foreground">{t.perk}</div>
            </div>
            <div className="text-xs text-muted-foreground">{active ? 'Открыт' : `Ур. ${t.need}`}</div>
          </div>
        );
      })}
    </div>
  );
}

type AdminUser = { id: number; email: string; name: string; role: string; balance: number; totalBets: number };

export function Admin() {
  const p = usePlayer();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [grantAmount, setGrantAmount] = useState('');

  const reload = () => adminUsers().then(setUsers).catch(() => {});
  useEffect(() => { if (p?.role === 'admin') reload(); }, [p?.role]);

  if (!p || p.role !== 'admin') {
    return <div className="rounded-2xl glass p-8 text-center text-muted-foreground">Доступ только для администраторов.</div>;
  }

  const grant = async (id: number) => {
    const amt = +grantAmount || 0;
    if (!amt) return toast.error('Введите сумму');
    await adminGrant(id, amt);
    toast.success(`Начислено ${amt} Plazma`);
    reload();
  };

  const toggleRole = async (u: AdminUser) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    await adminSetRole(u.id, newRole);
    toast.success(newRole === 'admin' ? 'Выданы права админа' : 'Права сняты');
    reload();
  };

  return (
    <div className="space-y-5">
      <h3 className="font-display text-xl">Административная панель</h3>
      <div className="rounded-2xl glass p-5">
        <label className="mb-3 block text-sm text-muted-foreground">
          Сумма для начисления (Plazma)
          <input type="number" value={grantAmount} onChange={(e) => setGrantAmount(e.target.value)}
            placeholder="Например 500"
            className="mt-1 w-full rounded-lg bg-secondary px-3 py-2 outline-none" />
        </label>
        <p className="text-xs text-muted-foreground">Нажмите «Начислить» напротив игрока, чтобы пополнить его баланс.</p>
      </div>
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center gap-3 rounded-xl glass px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="truncate font-display">{u.name}
                {u.role === 'admin' && <span className="ml-2 rounded bg-primary/30 px-2 py-0.5 text-xs text-accent">admin</span>}
              </div>
              <div className="truncate text-xs text-muted-foreground">{u.email} · {Math.round(u.balance)} Plazma · {u.totalBets} ставок</div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => grant(u.id)}>Начислить</Button>
            <Button size="sm" variant="secondary" onClick={() => toggleRole(u)}>
              {u.role === 'admin' ? 'Снять админа' : 'Сделать админом'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
