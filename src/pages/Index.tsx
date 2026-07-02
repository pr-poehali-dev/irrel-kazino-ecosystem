import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  usePlayer, useAuthLoading, fetchMe, logout, purchase, type GameKey,
} from '@/lib/player';
import GameDialog from '@/components/GameDialog';
import Auth from '@/components/Auth';
import { Catalog, Profile, Tournaments, Quests, Vip, Admin } from '@/components/sections/Sections';
import { toast } from 'sonner';

type Tab = 'home' | 'catalog' | 'profile' | 'tournaments' | 'quests' | 'vip' | 'admin';

const NAV: { key: Tab; label: string; icon: string; adminOnly?: boolean }[] = [
  { key: 'home', label: 'Главная', icon: 'Home' },
  { key: 'catalog', label: 'Игры', icon: 'Gamepad2' },
  { key: 'tournaments', label: 'Турниры', icon: 'Trophy' },
  { key: 'quests', label: 'Задания', icon: 'Target' },
  { key: 'vip', label: 'VIP', icon: 'Crown' },
  { key: 'profile', label: 'Профиль', icon: 'User' },
  { key: 'admin', label: 'Админка', icon: 'Shield', adminOnly: true },
];

const SHOP = [
  { plazma: 500, price: '99 ₽' },
  { plazma: 1500, price: '249 ₽' },
  { plazma: 5000, price: '699 ₽' },
  { plazma: 15000, price: '1 799 ₽' },
];

export default function Index() {
  const p = usePlayer();
  const authLoading = useAuthLoading();
  const [tab, setTab] = useState<Tab>('home');
  const [game, setGame] = useState<GameKey | null>(null);
  const [shop, setShop] = useState(false);

  useEffect(() => { fetchMe(); }, []);

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Загрузка...</div>;
  }
  if (!p) return <Auth />;

  const nav = NAV.filter((n) => !n.adminOnly || p.role === 'admin');

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 glass">
        <div className="container flex items-center justify-between gap-4 py-3">
          <button onClick={() => setTab('home')} className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-lg neon-border">🚀</div>
            <span className="hidden font-display text-lg neon-text sm:block">IRRELEVANT KAZINO</span>
          </button>
          <div className="flex items-center gap-3">
            <button onClick={() => setShop(true)}
              className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 transition hover:neon-border">
              <span className="text-lg">💠</span>
              <span className="font-display text-accent">{p.balance.toLocaleString()}</span>
              <Icon name="Plus" size={14} className="text-muted-foreground" />
            </button>
            <button onClick={logout} title="Выйти"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary transition hover:text-destructive">
              <Icon name="LogOut" size={16} />
            </button>
          </div>
        </div>
      </header>

      <nav className="sticky top-[60px] z-20 border-b border-border/50 bg-background/60 backdrop-blur">
        <div className="container flex gap-1 overflow-x-auto py-2">
          {nav.map((n) => (
            <button key={n.key} onClick={() => setTab(n.key)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm transition
                ${tab === n.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <Icon name={n.icon} size={16} />{n.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="container py-6 pb-20">
        {tab === 'home' && <Home onPlay={setGame} onShop={() => setShop(true)} />}
        {tab === 'catalog' && <Catalog onPlay={setGame} />}
        {tab === 'profile' && <Profile />}
        {tab === 'tournaments' && <Tournaments />}
        {tab === 'quests' && <Quests />}
        {tab === 'vip' && <Vip />}
        {tab === 'admin' && <Admin />}
      </main>

      <GameDialog game={game} onClose={() => setGame(null)} />

      <Dialog open={shop} onOpenChange={setShop}>
        <DialogContent className="glass max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl neon-text">Купить Plazma Coin</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {SHOP.map((s) => (
              <button key={s.plazma} onClick={async () => { await purchase(s.plazma); toast.success(`+${s.plazma} Plazma`); setShop(false); }}
                className="rounded-2xl glass p-4 text-center transition hover:neon-border hover:-translate-y-1">
                <div className="text-3xl">💠</div>
                <div className="font-display text-xl text-accent">{s.plazma.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">{s.price}</div>
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Обмен и вывод Plazma — в нашем Telegram-чате (ссылка скоро появится).
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Home({ onPlay, onShop }: { onPlay: (g: GameKey) => void; onShop: () => void }) {
  const games: { key: GameKey; label: string; emoji: string }[] = [
    { key: 'miner', label: 'Miner', emoji: '💣' },
    { key: 'slots', label: '777 Slots', emoji: '🎰' },
    { key: 'crash', label: 'Crash', emoji: '🚀' },
    { key: 'case', label: 'Case', emoji: '📦' },
    { key: 'minedrop', label: 'Mine Drop', emoji: '🔻' },
  ];
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl glass grid-bg p-8 sm:p-12">
        <div className="relative z-10 max-w-xl animate-float-up">
          <div className="mb-3 inline-block rounded-full bg-primary/20 px-3 py-1 text-xs text-accent">
            Единая игровая экосистема
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight neon-text sm:text-5xl">
            IRRELEVANT KAZINO
          </h1>
          <p className="mt-3 text-muted-foreground">
            Играй, зарабатывай XP и поднимайся в рейтинге на валюте <span className="text-accent">Plazma Coin</span>.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => onPlay('crash')} className="h-11 font-display">
              <Icon name="Play" size={18} className="mr-2" /> Играть сейчас
            </Button>
            <Button variant="secondary" onClick={onShop} className="h-11 font-display">
              <Icon name="Wallet" size={18} className="mr-2" /> Пополнить баланс
            </Button>
          </div>
        </div>
        <img src="https://cdn.poehali.dev/projects/ad643448-fd51-446e-a0bf-6fc850953cc2/files/73d5ac4a-e844-400d-8038-62c7c5585640.jpg"
          alt="" className="pointer-events-none absolute -right-10 -top-10 hidden h-72 w-72 rounded-full object-cover opacity-40 blur-[1px] md:block" />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl">Популярные игры</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {games.map((g, i) => (
            <button key={g.key} onClick={() => onPlay(g.key)}
              style={{ animationDelay: `${i * 70}ms` }}
              className="group animate-float-up rounded-2xl glass p-5 text-left transition hover:neon-border hover:-translate-y-1">
              <div className="mb-3 text-4xl transition group-hover:scale-110">{g.emoji}</div>
              <div className="font-display text-lg">{g.label}</div>
              <div className="mt-2 flex items-center gap-1 text-xs text-accent opacity-0 transition group-hover:opacity-100">
                Открыть <Icon name="ArrowRight" size={12} />
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: 'Zap', title: 'Мгновенные игры', text: '5 рабочих механик с реальной статистикой' },
          { icon: 'TrendingUp', title: 'Прогрессия', text: 'XP, уровни и VIP-лояльность' },
          { icon: 'Trophy', title: 'Турниры', text: 'Рейтинги и таблицы лидеров' },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl glass p-5">
            <Icon name={f.icon} size={22} className="mb-3 text-accent" />
            <div className="font-display text-lg">{f.title}</div>
            <div className="text-sm text-muted-foreground">{f.text}</div>
          </div>
        ))}
      </section>
    </div>
  );
}