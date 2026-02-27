export default function AISummary({ summary }) {
  return (
    <div className="ai-summary" style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: '4px', padding: '28px 32px', marginBottom: '32px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #00ff6a, transparent)' }} />
      <div style={{ fontFamily: 'Orbitron, sans-serif', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '11px', fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase', color: '#00ff6a' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/>
          <path d="M12 12v8"/>
          <path d="M8 20h8"/>
          <circle cx="12" cy="6" r="1" fill="currentColor"/>
        </svg>
        AI Analysis
      </div>
      <div style={{ fontFamily: 'Rajdhani, sans-serif', color: '#ccc', fontSize: '16px', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
        {summary}
      </div>
    </div>
  );
}
