import { useEffect, useRef, useState, useCallback } from 'react';

const STORAGE_KEY = 'farkle_bgm_muted';
const BGM_VOLUME = 0.4;

/** @param isPaused - pass true when the game route is active */
export function useBgm(isPaused: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true',
  );
  const startedRef = useRef(false);

  // Create audio instance once
  useEffect(() => {
    const audio = new Audio('/bgm.mp3');
    audio.loop = true;
    audio.volume = BGM_VOLUME;
    audio.muted = localStorage.getItem(STORAGE_KEY) === 'true';
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  // Sync muted state to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Pause on game route, play everywhere else
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPaused) {
      audio.pause();
      return;
    }

    const tryPlay = () => {
      if (startedRef.current) return;
      audio.play().then(() => {
        startedRef.current = true;
      }).catch(() => {
        // Blocked by autoplay policy — wait for first interaction
      });
    };

    tryPlay();

    // Fallback: start on first user gesture if autoplay was blocked
    const onInteraction = () => {
      if (!startedRef.current && !isPaused) {
        audio.play().then(() => {
          startedRef.current = true;
        }).catch(() => {});
      }
    };

    document.addEventListener('click', onInteraction, { once: true });
    document.addEventListener('keydown', onInteraction, { once: true });

    return () => {
      document.removeEventListener('click', onInteraction);
      document.removeEventListener('keydown', onInteraction);
    };
  }, [isPaused]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      // If unmuting, try to start playback if it hasn't begun yet
      if (!next && audioRef.current && !startedRef.current) {
        audioRef.current.play().then(() => {
          startedRef.current = true;
        }).catch(() => {});
      }
      return next;
    });
  }, []);

  return { isMuted, toggleMute };
}
