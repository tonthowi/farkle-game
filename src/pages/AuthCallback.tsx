import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

function redirect(navigate: ReturnType<typeof useNavigate>, user: { user_metadata?: Record<string, unknown> }) {
  const onboardingComplete = user.user_metadata?.onboarding_complete;
  if (onboardingComplete) {
    navigate('/', { replace: true });
  } else {
    navigate('/profile-setup', { replace: true });
  }
}

export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasRedirected = useRef(false);

  useEffect(() => {
    const code = searchParams.get('code');

    if (code) {
      // PKCE flow: exchange the code for a session
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (hasRedirected.current) return;
        hasRedirected.current = true;
        if (error || !data.session) {
          navigate('/login?error=invalid_link', { replace: true });
          return;
        }
        redirect(navigate, data.session.user);
      });
      return;
    }

    // Implicit flow: Supabase SDK parses the hash (#access_token=...) automatically.
    // Listen for the resulting SIGNED_IN event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (hasRedirected.current) return;
      if (event === 'SIGNED_IN' && session) {
        hasRedirected.current = true;
        subscription.unsubscribe();
        redirect(navigate, session.user);
      }
    });

    // Fallback: if no session event fires within 5 seconds, something went wrong
    const timeout = setTimeout(() => {
      if (hasRedirected.current) return;
      hasRedirected.current = true;
      subscription.unsubscribe();
      navigate('/login?error=invalid_link', { replace: true });
    }, 5000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-wood-dark flex items-center justify-center">
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="text-6xl"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        >
          🎲
        </motion.div>
        <p className="font-cinzel text-gold text-sm tracking-widest">Opening the tavern door…</p>
      </motion.div>
    </div>
  );
}
