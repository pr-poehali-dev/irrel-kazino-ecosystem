import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { resolveBet, usePlayer } from '@/lib/player';
import { toast } from 'sonner';

const SIZE = 25;

export default function Miner() {
  const player = usePlayer();
  const [bet, setBet] = useState(50);
  const [mines, setMines] = useState(3);
  const [active, setActive] = useState(false);
  const [minePositions, setMinePositions] = useState<Set<number>>(new Set());
  const [opened, setOpened] = useState<Set<number>>(new Set());
  const [lost, setLost] = useState(false);

  const safeOpened = opened.size;
  const multiplier = active || lost
    ? +(Math.pow((SIZE) / (SIZE - mines), safeOpened) * 0.97).toFixed(2)
    : 1;
  const currentWin = Math.round(bet * multiplier);

  const start = async () => {
    if (!player || bet > player.balance) return toast.error('Недостаточно Plazma Coin');
    if (bet < 1) return toast.error('Ставка минимум 1');
    try {
      await resolveBet(bet, 0);
    } catch (e) {
      return toast.error((e as Error).message);
    }
    const pos = new Set<number>();
    while (pos.size < mines) pos.add(Math.floor(Math.random() * SIZE));
    setMinePositions(pos);
    setOpened(new Set());
    setLost(false);
    setActive(true);
  };

  const openCell = (i: number) => {
    if (!active || opened.has(i)) return;
    if (minePositions.has(i)) {
      setLost(true);
      setActive(false);
      toast.error('Бомба! Ставка сгорела');
      return;
    }
    const next = new Set(opened);
    next.add(i);
    setOpened(next);
    if (next.size === SIZE - mines) cashout(next.size);
  };

  const cashout = (count = safeOpened) => {
    if (!active) return;
    const mult = +(Math.pow(SIZE / (SIZE - mines), count) * 0.97).toFixed(2);
    const payout = Math.round(bet * mult);
    setActive(false);
    resolveBet(0, payout);
    toast.success(`Забрали ${payout} Plazma (x${mult})`);
    setMinePositions(new Set());
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm text-muted-foreground">
          Ставка
          <input type="number" value={bet} disabled={active}
            onChange={(e) => setBet(Math.max(1, +e.target.value))}
            className="mt-1 w-full rounded-lg bg-secondary px-3 py-2 text-foreground outline-none" />
        </label>
        <label className="text-sm text-muted-foreground">
          Мины: {mines}
          <input type="range" min={1} max={20} value={mines} disabled={active}
            onChange={(e) => setMines(+e.target.value)}
            className="mt-3 w-full accent-primary" />
        </label>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: SIZE }).map((_, i) => {
          const isOpen = opened.has(i);
          const isMine = (lost || !active) && minePositions.has(i);
          return (
            <button key={i} onClick={() => openCell(i)}
              disabled={!active}
              className={`aspect-square rounded-lg text-2xl transition-all flex items-center justify-center
                ${isOpen ? 'bg-accent/20 neon-border' : 'bg-secondary hover:bg-secondary/70'}
                ${isMine ? 'bg-destructive/30' : ''}`}>
              {isOpen ? '💎' : isMine ? '💣' : ''}
            </button>
          );
        })}
      </div>

      {active ? (
        <Button onClick={() => cashout()} className="w-full h-12 text-base font-display bg-accent text-accent-foreground hover:bg-accent/90">
          Забрать {currentWin} Plazma (x{multiplier})
        </Button>
      ) : (
        <Button onClick={start} className="w-full h-12 text-base font-display">
          <Icon name="Play" size={18} className="mr-2" /> Играть — ставка {bet}
        </Button>
      )}
    </div>
  );
}