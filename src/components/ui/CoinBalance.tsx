interface CoinBalanceProps {
  balance: number | undefined;
  size?: 'sm' | 'md';
}

export function CoinBalance({ balance, size = 'md' }: CoinBalanceProps) {
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  if (balance === undefined) {
    return (
      <span className={`font-cinzel font-semibold ${textSize} text-parchment-dim/40 inline-flex items-center gap-1`}>
        🪙 …
      </span>
    );
  }

  const isLow = balance < 50;
  const colorClass = isLow ? 'text-danger-light' : 'text-gold';

  return (
    <span className={`font-cinzel font-semibold ${textSize} ${colorClass} inline-flex items-center gap-1`}>
      🪙 {balance.toLocaleString()}
    </span>
  );
}
