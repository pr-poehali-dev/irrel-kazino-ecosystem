import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { GameKey } from '@/lib/player';
import Miner from '@/components/games/Miner';
import Slots from '@/components/games/Slots';
import Crash from '@/components/games/Crash';
import Case from '@/components/games/Case';
import MineDrop from '@/components/games/MineDrop';

const TITLES: Record<GameKey, string> = {
  miner: 'Miner',
  slots: '777 Slots',
  crash: 'Crash',
  case: 'Case',
  minedrop: 'Mine Drop',
};

export default function GameDialog({ game, onClose }: { game: GameKey | null; onClose: () => void }) {
  return (
    <Dialog open={!!game} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl neon-text">{game && TITLES[game]}</DialogTitle>
        </DialogHeader>
        {game === 'miner' && <Miner />}
        {game === 'slots' && <Slots />}
        {game === 'crash' && <Crash />}
        {game === 'case' && <Case />}
        {game === 'minedrop' && <MineDrop />}
      </DialogContent>
    </Dialog>
  );
}
