import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

export function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/');
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
        className="relative z-10 w-full max-w-sm flex flex-col items-center gap-7"
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
            KINGDOM COME
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-wood border border-wood-light rounded-2xl p-6 w-full space-y-4 shadow-2xl"
        >
          <h2 className="font-cinzel text-gold font-semibold text-lg text-center">
            Enter the Tavern
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
              <label className="font-cinzel text-parchment-dim text-xs block mb-1.5">
                Email
              </label>
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
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-wood-darkest border border-wood-light rounded-lg px-4 py-2.5 text-parchment font-cinzel text-sm focus:outline-none focus:border-gold transition-colors placeholder:text-parchment-dim/40"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Signing in…' : '⚔️ Sign In'}
          </Button>
        </form>

        <p className="font-cinzel text-parchment-dim text-sm text-center">
          New to the tavern?{' '}
          <Link
            to="/signup"
            className="text-gold hover:text-gold-bright transition-colors underline underline-offset-2"
          >
            Create an account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
