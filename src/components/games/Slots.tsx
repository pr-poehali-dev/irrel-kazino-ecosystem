import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { resolveGame, usePlayer } from '@/lib/player';
import { toast } from 'sonner';

const SYMBOLS = ['7️⃣', '🍒', '🍋', '🔔', '💎', '⭐'];
const PAYOUTS: Record<string, number> = { '7️⃣': 20, '💎': 12, '⭐': 8, '🔔': 5, '🍒': 3, '🍋': 2 };

export default function Slots() {
  const player = usePlayer();
  const [bet, setBet] = useState(50);
  const [reels, setReels] = useState(['7️⃣', '💎', '⭐']);
  const [spinning, setSpinning] = useState(false);

  const spin = () => {
    if (bet > player.balance) return toast.error('Недостаточно Plazma Coin');
    if (spinning) return;
    setSpinning(true);
    resolveGame('slots', bet, 0);
    let ticks = 0;
    const iv = setInterval(() => {
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ]);
      ticks++;
      if (ticks > 14) {
        clearInterval(iv);
        const final = [
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        ];
        setReels(final);
        setSpinning(false);
        let payout = 0;
        if (final[0] === final[1] && final[1] === final[2]) {
          payout = bet * PAYOUTS[final[0]];
          toast.success(`ДЖЕКПОТ! +${payout} Plazma`);
        } else if (final[0] === final[1] || final[1] === final[2] || final[0] === final[2]) {
          payout = Math.round(bet * 1.5);
          toast.success(`Пара! +${payout} Plazma`);
        } else {
          toast.error('Мимо');
        }
        if (payout > 0) resolveGame('slots', 0, payout);
      }
    }, 80);
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-center gap-3 rounded-2xl glass p-6">
        {reels.map((s, i) => (
          <div key={i} className={`flex h-24 w-20 items-center justify-center rounded-xl bg-secondary text-5xl neon-border ${spinning ? 'animate-pulse' : ''}`}>
            {s}
          </div>
        ))}
      </div>
      <label className="block text-sm text-muted-foreground">
        Ставка
        <input type="number" value={bet} disabled={spinning}
          onChange={(e) => setBet(Math.max(1, +e.target.value))}
          className="mt-1 w-full rounded-lg bg-secondary px-3 py-2 text-foreground outline-none" />
      </label>
      <Button onClick={spin} disabled={spinning} className="w-full h-12 text-base font-display">
        <Icon name="Dices" size={18} className="mr-2" /> Крутить — {bet} Plazma
      </Button>
      <p className="text-center text-xs text-muted-foreground">3 в ряд = x2–x20 · пара = x1.5</p>
    </div>
  );
}
