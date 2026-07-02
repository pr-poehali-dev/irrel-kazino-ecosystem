import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  usePlayer, setState, addBalance, xpForLevel, GAME_LABELS, type GameKey,
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
  const winrate = p.totalBets ? Math.round((p.totalWins / p.totalBets) * 100) : 0;
  const stats = [
    { label: 'Ставок', value: p.totalBets, icon: 'Dices' },
    { label: 'Побед', value: p.totalWins, icon: 'Trophy' },
    { label: 'Винрейт', value: `${winrate}%`, icon: 'Percent' },
    { label: 'Оборот', value: `${p.totalWagered}`, icon: 'Coins' },
    { label: 'Макс. выигрыш', value: p.biggestWin, icon: 'Flame' },
    { label: 'Уровень', value: p.level, icon: 'Star' },
  ];
  return (
    <div className="space-y-6">
      <div className="rounded-2xl glass p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-3xl neon-border">🚀</div>
          <div className="flex-1">
            <div className="font-display text-2xl">{p.name}</div>
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
      <div>
        <h3 className="mb-3 font-display text-xl">История операций</h3>
        <div className="space-y-2">
          {p.history.length === 0 && <p className="text-sm text-muted-foreground">Пока пусто — сыграйте первую партию.</p>}
          {p.history.slice(0, 12).map((h) => {
            const net = h.payout - h.bet;
            return (
              <div key={h.id} className="flex items-center justify-between rounded-xl glass px-4 py-2.5 text-sm">
                <span>{GAME_LABELS[h.game]}</span>
                <span className={net > 0 ? 'text-accent' : net < 0 ? 'text-destructive' : 'text-muted-foreground'}>
                  {net > 0 ? '+' : ''}{net} Plazma
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const BOTS = [
  { name: 'NeoStorm', score: 184200 }, { name: 'PlazmaKing', score: 152800 },
  { name: 'CyberFox', score: 98400 }, { name: 'VoidRunner', score: 71200 },
  { name: 'GlitchQueen', score: 54600 },
];

export function Tournaments() {
  const p = usePlayer();
  const board = [...BOTS, { name: p.name + ' (вы)', score: p.totalWagered }]
    .sort((a, b) => b.score - a.score);
  return (
    <div className="space-y-5">
      <div className="rounded-2xl glass p-6">
        <div className="flex items-center gap-3">
          <Icon name="Trophy" size={28} className="text-accent" />
          <div>
            <div className="font-display text-xl">Еженедельный турнир</div>
            <div className="text-sm text-muted-foreground">Призовой фонд 500 000 Plazma · осталось 3 дня</div>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {board.map((b, i) => (
          <div key={b.name} className={`flex items-center gap-4 rounded-xl px-4 py-3 ${b.name.includes('(вы)') ? 'glass neon-border' : 'glass'}`}>
            <span className={`w-8 font-display text-lg ${i < 3 ? 'text-accent neon-text-cyan' : 'text-muted-foreground'}`}>#{i + 1}</span>
            <span className="flex-1">{b.name}</span>
            <span className="font-display">{b.score.toLocaleString()}</span>
          </div>
        ))}
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
  const claim = (id: number, reward: number) => {
    addBalance(reward);
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
              <span>{cur} / {q.goal}</span>
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

export function Admin() {
  const p = usePlayer();
  const [grant, setGrant] = useState('');
  if (p.role !== 'admin') {
    return <div className="rounded-2xl glass p-8 text-center text-muted-foreground">Доступ только для администраторов.</div>;
  }
  return (
    <div className="space-y-5">
      <h3 className="font-display text-xl">Административная панель</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: 'Всего ставок', v: p.totalBets }, { l: 'Оборот', v: p.totalWagered },
          { l: 'Баланс', v: p.balance }, { l: 'Уровень', v: p.level },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl glass p-4">
            <div className="font-display text-2xl text-accent">{s.v}</div>
            <div className="text-xs text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl glass p-5 space-y-3">
        <div className="font-display">Начислить Plazma игроку</div>
        <div className="flex gap-2">
          <input placeholder="Сумма" type="number"
            className="flex-1 rounded-lg bg-secondary px-3 py-2 outline-none"
            onChange={(e) => setGrant(e.target.value)} />
          <Button onClick={() => { addBalance(+grant || 0); toast.success('Начислено'); }}>Начислить</Button>
        </div>
      </div>
      <div className="rounded-2xl glass p-5 space-y-3">
        <div className="font-display">Управление ролью</div>
        <p className="text-sm text-muted-foreground">Текущая роль: {p.role}. Вы можете выдать/забрать права администратора.</p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => { setState((s) => ({ ...s, role: 'admin' })); toast.success('Права администратора выданы'); }}>Сделать админом</Button>
          <Button variant="secondary" onClick={() => { setState((s) => ({ ...s, role: 'user' })); toast('Права сняты'); }}>Снять права</Button>
        </div>
      </div>
    </div>
  );
}
