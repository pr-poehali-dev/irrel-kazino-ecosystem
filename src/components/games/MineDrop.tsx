import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { resolveBet, usePlayer } from '@/lib/player';
import { toast } from 'sonner';

const ROWS = 8;
const SLOTS = [10, 3, 1.4, 0.6, 0.3, 0.6, 1.4, 3, 10];

export default function MineDrop() {
  const player = usePlayer();
  const [bet, setBet] = useState(50);
  const [dropping, setDropping] = useState(false);
  const [ballCol, setBallCol] = useState<number | null>(null);
  const [ballRow, setBallRow] = useState(0);
  const [landed, setLanded] = useState<number | null>(null);

  const drop = async () => {
    if (!player || bet > player.balance) return toast.error('Недостаточно Plazma Coin');
    if (dropping) return;
    setDropping(true);
    setLanded(null);
    try {
      await resolveBet(bet, 0);
    } catch (e) {
      setDropping(false);
      return toast.error((e as Error).message);
    }

    let pos = 0;
    setBallCol(0);
    setBallRow(0);
    let row = 0;
    const iv = setInterval(() => {
      row++;
      pos += Math.random() < 0.5 ? 0 : 1;
      setBallRow(row);
      setBallCol(pos);
      if (row >= ROWS) {
        clearInterval(iv);
        const slot = Math.min(pos, SLOTS.length - 1);
        const mult = SLOTS[slot];
        const payout = Math.round(bet * mult);
        setLanded(slot);
        setDropping(false);
        resolveBet(0, payout);
        if (mult >= 1) toast.success(`x${mult} — забрали ${payout} Plazma`);
        else toast.error(`x${mult} — вернули ${payout}`);
      }
    }, 150);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl glass grid-bg p-5">
        <div className="mb-3 space-y-2">
          {Array.from({ length: ROWS }).map((_, r) => (
            <div key={r} className="flex justify-center gap-3">
              {Array.from({ length: r + 2 }).map((_, c) => {
                const isBall = dropping && ballRow === r + 1 && Math.min(ballCol ?? -1, r + 1) === c;
                return (
                  <div key={c} className={`h-2 w-2 rounded-full transition-colors ${isBall ? 'bg-accent shadow-[0_0_10px_currentColor]' : 'bg-primary/40'}`} />
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-1">
          {SLOTS.map((m, i) => (
            <div key={i} className={`flex-1 rounded-md py-2 text-center text-xs font-display
              ${landed === i ? 'bg-accent text-accent-foreground neon-border scale-110' : m >= 1.4 ? 'bg-primary/30' : 'bg-secondary'}`}>
              x{m}
            </div>
          ))}
        </div>
      </div>
      <label className="block text-sm text-muted-foreground">
        Ставка
        <input type="number" value={bet} disabled={dropping}
          onChange={(e) => setBet(Math.max(1, +e.target.value))}
          className="mt-1 w-full rounded-lg bg-secondary px-3 py-2 text-foreground outline-none" />
      </label>
      <Button onClick={drop} disabled={dropping} className="w-full h-12 text-base font-display">
        <Icon name="ArrowDown" size={18} className="mr-2" /> Бросить шар — {bet} Plazma
      </Button>
    </div>
  );
}