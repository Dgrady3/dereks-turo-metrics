const BREAKDOWN_LABELS = {
  profit: { label: 'Profit', icon: '$' },
  demand: { label: 'Demand', icon: '↑' },
  competition: { label: 'Competition', icon: '○' },
  pricing: { label: 'Pricing', icon: '◆' },
};

export default function VerdictBanner({ verdict, score, breakdown, aiSummary, costBreakdown }) {
  const isBuy = verdict === 'BUY';
  const isMaybe = verdict === 'MAYBE';

  const color = isBuy ? '#00ff6a' : isMaybe ? '#ffd600' : '#ff3b3b';
  const bgGlow = isBuy
    ? 'rgba(0,255,106,0.06)'
    : isMaybe
    ? 'rgba(255,214,0,0.06)'
    : 'rgba(255,59,59,0.06)';
  const borderColor = isBuy
    ? 'rgba(0,255,106,0.25)'
    : isMaybe
    ? 'rgba(255,214,0,0.25)'
    : 'rgba(255,59,59,0.25)';
  const subtitle = isBuy
    ? 'Strong market opportunity — the data supports this investment'
    : isMaybe
    ? 'Potential opportunity — review the breakdown below before committing'
    : 'The numbers don\'t support this investment at current market rates';

  return (
    <div className="verdict-banner" style={{
      background: '#111',
      border: `1px solid ${borderColor}`,
      borderRadius: '6px',
      marginBottom: '32px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top accent line */}
      <div style={{ height: '3px', background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />

      {/* ─── VERDICT HERO ─── */}
      <div style={{
        background: bgGlow,
        padding: '36px 32px 28px',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '5px',
          textTransform: 'uppercase',
          color: '#666',
          marginBottom: '12px',
        }}>
          Investment Verdict
        </div>

        <div className="verdict-text" style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: 'clamp(44px, 8vw, 68px)',
          fontWeight: 900,
          letterSpacing: '8px',
          textTransform: 'uppercase',
          color,
          textShadow: `0 0 60px ${color}33`,
          lineHeight: 1,
          marginBottom: '10px',
        }}>
          {verdict}
        </div>

        {score !== undefined && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            {/* Score ring */}
            <div style={{ position: 'relative', width: '48px', height: '48px' }}>
              <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="24" cy="24" r="20" fill="none" stroke="#1e1e1e" strokeWidth="3" />
                <circle cx="24" cy="24" r="20" fill="none" stroke={color} strokeWidth="3"
                  strokeDasharray={`${(score / 100) * 125.6} 125.6`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 0.8s ease' }}
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Orbitron, sans-serif', fontSize: '13px', fontWeight: 900, color,
              }}>
                {score}
              </div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '14px', fontWeight: 700, color: '#ccc' }}>
                Score: {score}/100
              </div>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '12px', color: '#666' }}>
                {score >= 65 ? '65+ = BUY' : score >= 40 ? '40-64 = MAYBE' : 'Below 40 = PASS'}
              </div>
            </div>
          </div>
        )}

        <div style={{
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: '14px',
          color: '#777',
          letterSpacing: '0.5px',
        }}>
          {subtitle}
        </div>
      </div>

      {/* ─── SCORE BREAKDOWN ─── */}
      {breakdown && (
        <div style={{ padding: '24px 32px', borderTop: `1px solid ${borderColor}` }}>
          <SectionHeader label="Score Breakdown" />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px 32px',
            maxWidth: '560px',
            margin: '0 auto',
          }}>
            {Object.entries(breakdown).map(([key, { points, max, detail }]) => {
              const info = BREAKDOWN_LABELS[key] || { label: key, icon: '•' };
              const pct = Math.round((points / max) * 100);
              const barColor = pct >= 70 ? '#00ff6a' : pct >= 40 ? '#ffd600' : '#ff3b3b';
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '14px', fontWeight: 600, color: '#ccc' }}>
                      {info.icon} {info.label}
                    </span>
                    <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '12px', fontWeight: 700, color: barColor }}>
                      {points}/{max}
                    </span>
                  </div>
                  <div style={{ height: '6px', background: '#1a1a1a', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${barColor}cc, ${barColor})`,
                      borderRadius: '3px',
                      transition: 'width 0.8s ease',
                      boxShadow: `0 0 8px ${barColor}44`,
                    }} />
                  </div>
                  <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '12px', color: '#555', marginTop: '4px' }}>
                    {detail}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── MONTHLY P&L ─── */}
      {costBreakdown && (
        <div style={{ padding: '24px 32px', borderTop: `1px solid ${borderColor}` }}>
          <SectionHeader label="Monthly P&L Estimate" />
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            {/* Revenue */}
            <PLRow
              label="Gross Revenue"
              sublabel={`Based on $${costBreakdown.avgDailyRate}/day avg from Turo market data`}
              value={costBreakdown.monthlyGrossRevenue}
              positive
            />
            <PLRow
              label="Turo Platform Fee"
              sublabel={`${costBreakdown.turoFeePercent}% host fee — Turo standard Go plan`}
              value={-costBreakdown.turoFee}
            />
            <PLDivider />
            <PLRow
              label="Net After Turo"
              value={costBreakdown.afterTuroFees}
              positive
              bold
            />

            <div style={{ height: '12px' }} />

            <PLRow
              label="Insurance"
              sublabel="Avg NC commercial rideshare policy (varies by provider/vehicle)"
              value={-costBreakdown.insurance}
            />
            <PLRow
              label="Depreciation"
              sublabel="Industry avg ~$200/mo for used vehicles — higher for new/luxury"
              value={-costBreakdown.depreciation}
            />
            <PLRow
              label="Maintenance"
              sublabel="AAA avg for sedans — oil, tires, brakes, wear items"
              value={-costBreakdown.maintenance}
            />
            <PLDivider />
            <PLRow
              label="Total Fixed Costs"
              value={-costBreakdown.totalMonthlyCosts}
              bold
            />

            {/* Bottom line */}
            <div style={{ height: '2px', background: `linear-gradient(90deg, transparent, ${color}88, transparent)`, margin: '14px 0 10px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
              <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '18px', fontWeight: 700, color: '#f0f0f0' }}>
                Est. Monthly Profit
              </span>
              <span style={{
                fontFamily: 'Orbitron, sans-serif',
                fontSize: '24px',
                fontWeight: 900,
                color: costBreakdown.estimatedMonthlyProfit > 0 ? '#00ff6a' : '#ff3b3b',
                textShadow: costBreakdown.estimatedMonthlyProfit > 0 ? '0 0 20px rgba(0,255,106,0.3)' : '0 0 20px rgba(255,59,59,0.3)',
              }}>
                {costBreakdown.estimatedMonthlyProfit >= 0 ? '+' : ''}${costBreakdown.estimatedMonthlyProfit}
              </span>
            </div>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '11px', color: '#444', marginTop: '6px', lineHeight: 1.5 }}>
              * Estimates based on avg market performance for this vehicle in this area. Actual results vary by listing quality, pricing strategy, and seasonal demand. Not financial advice.
            </div>
          </div>
        </div>
      )}

      {/* ─── AI ANALYSIS ─── */}
      {aiSummary && (
        <div style={{ padding: '24px 32px', borderTop: `1px solid ${borderColor}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={{ opacity: 0.7 }}>
              <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/>
              <path d="M12 12v8"/>
              <path d="M8 20h8"/>
              <circle cx="12" cy="6" r="1" fill={color}/>
            </svg>
            <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#666' }}>
              AI Analysis
            </span>
          </div>
          <div style={{
            fontFamily: 'Rajdhani, sans-serif',
            color: '#bbb',
            fontSize: '15px',
            lineHeight: 1.8,
            whiteSpace: 'pre-wrap',
            maxWidth: '580px',
            margin: '0 auto',
            textAlign: 'left',
            background: '#0d0d0d',
            borderRadius: '4px',
            padding: '20px 24px',
            border: '1px solid #1a1a1a',
          }}>
            {aiSummary}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ label }) {
  return (
    <div style={{
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '10px',
      fontWeight: 700,
      letterSpacing: '3px',
      textTransform: 'uppercase',
      color: '#555',
      marginBottom: '16px',
      textAlign: 'center',
    }}>
      {label}
    </div>
  );
}

function PLRow({ label, sublabel, value, positive, bold }) {
  const isNeg = value < 0;
  return (
    <div style={{ padding: '6px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: bold ? '15px' : '14px',
          fontWeight: bold ? 700 : 500,
          color: bold ? '#ddd' : '#999',
        }}>
          {label}
        </span>
        <span style={{
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: bold ? '15px' : '14px',
          fontWeight: bold ? 700 : 600,
          color: isNeg ? '#ff3b3b' : positive ? '#00ff6a' : '#ccc',
          letterSpacing: '0.5px',
        }}>
          {isNeg ? '-' : '+'}${Math.abs(value).toLocaleString()}
        </span>
      </div>
      {sublabel && (
        <div style={{
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: '11px',
          color: '#444',
          marginTop: '2px',
          lineHeight: 1.4,
          paddingRight: '80px',
        }}>
          {sublabel}
        </div>
      )}
    </div>
  );
}

function PLDivider() {
  return <div style={{ height: '1px', background: '#222', margin: '4px 0' }} />;
}
