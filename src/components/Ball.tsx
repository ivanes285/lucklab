export default function Ball({ n, type = 'number', size = 'md' }: {
  n: number, type?: 'number' | 'star', size?: 'sm' | 'md' | 'lg'
}) {
  const dim = { sm: 32, md: 42, lg: 52 }[size]
  const fs  = { sm: 11, md: 14, lg: 17 }[size]
  const isStar = type === 'star'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: dim, height: dim, borderRadius: '50%', flexShrink: 0,
      fontSize: fs, fontFamily: "'Space Mono',monospace", fontWeight: 700,
      userSelect: 'none',
      background: isStar ? 'var(--gold)' : 'var(--blue)',
      color: isStar ? '#1a0e00' : '#fff',
      boxShadow: isStar
        ? '0 2px 8px rgba(240,180,41,0.35)'
        : '0 2px 8px rgba(91,127,255,0.35)',
    }}>
      {n < 10 ? `0${n}` : n}
    </span>
  )
}
