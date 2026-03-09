import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Die as DieType, DieValue } from '../../types/game';
import { cn } from '../../utils/cn';

// ─── pip positions ────────────────────────────────────────────────────────────
// Coordinates in 0-100 SVG viewBox space
const PIP_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 20], [75, 20], [25, 50], [75, 50], [25, 80], [75, 80]],
};

// ─── face definitions ─────────────────────────────────────────────────────────
// Standard die (opposite faces sum to 7):
//   front=1 / back=6 | top=2 / bottom=5 | right=3 / left=4
const CUBE_FACES: { faceClass: string; value: DieValue }[] = [
  { faceClass: 'die-face-front',  value: 1 },
  { faceClass: 'die-face-back',   value: 6 },
  { faceClass: 'die-face-top',    value: 2 },
  { faceClass: 'die-face-bottom', value: 5 },
  { faceClass: 'die-face-right',  value: 3 },
  { faceClass: 'die-face-left',   value: 4 },
];

// ─── target rotations per value ───────────────────────────────────────────────
// Rotate the cube so the matching face points toward the viewer
const FACE_ROTATIONS: Record<DieValue, { x: number; y: number }> = {
  1: { x: 0,   y: 0   },  // front → viewer
  2: { x: -90, y: 0   },  // top → viewer (tilt forward)
  3: { x: 0,   y: -90 },  // right → viewer (turn left)
  4: { x: 0,   y: 90  },  // left → viewer (turn right)
  5: { x: 90,  y: 0   },  // bottom → viewer (tilt backward)
  6: { x: 0,   y: 180 },  // back → viewer (180° turn)
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
  return (
    <div
      className={cn(
        'die-face rounded-xl overflow-hidden border',
        faceClass,
        isSelected && !isLocked
          ? 'border-gold bg-dice-face'
          : isDisabled
            ? 'border-dice-border/40 bg-dice-face'
            : 'border-dice-border bg-dice-face',
        isLocked && 'opacity-60',
      )}
    >

      {/* Pip dots — hidden while rolling */}
      <svg
        viewBox="0 0 100 100"
        className={cn(
          'absolute inset-0 w-full h-full p-1.5 relative z-10',
          isRolling && 'opacity-0',
        )}
      >
        {(PIP_POSITIONS[value] ?? []).map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={value === 1 ? 11 : 8}
            fill={isSelected ? '#2d1b00' : '#3d2b00'}
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

  // ── Accumulated rotation state (never resets to 0 — prevents backtracking) ──
  const [rot, setRot] = useState<{ x: number; y: number }>(() => FACE_ROTATIONS[die.value]);
  const wasRolling = useRef(false);

  useEffect(() => {
    const rollingStarted = die.isRolling && !wasRolling.current;
    const rollingEnded   = !die.isRolling && wasRolling.current;

    if (rollingStarted) {
      // Spin the cube: 3–5 full rotations + random offset so each die is unique
      setRot(prev => ({
        x: prev.x + 360 * (3 + Math.random() * 2) + (Math.random() - 0.5) * 180,
        y: prev.y + 360 * (3 + Math.random() * 2) + (Math.random() - 0.5) * 180,
      }));
    }

    if (rollingEnded) {
      // Settle to the nearest forward-equivalent of the correct face angle
      const target = FACE_ROTATIONS[die.value];
      setRot(prev => ({
        x: Math.ceil(prev.x / 360) * 360 + target.x,
        y: Math.ceil(prev.y / 360) * 360 + target.y,
      }));
    }

    wasRolling.current = die.isRolling;
  }, [die.isRolling, die.value]);

  return (
    // Outer wrapper: perspective context + click target
    <div
      className={cn(
        'relative select-none',
        isClickable && 'cursor-pointer',
        isDisabled && 'opacity-40 grayscale',
      )}
      style={{ width: 64, height: 64, perspective: '600px' }}
      onClick={isClickable ? onClick : undefined}
    >
      {/* 3D cube — Framer Motion drives rotateX / rotateY */}
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

      {/* Lock badge — flat, outside the 3D container so it never distorts */}
      {die.isLocked && (
        <div className="absolute -top-2 -right-2 w-5 h-5 z-20 bg-gold rounded-full
                        flex items-center justify-center text-xs text-wood-dark font-bold
                        shadow-md">
          ✓
        </div>
      )}

      {/* Selection glow ring — flat overlay, pulsing */}
      {die.isSelected && !die.isLocked && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none z-10"
          style={{ boxShadow: '0 0 16px 6px rgba(212, 160, 23, 0.5)' }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
    </div>
  );
}
