import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Die as DieType, DieValue } from '../../types/game';
import { cn } from '../../utils/cn';

// ─── pip positions ────────────────────────────────────────────────────────────
const PIP_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 20], [75, 20], [25, 50], [75, 50], [25, 80], [75, 80]],
};

// ─── face definitions ─────────────────────────────────────────────────────────
const CUBE_FACES: { faceClass: string; value: DieValue }[] = [
  { faceClass: 'die-face-front',  value: 1 },
  { faceClass: 'die-face-back',   value: 6 },
  { faceClass: 'die-face-top',    value: 2 },
  { faceClass: 'die-face-bottom', value: 5 },
  { faceClass: 'die-face-right',  value: 3 },
  { faceClass: 'die-face-left',   value: 4 },
];

// ─── target rotations per value ───────────────────────────────────────────────
const FACE_ROTATIONS: Record<DieValue, { x: number; y: number }> = {
  1: { x: 0,   y: 0   },
  2: { x: -90, y: 0   },
  3: { x: 0,   y: -90 },
  4: { x: 0,   y: 90  },
  5: { x: 90,  y: 0   },
  6: { x: 0,   y: 180 },
};

// ─── DieFace sub-component ────────────────────────────────────────────────────
interface DieFaceProps {
  faceClass: string;
  value: DieValue;
  isSelected: boolean;
  isLocked: boolean;
  isRolling: boolean;
  isDisabled: boolean;
}

function DieFace({ faceClass, value, isSelected, isLocked, isRolling, isDisabled }: DieFaceProps) {
  const faceStyle: React.CSSProperties = isSelected && !isLocked
    ? {
        background: 'radial-gradient(circle at 30% 25%, #fff5d0 0%, #f3d989 50%, #c9994a 100%)',
        border: '1px solid #c9994a',
      }
    : isDisabled
    ? {
        background: 'radial-gradient(circle at 30% 25%, #fbf6ea 0%, #ece2cc 40%, #c5b89c 100%)',
        border: '1px solid rgba(168,152,112,0.4)',
      }
    : {
        background: 'radial-gradient(circle at 30% 25%, #fbf6ea 0%, #ece2cc 40%, #c5b89c 100%)',
        border: '1px solid #a89870',
      };

  return (
    <div
      className={cn('die-face rounded-xl overflow-hidden', faceClass, isLocked && 'opacity-60')}
      style={faceStyle}
    >
      <svg
        viewBox="0 0 100 100"
        className={cn('absolute inset-0 w-full h-full p-1.5 relative z-10', isRolling && 'opacity-0')}
      >
        {(PIP_POSITIONS[value] ?? []).map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={value === 1 ? 11 : 8}
            fill={isSelected ? '#0a0603' : '#1a1208'}
          />
        ))}
      </svg>
    </div>
  );
}

// ─── Die component ────────────────────────────────────────────────────────────
interface DieProps {
  die: DieType;
  onClick?: () => void;
  disabled?: boolean;
}

export function Die({ die, onClick, disabled }: DieProps) {
  const isClickable = !disabled && !die.isLocked && onClick;
  const isDisabled = Boolean(disabled && !die.isLocked);

  const [rot, setRot] = useState<{ x: number; y: number }>(() => FACE_ROTATIONS[die.value]);
  const wasRolling = useRef(false);

  useEffect(() => {
    const rollingStarted = die.isRolling && !wasRolling.current;
    const rollingEnded   = !die.isRolling && wasRolling.current;

    if (rollingStarted) {
      setRot(prev => ({
        x: prev.x + 360 * (3 + Math.random() * 2) + (Math.random() - 0.5) * 180,
        y: prev.y + 360 * (3 + Math.random() * 2) + (Math.random() - 0.5) * 180,
      }));
    }

    if (rollingEnded) {
      const target = FACE_ROTATIONS[die.value];
      setRot(prev => ({
        x: Math.ceil(prev.x / 360) * 360 + target.x,
        y: Math.ceil(prev.y / 360) * 360 + target.y,
      }));
    }

    wasRolling.current = die.isRolling;
  }, [die.isRolling, die.value]);

  const ariaLabel = die.isLocked
    ? `Die showing ${die.value}, locked`
    : die.isSelected
    ? `Die showing ${die.value}, selected`
    : `Die showing ${die.value}`;

  return (
    <div
      className={cn('relative select-none', isClickable && 'cursor-pointer', isDisabled && 'opacity-40 grayscale')}
      style={{ width: 64, height: 64, perspective: '600px' }}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } } : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={ariaLabel}
      aria-pressed={die.isSelected && !die.isLocked ? true : undefined}
    >
      {/* 3D cube */}
      <motion.div
        style={{ transformStyle: 'preserve-3d', width: '100%', height: '100%' }}
        animate={{
          rotateX: rot.x,
          rotateY: rot.y,
          scale: die.isSelected && !die.isLocked ? 1.1 : 1,
          y: die.isSelected && !die.isLocked ? -4 : 0,
        }}
        transition={
          die.isRolling
            ? { duration: 0.65, ease: 'linear' }
            : { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
        }
        whileHover={isClickable ? { scale: die.isSelected ? 1.15 : 1.05 } : undefined}
      >
        {CUBE_FACES.map(({ faceClass, value }) => (
          <DieFace
            key={faceClass}
            faceClass={faceClass}
            value={value}
            isSelected={die.isSelected}
            isLocked={die.isLocked}
            isRolling={die.isRolling}
            isDisabled={isDisabled}
          />
        ))}
      </motion.div>

      {/* Lock badge */}
      {die.isLocked && (
        <div className="absolute -top-2 -right-2 w-5 h-5 z-20 rounded-full
                        flex items-center justify-center text-xs font-bold shadow-md"
          style={{ background: '#c9994a', color: '#0a0603' }}>
          ✓
        </div>
      )}

      {/* Selection glow ring */}
      {die.isSelected && !die.isLocked && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none z-10"
          style={{ boxShadow: '0 0 16px 6px rgba(232,195,116,0.6)' }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
    </div>
  );
}
