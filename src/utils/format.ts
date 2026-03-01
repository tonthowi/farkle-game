export function formatScore(n: number): string {
  return n.toLocaleString();
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function formatWinRate(wins: number, total: number): string {
  if (total === 0) return '—';
  return `${Math.round((wins / total) * 100)}%`;
}
