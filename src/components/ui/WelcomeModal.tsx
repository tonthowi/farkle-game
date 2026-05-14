import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { AvatarPicker } from '../profile/AvatarPicker';
import { Button } from './Button';
import { AVATARS } from '../../types/player';
import { getProfile, saveProfile } from '../../utils/storage';

const RANDOM_NAMES = [
  'Wanderer', 'Traveller', 'Rogue', 'Scholar', 'Merchant', 'Knight', 'Ranger', 'Sage',
  'Bard', 'Pilgrim', 'Hunter', 'Outlaw',
];

function randomName() {
  const base = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${base}#${num}`;
}

function randomAvatar() {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

interface WelcomeModalProps {
  onComplete: () => void;
}

export function WelcomeModal({ onComplete }: WelcomeModalProps) {
  const [name, setName] = useState(() => randomName());
  const [avatar, setAvatar] = useState(() => randomAvatar());

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const profile = getProfile();
    saveProfile({ ...profile, name: name.trim() || randomName(), avatar });
    onComplete();
  }

  return (
    <div className="fixed inset-0 z-50 bg-wood-dark/95 flex items-center justify-center p-6">
      <motion.div
        className="bg-wood border border-wood-light rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
      >
        <div className="text-center mb-5">
          <motion.div
            className="text-5xl mb-2"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            🎲
          </motion.div>
          <h2 className="font-cinzel font-black text-gold text-2xl tracking-wider">Enter the Tavern</h2>
          <p className="font-cinzel text-parchment-dim text-sm mt-1">Who are you, traveller?</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-cinzel text-parchment-dim text-xs block mb-1.5">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              placeholder="What do they call you?"
              autoFocus
              className="w-full bg-wood-darkest border border-wood-light rounded-lg px-4 py-2.5 text-parchment font-cinzel text-sm focus:outline-none focus:border-gold transition-colors placeholder:text-parchment-dim/40"
            />
          </div>

          <div>
            <label className="font-cinzel text-parchment-dim text-xs block mb-2">Your Sigil</label>
            <AvatarPicker value={avatar} onChange={setAvatar} />
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full">
            🚪 Enter Tavern
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
