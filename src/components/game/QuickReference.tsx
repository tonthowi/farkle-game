import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PIP_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 20], [75, 20], [25, 50], [75, 50], [25, 80], [75, 80]],
};

const RULES = [
  { dice: [1],               label: 'Single 1',        pts: 100  },
  { dice: [5],               label: 'Single 5',        pts: 50   },
  { dice: [1, 1, 1],         label: 'Three 1s',        pts: 1000 },
  { dice: [4, 4, 4],         label: 'Three of a Kind', pts: 400  },
  { dice: [2, 2, 4, 4, 6, 6], label: 'Three Pairs',   pts: 750  },
  { dice: [1, 2, 3, 4, 5, 6], label: 'Straight 1–6',  pts: 1500 },
];

function MiniDie({ face }: { face: number }) {
  return (
    <div style={{
      width: 22, height: 22, borderRadius: 4,
      background: 'linear-gradient(180deg, #fbf6ea, #c5b89c)',
      border: '1px solid #a89870',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
      flexShrink: 0,
    }}>
      <svg viewBox="0 0 100 100" style={{ width: '80%', height: '80%' }}>
        {(PIP_POSITIONS[face] ?? []).map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={face === 1 ? 11 : 9} fill="#1a1208" />
        ))}
      </svg>
    </div>
  );
}

interface QuickReferenceProps {
  /** When true renders an always-visible panel (Home screen).
   *  When false renders a collapsible toggle (Game screen). */
  collapsible?: boolean;
}

export function QuickReference({ collapsible = false }: QuickReferenceProps) {
  const [open, setOpen] = useState(false);

  const list = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {RULES.map((r, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 0',
            borderBottom: i < RULES.length - 1 ? '1px solid rgba(201,153,74,0.12)' : 'none',
          }}
        >
          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            {r.dice.map((v, j) => <MiniDie key={j} face={v} />)}
          </div>
          <div style={{ flex: 1, minWidth: 0, paddingLeft: 4 }}>
            <span style={{ fontSize: 13, color: '#ece1c1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
              {r.label}
            </span>
          </div>
          <div className="font-cinzel" style={{ fontSize: 14, color: '#e8c374', fontWeight: 700, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
            {r.pts.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );

  if (!collapsible) {
    return (
      <div className="panel" style={{ padding: '20px 22px' }}>
        <div className="font-cinzel" style={{ color: '#e8c374', fontSize: 11, marginBottom: 14, letterSpacing: '0.24em', textTransform: 'uppercase', textAlign: 'center' }}>
          ✦ Quick Reference ✦
        </div>
        {list}
        <p className="font-cinzel" style={{ textAlign: 'center', color: '#7a6a4b', fontSize: 10, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(201,153,74,0.15)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
          First to 10,000 wins!
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: open ? 'rgba(40,30,18,0.9)' : 'rgba(20,12,5,0.5)',
          border: '1px solid #7a5a1f',
          borderRadius: open ? '3px 3px 0 0' : 3,
          cursor: 'pointer',
          color: 'inherit',
          fontFamily: 'inherit',
          transition: 'background 0.15s',
        }}
      >
        <span className="font-cinzel" style={{ fontSize: 11, color: '#e8c374', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          ✦ Quick Reference
        </span>
        <motion.span
          className="font-cinzel"
          style={{ fontSize: 11, color: '#7a6a4b' }}
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▾
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="qr-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '12px 14px',
                background: 'rgba(20,12,5,0.7)',
                border: '1px solid #7a5a1f',
                borderTop: 'none',
                borderRadius: '0 0 3px 3px',
              }}
            >
              {list}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
