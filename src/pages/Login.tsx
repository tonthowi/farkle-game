import { useState, useEffect, type FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { log } from '../lib/logger';
import { AvatarPicker } from '../components/profile/AvatarPicker';
import { Button } from '../components/ui/Button';
import { DEFAULT_PROFILE } from '../types/player';

function ErrorBanner({ message }: { message: string }) {
  return (
    <motion.div
      className="bg-danger-dark/30 border border-danger text-danger-light font-cinzel text-xs px-4 py-2.5 rounded-lg"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {message}
    </motion.div>
  );
}

export function Login() {
  const { sendMagicLink, signInAnonymously, session } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) navigate('/', { replace: true });
  }, [session, navigate]);

  // Magic link form state
  const [email, setEmail] = useState('');
  const [uiState, setUiState] = useState<'form' | 'sent'>('form');
  const [error, setError] = useState(searchParams.get('error') === 'invalid_link' ? 'That magic link is invalid or expired. Request a new one.' : '');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Guest form state
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestAvatar, setGuestAvatar] = useState('🎲');
  const [guestError, setGuestError] = useState('');
  const [guestLoading, setGuestLoading] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await sendMagicLink(email);

    if (error) {
      const msg = error.message.toLowerCase().includes('rate limit')
        ? 'Too many requests — please wait a minute before trying again.'
        : error.message;
      setError(msg);
      setResendCooldown(60);
      setLoading(false);
    } else {
      setUiState('sent');
      setResendCooldown(60);
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setLoading(true);
    const { error } = await sendMagicLink(email);
    if (error) {
      setError(error.message);
    } else {
      setResendCooldown(60);
    }
    setLoading(false);
  }

  async function handleGuestSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = guestName.trim();
    if (!trimmed) {
      setGuestError('Enter a name to continue.');
      return;
    }
    setGuestError('');
    setGuestLoading(true);

    const { error: anonError, user: anonUser } = await signInAnonymously();
    if (anonError || !anonUser) {
      log.error('Anonymous sign-in failed:', anonError?.message);
      setGuestError(anonError?.message ?? 'Could not enter as guest. Try again.');
      setGuestLoading(false);
      return;
    }

    // Upsert profile — idempotent in case DB trigger already created a row
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: anonUser.id,
      username: trimmed,
      avatar: guestAvatar,
      stats: DEFAULT_PROFILE.stats,
    });
    if (profileError) {
      log.warn('Guest profile upsert failed:', profileError.message);
    }
  }

  if (uiState === 'sent') {
    return (
      <div className="min-h-screen bg-wood-dark flex items-center justify-center p-6">
        <motion.div
          className="bg-wood border border-wood-light rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl space-y-5"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="text-5xl">📬</div>
          <div>
            <h2 className="font-cinzel text-gold font-bold text-xl mb-2">Check your inbox</h2>
            <p className="font-cinzel text-parchment-dim text-sm leading-relaxed">
              We sent a magic link to{' '}
              <span className="text-parchment">{email}</span>. Click it to enter the tavern.
            </p>
          </div>

          {error && <ErrorBanner message={error} />}

          <Button
            variant="secondary"
            className="w-full"
            onClick={handleResend}
            disabled={resendCooldown > 0 || loading}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Magic Link'}
          </Button>

          <button
            type="button"
            onClick={() => { setUiState('form'); setError(''); }}
            className="w-full font-cinzel text-parchment-dim text-xs hover:text-parchment transition-colors"
          >
            Use a different email
          </button>
        </motion.div>
      </div>
    );
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
          <motion.div
            className="text-6xl mb-3"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            🎲
          </motion.div>
          <h1 className="font-cinzel font-black text-gold text-4xl tracking-wider">FARKLE</h1>
          <p className="font-cinzel text-parchment-dim text-xs tracking-[0.3em] mt-1">
            Tavern Dice Game
          </p>
        </div>

        {/* Magic link form */}
        <form
          onSubmit={handleSubmit}
          className="bg-wood border border-wood-light rounded-2xl p-6 w-full space-y-4 shadow-2xl"
        >
          <h2 className="font-cinzel text-gold font-semibold text-lg text-center">
            Enter the Tavern
          </h2>

          {error && <ErrorBanner message={error} />}

          <div>
            <label className="font-cinzel text-parchment-dim text-xs block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="your@email.com"
              className="w-full bg-wood-darkest border border-wood-light rounded-lg px-4 py-2.5 text-parchment font-cinzel text-sm focus:outline-none focus:border-gold transition-colors placeholder:text-parchment-dim/40"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Sending…' : '✉️ Send Magic Link'}
          </Button>

        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-px bg-wood-light" />
          <span className="font-cinzel text-parchment-dim text-xs tracking-widest">OR</span>
          <div className="flex-1 h-px bg-wood-light" />
        </div>

        {/* Guest trigger button */}
        {!showGuestForm && (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full opacity-80"
            onClick={() => setShowGuestForm(true)}
          >
            🎭 Play as Guest
          </Button>
        )}

        {/* Inline guest form */}
        <AnimatePresence>
          {showGuestForm && (
            <motion.form
              key="guest-form"
              onSubmit={handleGuestSubmit}
              className="bg-wood border border-wood-light rounded-2xl p-6 w-full space-y-4 shadow-2xl"
              initial={{ opacity: 0, y: -8, scaleY: 0.96 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -8, scaleY: 0.96 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <h2 className="font-cinzel text-parchment font-semibold text-lg text-center">
                Play as Guest
              </h2>

              {guestError && <ErrorBanner message={guestError} />}

              <div>
                <label className="font-cinzel text-parchment-dim text-xs block mb-1.5">
                  Your Name
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  maxLength={20}
                  placeholder="What do they call you?"
                  autoFocus
                  className="w-full bg-wood-darkest border border-wood-light rounded-lg px-4 py-2.5 text-parchment font-cinzel text-sm focus:outline-none focus:border-gold transition-colors placeholder:text-parchment-dim/40"
                />
              </div>

              <div>
                <label className="font-cinzel text-parchment-dim text-xs block mb-2">
                  Your Sigil
                </label>
                <AvatarPicker value={guestAvatar} onChange={setGuestAvatar} />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={guestLoading}
              >
                {guestLoading ? 'Entering tavern…' : '🚪 Enter Tavern'}
              </Button>

              <button
                type="button"
                onClick={() => { setShowGuestForm(false); setGuestError(''); }}
                className="w-full font-cinzel text-parchment-dim text-xs hover:text-parchment transition-colors"
              >
                Never mind — use magic link instead
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
