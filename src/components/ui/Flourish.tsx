interface FlourishProps {
  children?: React.ReactNode;
}

export function Flourish({ children }: FlourishProps) {
  return (
    <div className="flourish">
      {children ? <span>✦ {children} ✦</span> : <span>✦</span>}
    </div>
  );
}
