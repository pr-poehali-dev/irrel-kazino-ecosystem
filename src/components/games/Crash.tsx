import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { resolveBet, usePlayer } from '@/lib/player';
import { toast } from 'sonner';

export default function Crash() {
  const player = usePlayer();
  const [bet, setBet] = useState(50);
  const [mult, setMult] = useState(1);
  const [running, setRunning] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [cashedAt, setCashedAt] = useState<number | null>(null);
  const crashPoint = useRef(0);
  const raf = useRef<number>();

  const start = async () => {
    if (!player || bet > player.balance) return toast.error('Недостаточно Plazma Coin');
    if (running) return;
    try {
      await resolveBet(bet, 0);
    } catch (e) {
      return toast.error((e as Error).message);
    }
    crashPoint.current = +(0.9 + Math.pow(Math.random(), -0.35)).toFixed(2);
    setMult(1);
    setCrashed(false);
    setCashedAt(null);
    setRunning(true);
    const startTime = performance.now();
    const tick = (now: number) => {
      const t = (now - startTime) / 1000;
      const m = +(Math.pow(1.09, t * 5)).toFixed(2);
      if (m >= crashPoint.current) {
        setMult(crashPoint.current);
        setCrashed(true);
        setRunning(false);
        toast.error(`Краш на x${crashPoint.current}`);
        return;
      }
      setMult(m);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const cashout = () => {
    if (!running) return;
    cancelAnimationFrame(raf.current!);
    const payout = Math.round(bet * mult);
    setCashedAt(mult);
    setRunning(false);
    resolveBet(0, payout);
    toast.success(`Забрали ${payout} Plazma (x${mult})`);
  };

  useEffect(() => () => cancelAnimationFrame(raf.current!), []);

  return (
    <div className="space-y-5">
      <div className={`flex h-44 items-center justify-center rounded-2xl glass grid-bg text-6xl font-display font-bold
        ${crashed ? 'text-destructive' : cashedAt ? 'text-accent neon-text-cyan' : 'text-primary neon-text'}`}>
        x{mult.toFixed(2)}
      </div>
      <label className="block text-sm text-muted-foreground">
        Ставка
        <input type="number" value={bet} disabled={running}
          onChange={(e) => setBet(Math.max(1, +e.target.value))}
          className="mt-1 w-full rounded-lg bg-secondary px-3 py-2 text-foreground outline-none" />
      </label>
      {running ? (
        <Button onClick={cashout} className="w-full h-12 text-base font-display bg-accent text-accent-foreground hover:bg-accent/90">
          Забрать {Math.round(bet * mult)} Plazma
        </Button>
      ) : (
        <Button onClick={start} className="w-full h-12 text-base font-display">
          <Icon name="TrendingUp" size={18} className="mr-2" /> Запустить — {bet} Plazma
        </Button>
      )}
    </div>
  );
}