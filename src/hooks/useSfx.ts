import { useRef, useCallback, useState } from 'react';

const STORAGE_KEY = 'farkle_sfx_muted';

function getAudioContext(): AudioContext | null {
  try {
    return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  } catch {
    return null;
  }
}

export function useSfx() {
  const ctxRef = useRef<AudioContext | null>(null);
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true');

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      if (next) localStorage.setItem(STORAGE_KEY, 'true');
      else localStorage.removeItem(STORAGE_KEY);
      return next;
    });
  }, []);

  function ctx(): AudioContext | null {
    if (localStorage.getItem(STORAGE_KEY) === 'true') return null;
    if (!ctxRef.current) ctxRef.current = getAudioContext();
    if (ctxRef.current?.state === 'suspended') ctxRef.current.resume().catch(() => {});
    return ctxRef.current;
  }

  const playRoll = useCallback(() => {
    const c = ctx();
    if (!c) return;
    const t = c.currentTime;
    const bufferSize = Math.floor(c.sampleRate * 0.15);
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buffer;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    src.connect(gain);
    gain.connect(c.destination);
    src.start(t);
    src.stop(t + 0.15);
  }, []);

  const playSelect = useCallback(() => {
    const c = ctx();
    if (!c) return;
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  }, []);

  const playBank = useCallback(() => {
    const c = ctx();
    if (!c) return;
    const t = c.currentTime;
    [523.25, 659.25].forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.06);
      gain.gain.setValueAtTime(0.18, t + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.25);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.25);
    });
  }, []);

  const playFarkle = useCallback(() => {
    const c = ctx();
    if (!c) return;
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.linearRampToValueAtTime(180, t + 0.4);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  }, []);

  const playWin = useCallback(() => {
    const c = ctx();
    if (!c) return;
    const t = c.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.15);
      gain.gain.setValueAtTime(0.22, t + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.35);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(t + i * 0.15);
      osc.stop(t + i * 0.15 + 0.35);
    });
  }, []);

  return { playRoll, playSelect, playBank, playFarkle, playWin, isMuted, toggleMute };
}
