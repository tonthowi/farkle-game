interface TokenBalanceProps {
  balance: number;
  size?: 'sm' | 'md';
}

export function TokenBalance({ balance, size = 'md' }: TokenBalanceProps) {
  const isLow = balance < 50;
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const colorClass = isLow ? 'text-danger-light' : 'text-gold';

  return (
    <span className={`font-cinzel font-semibold ${textSize} ${colorClass} inline-flex items-center gap-1`}>
      🪙 {balance.toLocaleString()}
    </span>
  );
}
