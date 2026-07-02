import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { resolveGame, usePlayer } from '@/lib/player';
import { toast } from 'sonner';

const PRIZES = [
  { emoji: '🪙', mult: 0, weight: 35, label: 'Пусто' },
  { emoji: '💠', mult: 0.5, weight: 25, label: 'x0.5' },
  { emoji: '💎', mult: 1.5, weight: 20, label: 'x1.5' },
  { emoji: '👑', mult: 3, weight: 12, label: 'x3' },
  { emoji: '🔥', mult: 7, weight: 6, label: 'x7' },
  { emoji: '🚀', mult: 25, weight: 2, label: 'x25' },
];

const CASE_PRICE = 100;

export default function Case() {
  const player = usePlayer();
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<typeof PRIZES[number] | null>(null);
  const [reel, setReel] = useState<string[]>(PRIZES.map((p) => p.emoji));

  const open = () => {
    if (CASE_PRICE > player.balance) return toast.error('Недостаточно Plazma Coin');
    if (rolling) return;
    setRolling(true);
    setResult(null);
    resolveGame('case', CASE_PRICE, 0);

    const total = PRIZES.reduce((s, p) => s + p.weight, 0);
    let r = Math.random() * total;
    let won = PRIZES[0];
    for (const p of PRIZES) { if (r < p.weight) { won = p; break; } r -= p.weight; }

    let ticks = 0;
    const iv = setInterval(() => {
      setReel(Array.from({ length: 7 }, () => PRIZES[Math.floor(Math.random() * PRIZES.length)].emoji));
      ticks++;
      if (ticks > 16) {
        clearInterval(iv);
        setReel([won.emoji, won.emoji, won.emoji, won.emoji, won.emoji]);
        setResult(won);
        setRolling(false);
        const payout = Math.round(CASE_PRICE * won.mult);
        if (payout > 0) { resolveGame('case', 0, payout); toast.success(`Выпало ${won.label}! +${payout}`); }
        else toast.error('Пусто. Не повезло');
      }
    }, 90);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-center gap-2 rounded-2xl glass p-6 overflow-hidden">
        {reel.slice(0, 5).map((e, i) => (
          <div key={i} className={`flex h-16 w-16 items-center justify-center rounded-xl bg-secondary text-3xl
            ${i === 2 && result ? 'neon-border scale-110' : ''} ${rolling ? 'animate-pulse' : ''}`}>{e}</div>
        ))}
      </div>
      {result && (
        <p className="text-center font-display text-lg text-accent neon-text-cyan animate-float-up">{result.emoji} {result.label}</p>
      )}
      <Button onClick={open} disabled={rolling} className="w-full h-12 text-base font-display">
        <Icon name="Package" size={18} className="mr-2" /> Открыть кейс — {CASE_PRICE} Plazma
      </Button>
      <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
        {PRIZES.map((p) => <span key={p.label}>{p.emoji} {p.label}</span>)}
      </div>
    </div>
  );
}
