import { useLocation } from 'react-router-dom';

interface BgmButtonProps {
  isMuted: boolean;
  onToggle: () => void;
}

export function BgmButton({ isMuted, onToggle }: BgmButtonProps) {
  const location = useLocation();

  // Hide on the game route — music is paused there anyway
  if (location.pathname === '/game') return null;

  return (
    <button
      onClick={onToggle}
      title={isMuted ? 'Unmute music' : 'Mute music'}
      aria-label={isMuted ? 'Unmute background music' : 'Mute background music'}
      className="fixed bottom-4 right-4 z-50 w-9 h-9 rounded-full bg-wood border border-wood-light
                 flex items-center justify-center text-base
                 text-parchment-dim hover:text-gold hover:border-gold
                 transition-colors shadow-lg"
    >
      {isMuted ? '🔇' : '🎵'}
    </button>
  );
}
