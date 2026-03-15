import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { log } from '../lib/logger';
import { AvatarPicker } from '../components/profile/AvatarPicker';
import { Button } from '../components/ui/Button';
import { DEFAULT_PROFILE } from '../types/player';

export function ProfileSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('🎲');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      setError('Please enter a tavern name.');
      return;
    }
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        username: trimmed,
        avatar,
        stats: DEFAULT_PROFILE.stats,
      });

      if (profileError) {
        log.error('Profile setup failed:', profileError.message);
        setError('Could not save your profile. Please try again.');
        setLoading(false);
        return;
      }

      const { error: metaError } = await supabase.auth.updateUser({
        data: { onboarding_complete: true },
      });

      if (metaError) {
        log.warn('Could not mark onboarding complete:', metaError.message);
        // Non-fatal — user can still play, they'll just go through setup again next login
      }

      navigate('/', { replace: true });
    } catch (err) {
      log.error('Unexpected error during profile setup:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-wood-dark flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 left-0 w-64 h-64 border-b-2 border-r-2 border-gold rounded-br-full" />
        <div className="absolute bottom-0 right-0 w-64 h-64 border-t-2 border-l-2 border-gold rounded-tl-full" />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-sm flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Title */}
        <div className="text-center">
          <div className="text-5xl mb-2">🎲</div>
          <h1 className="font-cinzel font-black text-gold text-3xl tracking-wider">FARKLE</h1>
          <p className="font-cinzel text-parchment-dim text-xs tracking-[0.3em] mt-1">
            SET UP YOUR LEGEND
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-wood border border-wood-light rounded-2xl p-6 w-full space-y-4 shadow-2xl"
        >
          <h2 className="font-cinzel text-gold font-semibold text-lg text-center">
            Welcome, Adventurer
          </h2>

          <p className="font-cinzel text-parchment-dim text-xs text-center leading-relaxed">
            Choose your name and sigil. These will be your identity in the tavern.
          </p>

          {error && (
            <motion.div
              className="bg-danger-dark/30 border border-danger text-danger-light font-cinzel text-xs px-4 py-2.5 rounded-lg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {error}
            </motion.div>
          )}

          <div>
            <label className="font-cinzel text-parchment-dim text-xs block mb-1.5">
              Tavern Name
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              maxLength={20}
              autoFocus
              placeholder="Your name in the tavern"
              className="w-full bg-wood-darkest border border-wood-light rounded-lg px-4 py-2.5 text-parchment font-cinzel text-sm focus:outline-none focus:border-gold transition-colors placeholder:text-parchment-dim/40"
            />
          </div>

          <div>
            <label className="font-cinzel text-parchment-dim text-xs block mb-2">Your Sigil</label>
            <AvatarPicker value={avatar} onChange={setAvatar} />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Entering tavern…' : '🎲 Enter the Tavern'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
