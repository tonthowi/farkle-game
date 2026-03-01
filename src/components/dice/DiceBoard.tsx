import { motion, AnimatePresence } from 'framer-motion';
import type { Die as DieType } from '../../types/game';
import { Die } from './Die';

interface DiceBoardProps {
  dice: DieType[];
  onSelectDie?: (id: number) => void;
  canSelect: boolean;
}

export function DiceBoard({ dice, onSelectDie, canSelect }: DiceBoardProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Felt table surface */}
      <div className="bg-felt rounded-2xl border border-felt-light p-6 shadow-inner w-full max-w-sm">
        <div className="grid grid-cols-3 gap-4 place-items-center dice-board">
          <AnimatePresence mode="popLayout">
            {dice.map((die) => (
              <motion.div
                key={die.id}
                layout
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Die
                  die={die}
                  onClick={canSelect && !die.isLocked ? () => onSelectDie?.(die.id) : undefined}
                  disabled={!canSelect || die.isLocked}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Table label */}
        <p className="text-center text-parchment-dim text-xs font-cinzel mt-4 tracking-widest opacity-50">
          ⚜ TAVERN TABLE ⚜
        </p>
      </div>
    </div>
  );
}
