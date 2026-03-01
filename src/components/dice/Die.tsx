import { motion } from 'framer-motion';
import type { Die as DieType } from '../../types/game';
import { cn } from '../../utils/cn';

interface DieProps {
  die: DieType;
  onClick?: () => void;
  disabled?: boolean;
}

const PIP_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 20], [75, 20], [25, 50], [75, 50], [25, 80], [75, 80]],
};

export function Die({ die, onClick, disabled }: DieProps) {
  const isClickable = !disabled && !die.isLocked && onClick;

  const baseClass = cn(
    'relative w-16 h-16 rounded-xl cursor-default select-none transition-all duration-150',
    'border-2 shadow-lg',
    die.isLocked && 'opacity-60 border-parchment-dim bg-dice-face',
    die.isSelected && !die.isLocked && 'border-gold bg-dice-face shadow-gold/60 shadow-xl scale-110',
    !die.isSelected && !die.isLocked && 'border-dice-border bg-dice-face',
    isClickable && 'cursor-pointer hover:scale-105 hover:border-gold/60',
    die.isRolling && 'border-parchment-dim'
  );

  return (
    <motion.div
      className={baseClass}
      onClick={isClickable ? onClick : undefined}
      animate={
        die.isRolling
          ? {
              rotateX: [0, 180, 360, 540, 720],
              rotateY: [0, 90, 270, 90, 0],
              scale: [1, 1.1, 0.9, 1.1, 1],
            }
          : die.isSelected
          ? { scale: 1.1, y: -4 }
          : { scale: 1, y: 0 }
      }
      transition={
        die.isRolling
          ? { duration: 0.65, ease: 'easeInOut' }
          : { duration: 0.15 }
      }
      style={{ perspective: 400 }}
    >
      {/* Pip dots */}
      <svg
        viewBox="0 0 100 100"
        className={cn(
          'absolute inset-0 w-full h-full p-1',
          die.isRolling && 'opacity-0'
        )}
      >
        {(PIP_POSITIONS[die.value] ?? []).map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={die.value === 1 ? 11 : 8}
            fill={die.isSelected ? '#2d1b00' : '#3d2b00'}
          />
        ))}
      </svg>

      {/* Rolling overlay */}
      {die.isRolling && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-parchment-dim/30 animate-pulse" />
        </div>
      )}

      {/* Lock indicator */}
      {die.isLocked && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-gold rounded-full flex items-center justify-center text-xs text-wood-dark font-bold">
          ✓
        </div>
      )}

      {/* Selection glow ring */}
      {die.isSelected && (
        <motion.div
          className="absolute inset-0 rounded-xl"
          style={{ boxShadow: '0 0 12px 4px rgba(212, 160, 23, 0.5)' }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}
