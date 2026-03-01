const BREAKDOWN_LABELS = {
  profit: { label: 'Profit Potential', icon: '$' },
  demand: { label: 'Market Demand', icon: '↑' },
  competition: { label: 'Competition', icon: '○' },
  pricing: { label: 'Price Upside', icon: '◆' },
};

export default function VerdictBanner({ verdict, score, breakdown, aiSummary, costBreakdown }) {
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
        textAlign: 'center',
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
        textAlign: 'center',
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
          textAlign: 'center',
        }}>
          Score: {score}/100
        </div>
      )}

      <div style={{
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '14px',
        color: '#888',
        letterSpacing: '1px',
        textAlign: 'center',
      }}>
        {subtitle}
      </div>

      {/* === Score Breakdown Bars === */}
      {breakdown && (
        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: `1px solid ${borderColor}`,
        }}>
          <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#888', marginBottom: '14px', textAlign: 'center' }}>
            Score Breakdown
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
            maxWidth: '640px',
            margin: '0 auto',
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
        </div>
      )}

      {/* === Cost Line Items === */}
      {costBreakdown && (
        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: `1px solid ${borderColor}`,
        }}>
          <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#888', marginBottom: '14px', textAlign: 'center' }}>
            Monthly P&L Estimate
          </div>
          <div style={{ maxWidth: '400px', margin: '0 auto', fontFamily: 'Rajdhani, sans-serif' }}>
            {/* Revenue section */}
            <LineItem label={`Gross Revenue ($${costBreakdown.avgDailyRate}/day avg)`} value={costBreakdown.monthlyGrossRevenue} positive />
            <LineItem label={`Turo Fee (${costBreakdown.turoFeePercent}%)`} value={-costBreakdown.turoFee} />
            <div style={{ height: '1px', background: '#333', margin: '6px 0' }} />
            <LineItem label="After Turo Fees" value={costBreakdown.afterTuroFees} positive bold />

            {/* Costs section */}
            <div style={{ marginTop: '10px' }} />
            <LineItem label="Insurance" value={-costBreakdown.insurance} />
            <LineItem label="Depreciation" value={-costBreakdown.depreciation} />
            <LineItem label="Maintenance" value={-costBreakdown.maintenance} />
            <div style={{ height: '1px', background: '#333', margin: '6px 0' }} />
            <LineItem label="Total Fixed Costs" value={-costBreakdown.totalMonthlyCosts} bold />

            {/* Bottom line */}
            <div style={{ height: '2px', background: color, margin: '10px 0 6px', opacity: 0.5 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#f0f0f0', letterSpacing: '0.5px' }}>
                Est. Monthly Profit
              </span>
              <span style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '20px',
                fontWeight: 900,
                color: costBreakdown.estimatedMonthlyProfit > 0 ? '#00ff6a' : '#ff3b3b',
              }}>
                {costBreakdown.estimatedMonthlyProfit >= 0 ? '+' : ''}${costBreakdown.estimatedMonthlyProfit}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#555', marginTop: '4px', textAlign: 'right' }}>
              * Based on avg market performance for this vehicle
            </div>
          </div>
        </div>
      )}

      {/* === AI Analysis === */}
      {aiSummary && (
        <div style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: `1px solid ${borderColor}`,
        }}>
          <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#888', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/>
              <path d="M12 12v8"/>
              <path d="M8 20h8"/>
              <circle cx="12" cy="6" r="1" fill="currentColor"/>
            </svg>
            AI Analysis
          </div>
          <div style={{
            fontFamily: 'Rajdhani, sans-serif',
            color: '#ccc',
            fontSize: '15px',
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
            maxWidth: '640px',
            margin: '0 auto',
            textAlign: 'left',
          }}>
            {aiSummary}
          </div>
        </div>
      )}
    </div>
  );
}

function LineItem({ label, value, positive, bold }) {
  const isNeg = value < 0;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
      <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '14px', fontWeight: bold ? 700 : 500, color: bold ? '#ccc' : '#888' }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '14px',
        fontWeight: bold ? 700 : 600,
        color: isNeg ? '#ff3b3b' : positive ? '#00ff6a' : '#ccc',
      }}>
        {isNeg ? '-' : '+'}${Math.abs(value)}
      </span>
    </div>
  );
}
