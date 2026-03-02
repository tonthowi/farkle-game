import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { AvatarPicker } from '../components/profile/AvatarPicker';
import { Button } from '../components/ui/Button';
import { DEFAULT_PROFILE } from '../types/player';

export function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('🎲');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!username.trim()) {
      setError('Please enter a username.');
      return;
    }

    setLoading(true);

    const { error: signUpError, user, session } = await signUp(email, password);

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (user) {
      // Insert profile row
      await supabase.from('profiles').insert({
        id: user.id,
        username: username.trim(),
        avatar,
        stats: DEFAULT_PROFILE.stats,
      });

      if (session) {
        // Immediately logged in (email confirmation disabled in Supabase)
        navigate('/');
      } else {
        // Email confirmation required
        setConfirmEmail(true);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }

  if (confirmEmail) {
    return (
      <div className="min-h-screen bg-wood-dark flex items-center justify-center p-6">
        <motion.div
          className="bg-wood border border-wood-light rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="text-5xl mb-4">📬</div>
          <h2 className="font-cinzel text-gold font-bold text-xl mb-2">Check your email</h2>
          <p className="font-cinzel text-parchment-dim text-sm mb-6">
            We sent a confirmation link to <span className="text-parchment">{email}</span>. Click
            it to activate your account, then sign in.
          </p>
          <Link to="/login">
            <Button variant="primary" className="w-full">
              Go to Sign In
            </Button>
          </Link>
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
          <div className="text-5xl mb-2">🎲</div>
          <h1 className="font-cinzel font-black text-gold text-3xl tracking-wider">FARKLE</h1>
          <p className="font-cinzel text-parchment-dim text-xs tracking-[0.3em] mt-1">
            JOIN THE TAVERN
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-wood border border-wood-light rounded-2xl p-6 w-full space-y-4 shadow-2xl"
        >
          <h2 className="font-cinzel text-gold font-semibold text-lg text-center">
            Create Account
          </h2>

          {error && (
            <motion.div
              className="bg-danger-dark/30 border border-danger text-danger-light font-cinzel text-xs px-4 py-2.5 rounded-lg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-3">
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

            <div>
              <label className="font-cinzel text-parchment-dim text-xs block mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Min. 6 characters"
                className="w-full bg-wood-darkest border border-wood-light rounded-lg px-4 py-2.5 text-parchment font-cinzel text-sm focus:outline-none focus:border-gold transition-colors placeholder:text-parchment-dim/40"
              />
            </div>

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
                placeholder="Your name in the tavern"
                className="w-full bg-wood-darkest border border-wood-light rounded-lg px-4 py-2.5 text-parchment font-cinzel text-sm focus:outline-none focus:border-gold transition-colors placeholder:text-parchment-dim/40"
              />
            </div>

            <div>
              <label className="font-cinzel text-parchment-dim text-xs block mb-2">Avatar</label>
              <AvatarPicker value={avatar} onChange={setAvatar} />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Creating account…' : '🎲 Join the Tavern'}
          </Button>
        </form>

        <p className="font-cinzel text-parchment-dim text-sm text-center">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-gold hover:text-gold-bright transition-colors underline underline-offset-2"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
