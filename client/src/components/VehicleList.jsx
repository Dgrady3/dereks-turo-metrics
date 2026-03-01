import { useState } from 'react';

const TURO_FEE = 0.25;
const MONTHLY_INSURANCE = 150;
const MONTHLY_DEPRECIATION = 200;
const MONTHLY_MAINTENANCE = 75;
const FIXED_COSTS = MONTHLY_INSURANCE + MONTHLY_DEPRECIATION + MONTHLY_MAINTENANCE;

function turoUrl(row) {
  if (!row?.vehicleId) return null;
  const slug = row.locationSlug || 'charlotte-nc';
  const make = (row.make || '').toLowerCase();
  const model = (row.model || '').toLowerCase().replace(/ /g, '-');
  return `https://turo.com/us/en/car-rental/united-states/${slug}/${make}/${model}/${row.vehicleId}`;
}

function scoreVehicle(v, totalListings) {
  const monthlyNet = v.monthlyNetEst || 0;
  const trips = v.trips || 0;
  const price = v.dailyPrice || 0;

  const profitPoints = Math.min(40, Math.max(0, monthlyNet / 12.5));
  const demandPoints = Math.min(25, Math.max(0, trips / 4));
  const competitionPoints = totalListings <= 3 ? 20 : totalListings <= 8 ? 15 : totalListings <= 15 ? 8 : 3;
  const pricePoints = Math.min(15, Math.max(0, (price - 30) / 6));

  const score = Math.min(100, Math.max(0, Math.round(profitPoints + demandPoints + competitionPoints + pricePoints)));
  const verdict = score >= 65 ? 'BUY' : score >= 40 ? 'MAYBE' : 'PASS';

  return {
    verdict,
    score,
    breakdown: {
      profit: { points: Math.round(profitPoints), max: 40, detail: `$${Math.round(monthlyNet)}/mo est. profit` },
      demand: { points: Math.round(demandPoints), max: 25, detail: `${trips} lifetime trips` },
      competition: { points: Math.round(competitionPoints), max: 20, detail: `${totalListings} listing${totalListings !== 1 ? 's' : ''} in area` },
      pricing: { points: Math.round(pricePoints), max: 15, detail: `$${price}/day` },
    },
  };
}

function vehiclePL(v) {
  const gross = v.monthlyGrossEst || 0;
  const turoFee = Math.round(gross * TURO_FEE);
  const afterTuro = gross - turoFee;
  const profit = afterTuro - FIXED_COSTS;
  return { gross, turoFee, afterTuro, insurance: MONTHLY_INSURANCE, depreciation: MONTHLY_DEPRECIATION, maintenance: MONTHLY_MAINTENANCE, fixedCosts: FIXED_COSTS, profit: Math.round(profit), dailyPrice: v.dailyPrice || 0 };
}

const BREAKDOWN_LABELS = {
  profit: { label: 'Profit', icon: '$' },
  demand: { label: 'Demand', icon: '↑' },
  competition: { label: 'Competition', icon: '○' },
  pricing: { label: 'Pricing', icon: '◆' },
};

function DemandBadge({ signal, reason }) {
  const color = signal === 'hot' ? '#00ff6a' : signal === 'warm' ? '#ffd600' : '#ff3b3b';
  const label = signal === 'hot' ? 'HOT' : signal === 'warm' ? 'WARM' : 'COLD';
  return (
    <div>
      <span style={{ color, fontWeight: 700, fontSize: '11px', letterSpacing: '1px', padding: '2px 8px', background: `${color}15`, border: `1px solid ${color}40`, borderRadius: '3px', fontFamily: 'Orbitron, sans-serif' }}>
        {label}
      </span>
      {reason && (
        <div style={{ fontSize: '11px', color: '#666', marginTop: '3px', lineHeight: 1.3, maxWidth: '180px' }}>
          {reason}
        </div>
      )}
    </div>
  );
}

function VehicleRow({ vehicle, index, isExpanded, onToggle, totalListings, aiSummary, isFirst }) {
  const scoring = scoreVehicle(vehicle, totalListings);
  const verdictColor = scoring.verdict === 'BUY' ? '#00ff6a' : scoring.verdict === 'MAYBE' ? '#ffd600' : '#ff3b3b';

  return (
    <>
      {/* ─── Main Row ─── */}
      <tr
        onClick={onToggle}
        style={{
          borderBottom: isExpanded ? 'none' : '1px solid #1e1e1e',
          cursor: 'pointer',
          transition: 'background 0.15s',
          background: isExpanded ? '#1a1a1a' : 'transparent',
        }}
        onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = '#151515'; }}
        onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
      >
        <td style={{ fontFamily: 'Orbitron, sans-serif', padding: '14px 20px', color: '#00ff6a', fontWeight: 700, fontSize: '14px', width: '40px' }}>
          {index + 1}
        </td>
        <td style={{ fontFamily: 'Rajdhani, sans-serif', padding: '14px 16px', color: '#888', fontSize: '14px', fontWeight: 600 }}>
          {vehicle.year || '—'}
        </td>
        <td style={{ fontFamily: 'Rajdhani, sans-serif', padding: '14px 16px', color: '#f0f0f0', fontSize: '15px', fontWeight: 700 }}>
          {vehicle.make} {vehicle.model}
        </td>
        <td style={{ fontFamily: 'Rajdhani, sans-serif', padding: '14px 16px', color: '#ccc', fontSize: '15px', fontWeight: 600 }}>
          ${vehicle.dailyPrice || '—'}
        </td>
        <td style={{ padding: '14px 16px' }}>
          <DemandBadge signal={vehicle.demandSignal || 'cold'} />
        </td>
        <td style={{ fontFamily: 'Rajdhani, sans-serif', padding: '14px 16px', color: '#ccc', fontSize: '15px', fontWeight: 600 }}>
          {vehicle.trips ?? '—'}
        </td>
        <td style={{ fontFamily: 'Rajdhani, sans-serif', padding: '14px 16px', color: '#ccc', fontSize: '15px', fontWeight: 600 }}>
          {vehicle.rating ? `${vehicle.rating} ★` : '—'}
        </td>
        {/* Inline mini-verdict */}
        <td style={{ padding: '14px 16px' }}>
          <span style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '10px',
            fontWeight: 900,
            letterSpacing: '2px',
            color: verdictColor,
            padding: '3px 10px',
            background: `${verdictColor}12`,
            border: `1px solid ${verdictColor}30`,
            borderRadius: '3px',
          }}>
            {scoring.score} — {scoring.verdict}
          </span>
        </td>
        <td style={{ padding: '14px 16px', width: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {vehicle.vehicleId && (
              <a
                href={turoUrl(vehicle)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{ color: '#00ff6a', textDecoration: 'none', opacity: 0.5, transition: 'opacity 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                title="View on Turo"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            )}
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke={isExpanded ? '#00ff6a' : '#555'} strokeWidth="2"
              style={{ transition: 'transform 0.3s, stroke 0.3s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}
            >
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>
        </td>
      </tr>

      {/* ─── Expanded Diagnostic Panel ─── */}
      {isExpanded && (
        <tr>
          <td colSpan={9} style={{ padding: 0, borderBottom: '1px solid #1e1e1e' }}>
            <div style={{ position: 'sticky', left: 0, maxWidth: '100vw', boxSizing: 'border-box' }}>
              <VehicleDiagnostics
                vehicle={vehicle}
                scoring={scoring}
                totalListings={totalListings}
                aiSummary={isFirst ? aiSummary : null}
              />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function VehicleDiagnostics({ vehicle, scoring, totalListings, aiSummary }) {
  const color = scoring.verdict === 'BUY' ? '#00ff6a' : scoring.verdict === 'MAYBE' ? '#ffd600' : '#ff3b3b';
  const pl = vehiclePL(vehicle);

  return (
    <div style={{ padding: '16px', background: '#111' }}>

      {/* ─── Row 1: Verdict + Profit side by side ─── */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
        {/* Verdict badge */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', background: '#0a0a0a', borderRadius: '4px', padding: '12px' }}>
          <div style={{ position: 'relative', width: '44px', height: '44px', flexShrink: 0 }}>
            <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="22" cy="22" r="18" fill="none" stroke="#1e1e1e" strokeWidth="3" />
              <circle cx="22" cy="22" r="18" fill="none" stroke={color} strokeWidth="3"
                strokeDasharray={`${(scoring.score / 100) * 113} 113`}
                strokeLinecap="round"
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Orbitron, sans-serif', fontSize: '12px', fontWeight: 900, color }}>
              {scoring.score}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '18px', fontWeight: 900, letterSpacing: '2px', color, lineHeight: 1 }}>
              {scoring.verdict}
            </div>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '11px', color: '#666', marginTop: '2px' }}>
              {scoring.verdict === 'BUY' ? 'Strong signal' : scoring.verdict === 'MAYBE' ? 'Review carefully' : 'Numbers don\'t add up'}
            </div>
          </div>
        </div>

        {/* Profit callout */}
        <div style={{ flex: 1, background: '#0a0a0a', borderRadius: '4px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#555', textTransform: 'uppercase', marginBottom: '4px' }}>
            Est. Monthly
          </div>
          <div style={{
            fontFamily: 'Orbitron, sans-serif', fontSize: '22px', fontWeight: 900,
            color: pl.profit > 0 ? '#00ff6a' : '#ff3b3b',
            textShadow: pl.profit > 0 ? '0 0 12px rgba(0,255,106,0.2)' : '0 0 12px rgba(255,59,59,0.2)',
          }}>
            {pl.profit >= 0 ? '+' : ''}${pl.profit}
          </div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '10px', color: '#555', marginTop: '2px' }}>
            ${pl.dailyPrice}/day · {Math.round(pl.gross / pl.dailyPrice)}d occ.
          </div>
        </div>
      </div>

      {/* ─── Row 2: Score breakdown — 2x2 grid ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
        {Object.entries(scoring.breakdown).map(([key, { points, max, detail }]) => {
          const info = BREAKDOWN_LABELS[key] || { label: key, icon: '•' };
          const pct = Math.round((points / max) * 100);
          const barColor = pct >= 70 ? '#00ff6a' : pct >= 40 ? '#ffd600' : '#ff3b3b';
          return (
            <div key={key} style={{ background: '#0a0a0a', borderRadius: '4px', padding: '8px 10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '12px', fontWeight: 600, color: '#999' }}>
                  {info.icon} {info.label}
                </span>
                <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '10px', fontWeight: 700, color: barColor }}>
                  {points}/{max}
                </span>
              </div>
              <div style={{ height: '4px', background: '#1a1a1a', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '2px', transition: 'width 0.6s ease' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Row 3: P&L compact — vertical list ─── */}
      <div style={{ background: '#0a0a0a', borderRadius: '4px', padding: '10px 12px', marginBottom: '10px' }}>
        {[
          { label: 'Gross Revenue', value: pl.gross, color: '#00ff6a' },
          { label: 'Turo Fee (25%)', value: -pl.turoFee, color: '#ff3b3b' },
          { label: 'Costs (ins/dep/maint)', value: -pl.fixedCosts, color: '#ff3b3b' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #1a1a1a' }}>
            <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '13px', color: '#888' }}>
              {item.label}
            </span>
            <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '14px', fontWeight: 700, color: item.color }}>
              {item.value < 0 ? '-' : '+'}${Math.abs(item.value)}
            </span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0 2px' }}>
          <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '14px', fontWeight: 700, color: '#f0f0f0' }}>
            Est. Monthly Profit
          </span>
          <span style={{
            fontFamily: 'Orbitron, sans-serif', fontSize: '16px', fontWeight: 900,
            color: pl.profit > 0 ? '#00ff6a' : '#ff3b3b',
          }}>
            {pl.profit >= 0 ? '+' : ''}${pl.profit}
          </span>
        </div>
      </div>
      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '9px', color: '#333', textAlign: 'center', marginBottom: aiSummary ? '12px' : '0' }}>
        Insurance $150 + Depreciation $200 + Maintenance $75 = $425/mo costs · Not financial advice
      </div>

      {/* ─── AI Analysis (only on first expanded) ─── */}
      {aiSummary && (
        <div style={{ background: '#0a0a0a', borderRadius: '4px', padding: '12px' }}>
          <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', color: '#555', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={{ opacity: 0.7 }}>
              <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/>
              <path d="M12 12v8"/><path d="M8 20h8"/>
            </svg>
            AI Analysis
          </div>
          <div style={{
            fontFamily: 'Rajdhani, sans-serif', color: '#aaa', fontSize: '12px', lineHeight: 1.6,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {aiSummary}
          </div>
        </div>
      )}
    </div>
  );
}

function PLRow({ label, sublabel, value, positive, bold }) {
  const isNeg = value < 0;
  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: bold ? '14px' : '13px', fontWeight: bold ? 700 : 500, color: bold ? '#ddd' : '#999' }}>
          {label}
        </span>
        <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: bold ? '14px' : '13px', fontWeight: bold ? 700 : 600, color: isNeg ? '#ff3b3b' : positive ? '#00ff6a' : '#ccc' }}>
          {isNeg ? '-' : '+'}${Math.abs(value).toLocaleString()}
        </span>
      </div>
      {sublabel && (
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '10px', color: '#444', marginTop: '1px', lineHeight: 1.3, paddingRight: '60px' }}>
          {sublabel}
        </div>
      )}
    </div>
  );
}

function PLDivider() {
  return <div style={{ height: '1px', background: '#222', margin: '3px 0' }} />;
}

export default function VehicleList({ data, sortBy, aiSummary, title }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!data || data.length === 0) return null;

  const sorted = [...data].sort((a, b) => {
    if (sortBy === 'profit') return (b.monthlyNetEst || 0) - (a.monthlyNetEst || 0);
    return (b.trips || 0) - (a.trips || 0);
  });

  const totalListings = sorted.length;

  return (
    <div style={{
      background: '#141414',
      border: '1px solid #1e1e1e',
      borderRadius: '4px',
      marginBottom: '32px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #00ff6a, transparent)' }} />

      <div className="data-table-header" style={{
        fontFamily: 'Orbitron, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 20px 12px',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '4px',
        textTransform: 'uppercase',
        color: '#00ff6a',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
          {title || `${totalListings} Vehicles Found`}
        </div>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '12px', fontWeight: 500, color: '#666', letterSpacing: '0', textTransform: 'none' }}>
          Sorted by {sortBy === 'profit' ? 'estimated profit' : 'trip volume'} · Click any row for full analysis
        </div>
      </div>

      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table className="data-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '700px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e1e1e' }}>
              {['#', 'Year', 'Vehicle', 'Daily Price', 'Demand', 'Trips', 'Rating', 'Score', ''].map(h => (
                <th key={h} style={{ fontFamily: 'Orbitron, sans-serif', padding: '10px 16px', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#888' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((v, i) => (
              <VehicleRow
                key={v.vehicleId || i}
                vehicle={v}
                index={i}
                isExpanded={expandedId === (v.vehicleId || i)}
                onToggle={() => setExpandedId(expandedId === (v.vehicleId || i) ? null : (v.vehicleId || i))}
                totalListings={totalListings}
                aiSummary={aiSummary}
                isFirst={i === 0 || expandedId === (v.vehicleId || i)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '11px', color: '#555', padding: '12px 20px', textAlign: 'center', borderTop: '1px solid #1a1a1a' }}>
        <span style={{ color: '#00ff6a' }}>HOT</span> = 50+ trips or new w/ 5+ trips &nbsp;|&nbsp;
        <span style={{ color: '#ffd600' }}>WARM</span> = 10+ trips or new w/ bookings &nbsp;|&nbsp;
        <span style={{ color: '#ff3b3b' }}>COLD</span> = unproven demand.
        Score: 65+ = BUY, 40-64 = MAYBE, &lt;40 = PASS
      </div>
    </div>
  );
}
