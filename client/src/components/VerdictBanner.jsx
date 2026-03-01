const BREAKDOWN_LABELS = {
  profit: { label: 'Profit Potential', icon: '$' },
  demand: { label: 'Market Demand', icon: '↑' },
  competition: { label: 'Competition', icon: '○' },
  pricing: { label: 'Price Upside', icon: '◆' },
};

export default function VerdictBanner({ verdict, score, breakdown }) {
  const isBuy = verdict === 'BUY';
  const isMaybe = verdict === 'MAYBE';

  const color = isBuy ? '#00ff6a' : isMaybe ? '#ffd600' : '#ff3b3b';
  const bgGlow = isBuy
    ? 'rgba(0,255,106,0.08)'
    : isMaybe
    ? 'rgba(255,214,0,0.08)'
    : 'rgba(255,59,59,0.08)';
  const borderColor = isBuy
    ? 'rgba(0,255,106,0.3)'
    : isMaybe
    ? 'rgba(255,214,0,0.3)'
    : 'rgba(255,59,59,0.3)';
  const subtitle = isBuy
    ? 'Strong market opportunity — the data supports this investment'
    : isMaybe
    ? 'Potential opportunity — review the breakdown below before committing'
    : 'The numbers don\'t support this investment at current market rates';

  return (
    <div className="verdict-banner" style={{
      background: bgGlow,
      border: `2px solid ${borderColor}`,
      borderRadius: '4px',
      padding: '32px',
      marginBottom: '32px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top glow line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
      }} />

      <div style={{
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '4px',
        textTransform: 'uppercase',
        color: '#888',
        marginBottom: '12px',
      }}>
        Investment Verdict
      </div>

      <div className="verdict-text" style={{
        fontFamily: 'Orbitron, sans-serif',
        fontSize: 'clamp(40px, 8vw, 64px)',
        fontWeight: 900,
        letterSpacing: '6px',
        textTransform: 'uppercase',
        color,
        textShadow: `0 0 40px ${bgGlow}, 0 0 80px ${bgGlow}`,
        lineHeight: 1,
        marginBottom: '8px',
      }}>
        {verdict}
      </div>

      {score !== undefined && (
        <div style={{
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: '22px',
          fontWeight: 700,
          color,
          marginBottom: '8px',
        }}>
          Score: {score}/100
        </div>
      )}

      <div style={{
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '14px',
        color: '#888',
        letterSpacing: '1px',
      }}>
        {subtitle}
      </div>

      {breakdown && (
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: `1px solid ${borderColor}`,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          maxWidth: '600px',
          margin: '20px auto 0',
        }}>
          {Object.entries(breakdown).map(([key, { points, max, detail }]) => {
            const info = BREAKDOWN_LABELS[key] || { label: key, icon: '•' };
            const pct = Math.round((points / max) * 100);
            return (
              <div key={key} style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#888', marginBottom: '4px' }}>
                  {info.icon} {info.label}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <div style={{ flex: 1, height: '4px', background: '#1e1e1e', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: color,
                      borderRadius: '2px',
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                  <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '13px', fontWeight: 700, color, minWidth: '40px' }}>
                    {points}/{max}
                  </span>
                </div>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '11px', color: '#666' }}>
                  {detail}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
