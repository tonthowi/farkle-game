const IS_DEV = import.meta.env.DEV;

export const log = {
  debug: (...args: unknown[]) => { if (IS_DEV) console.debug('[Farkle]', ...args); },
  info:  (...args: unknown[]) => { if (IS_DEV) console.info('[Farkle]', ...args); },
  warn:  (...args: unknown[]) => console.warn('[Farkle]', ...args),
  error: (...args: unknown[]) => console.error('[Farkle]', ...args),
};
