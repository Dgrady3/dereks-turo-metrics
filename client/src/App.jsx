import { useState } from 'react';
import { API_BASE } from './api';
import SearchPanel from './components/SearchPanel';
import LoadingState from './components/LoadingState';
import VerdictBanner from './components/VerdictBanner';
import AISummary from './components/AISummary';
import MetricCards from './components/MetricCards';
import DataTable from './components/DataTable';
import InvestmentCalculator from './components/InvestmentCalculator';
import MarketLeaders from './components/MarketLeaders';

const DemandBadge = ({ signal, reason }) => {
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
};

const volumeColumns = [
  { key: 'make', label: 'Make' },
  { key: 'model', label: 'Model' },
  { key: 'dailyPrice', label: 'Daily Price', render: (v) => v ? `$${v}` : '—' },
  { key: 'demandSignal', label: 'Demand', render: (v, row) => <DemandBadge signal={v || 'cold'} reason={row.demandReason} /> },
  { key: 'monthlyTrips', label: 'Trips/Mo', render: (v) => v != null ? `${v}/mo` : '—' },
  { key: 'trips', label: 'Lifetime Trips', render: (v) => v ?? '—' },
  { key: 'rating', label: 'Rating', render: (v) => v ? `${v} ★` : '—' },
];

const profitColumns = [
  { key: 'make', label: 'Make' },
  { key: 'model', label: 'Model' },
  { key: 'dailyPrice', label: 'Daily Price', render: (v) => v ? `$${v}` : '—' },
  { key: 'demandSignal', label: 'Demand', render: (v, row) => <DemandBadge signal={v || 'cold'} reason={row.demandReason} /> },
  { key: 'monthlyTrips', label: 'Trips/Mo', render: (v) => v != null ? `${v}/mo` : '—' },
  { key: 'estimatedMonthly', label: 'Est. Monthly', render: (v) => v ? `$${v}` : '—' },
  { key: 'rating', label: 'Rating', render: (v) => v ? `${v} ★` : '—' },
];

const MODES = [
  { key: 'search', label: 'Search Turo Market', desc: 'Look up a specific make & model' },
  { key: 'leaders', label: 'Market Leaders', desc: 'Find the best opportunities by category' },
];

export default function App() {
  const [mode, setMode] = useState('search');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setResults(null);
    setError(null);
    setLoading(false);
  };

  const handleSearch = async ({ make, model, city, sortBy }) => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch(`${API_BASE}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ make, model, city }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Search failed');
      }

      const data = await res.json();
      if (data.success === false) {
        throw new Error(data.error || 'No listings found');
      }
      setResults({ ...data, sortBy });
    } catch (err) {
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        setError('Cannot connect to the server. Make sure the backend is running.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Background gear 1 */}
      <svg className="bg-gear-1" style={{ position: 'fixed', top: '-200px', right: '-150px', width: '600px', height: '600px', opacity: 0.025, zIndex: 0, animation: 'gear-spin 60s linear infinite' }} viewBox="0 0 100 100" fill="none">
        <path d="M50 15 L54 0 H46 L50 15 M50 85 L54 100 H46 L50 85 M15 50 L0 54 V46 L15 50 M85 50 L100 54 V46 L85 50 M22 22 L11 11 L18 4 L29 15 M78 22 L89 11 L82 4 L71 15 M22 78 L11 89 L18 96 L29 85 M78 78 L89 89 L82 96 L71 85" stroke="#00ff6a" strokeWidth="6"/>
        <circle cx="50" cy="50" r="35" stroke="#00ff6a" strokeWidth="8"/>
        <circle cx="50" cy="50" r="18" stroke="#00ff6a" strokeWidth="6"/>
      </svg>

      {/* Background gear 2 */}
      <svg className="bg-gear-2" style={{ position: 'fixed', bottom: '-300px', left: '-200px', width: '800px', height: '800px', opacity: 0.025, zIndex: 0, animation: 'gear-spin 90s linear infinite reverse' }} viewBox="0 0 100 100" fill="none">
        <path d="M50 15 L54 0 H46 L50 15 M50 85 L54 100 H46 L50 85 M15 50 L0 54 V46 L15 50 M85 50 L100 54 V46 L85 50 M22 22 L11 11 L18 4 L29 15 M78 22 L89 11 L82 4 L71 15 M22 78 L11 89 L18 96 L29 85 M78 78 L89 89 L82 96 L71 85" stroke="#00ff6a" strokeWidth="6"/>
        <circle cx="50" cy="50" r="35" stroke="#00ff6a" strokeWidth="8"/>
        <circle cx="50" cy="50" r="18" stroke="#00ff6a" strokeWidth="6"/>
      </svg>

      {/* Main content */}
      <div className="app-content" style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 24px 80px', position: 'relative', zIndex: 2 }}>
        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-block', position: 'relative' }}>
            <div className="app-header-title" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900, fontSize: 'clamp(32px, 6vw, 56px)', textTransform: 'uppercase', lineHeight: 1, display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.3em', alignItems: 'end' }}>
              <span className="header-titsy" style={{ color: '#f0f0f0', textAlign: 'right' }}>Titsy</span>
              <span className="header-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span className="header-dereks" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '13px', letterSpacing: '8px', textTransform: 'uppercase', color: '#888', marginBottom: '4px' }}>Derek&apos;s</span>
                <span className="header-turo" style={{ color: '#00ff6a', textShadow: '0 0 30px rgba(0,255,106,0.35), 0 0 60px rgba(0,255,106,0.15)' }}>TURO</span>
              </span>
              <span className="header-metrics" style={{ color: '#f0f0f0', textAlign: 'left' }}>Metrics</span>
            </div>
            <div className="app-subtitle" style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '14px', fontWeight: 500, color: '#888', letterSpacing: '3px', textTransform: 'uppercase', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <span style={{ width: '40px', height: '1px', background: 'linear-gradient(90deg, transparent, #00cc55, transparent)' }} />
              North Carolina Market Intel
              <span style={{ width: '40px', height: '1px', background: 'linear-gradient(90deg, transparent, #00cc55, transparent)' }} />
            </div>
          </div>
        </header>

        {/* Mode Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <div className="mode-toggle" style={{ display: 'inline-flex', background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: '4px', overflow: 'hidden' }}>
            {MODES.map(m => (
              <button
                key={m.key}
                onClick={() => handleModeChange(m.key)}
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  padding: '10px 24px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  background: mode === m.key ? '#00ff6a' : 'transparent',
                  color: mode === m.key ? '#0a0a0a' : '#888',
                  boxShadow: mode === m.key ? '0 0 20px rgba(0,255,106,0.15)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                <span>{m.label}</span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  letterSpacing: '0.5px',
                  textTransform: 'none',
                  opacity: mode === m.key ? 0.7 : 0.5,
                }}>
                  {m.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* === FLOW 1: Search Turo Market === */}
        {mode === 'search' && (
          <>
            <SearchPanel onSearch={handleSearch} loading={loading} />

            {loading && <LoadingState />}

            {error && (
              <div style={{ background: 'rgba(255,59,59,0.08)', border: '1px solid rgba(255,59,59,0.3)', borderRadius: '4px', padding: '20px', marginBottom: '32px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#ff3b3b', fontSize: '14px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Error</div>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', color: '#ccc', fontSize: '16px' }}>{error}</div>
              </div>
            )}

            {results && !loading && (
              <>
                {results.lastUpdated && (
                  <div style={{ textAlign: 'center', marginBottom: '12px', fontFamily: 'Rajdhani, sans-serif', fontSize: '13px', color: '#555' }}>
                    Data as of {new Date(results.lastUpdated).toLocaleString()}
                  </div>
                )}
                {results.dataSource === 'sample' && (
                  <div style={{ background: 'rgba(255,214,0,0.08)', border: '1px solid rgba(255,214,0,0.3)', borderRadius: '4px', padding: '12px 20px', marginBottom: '16px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Rajdhani, sans-serif', color: '#ffd600', fontSize: '14px', fontWeight: 600 }}>
                      Showing sample data — live Turo scraping was unavailable. Estimates are based on typical NC market rates.
                    </div>
                  </div>
                )}
                {results.dataSource === 'live' && results.similarMatches > 0 && (
                  <div style={{ background: 'rgba(0,255,106,0.05)', border: '1px solid rgba(0,255,106,0.15)', borderRadius: '4px', padding: '10px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00ff6a" strokeWidth="2" style={{ flexShrink: 0, opacity: 0.7 }}>
                      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
                    </svg>
                    <div style={{ fontFamily: 'Rajdhani, sans-serif', color: '#aaa', fontSize: '13px', fontWeight: 500 }}>
                      {results.exactMatches > 0 ? (
                        <>
                          Showing <span style={{ color: '#00ff6a', fontWeight: 700 }}>{results.exactMatches}</span> exact {results.exactMatches === 1 ? 'match' : 'matches'} for {results.searchQuery}
                          {' + '}<span style={{ color: '#ccc', fontWeight: 600 }}>{results.similarMatches}</span> similar vehicles in {results.city} for market comparison.
                        </>
                      ) : (
                        <>
                          No exact matches for {results.searchQuery} — showing <span style={{ color: '#ccc', fontWeight: 600 }}>{results.similarMatches}</span> similar vehicles in {results.city} for market comparison.
                        </>
                      )}
                    </div>
                  </div>
                )}
                {results.metrics?.verdict && (
                  <VerdictBanner
                    verdict={results.metrics.verdict.verdict}
                    score={results.metrics.verdict.score}
                  />
                )}
                <MetricCards metrics={results.metrics} />
                <InvestmentCalculator
                  avgDailyPrice={results.metrics?.competitiveDensity?.avgDailyPrice}
                />
                {results.aiSummary && <AISummary summary={results.aiSummary} />}
                <DataTable
                  title="Top Cars by Volume"
                  data={results.rankedByVolume}
                  columns={volumeColumns}
                  icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>}
                />
                <DataTable
                  title="Top Cars by Estimated Profit"
                  data={results.rankedByProfit}
                  columns={profitColumns}
                  icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
                />
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '12px', color: '#555', textAlign: 'center', marginTop: '-16px', marginBottom: '32px' }}>
                  <span style={{ color: '#00ff6a' }}>HOT</span> = 50+ trips or new listing w/ 5+ trips &nbsp;|&nbsp;
                  <span style={{ color: '#ffd600' }}>WARM</span> = 10+ trips or new w/ bookings &nbsp;|&nbsp;
                  <span style={{ color: '#ff3b3b' }}>COLD</span> = unproven demand.
                  Trips are lifetime totals from Turo (recent breakdown unavailable).
                </div>
              </>
            )}
          </>
        )}

        {/* === FLOW 2: Market Leaders === */}
        {mode === 'leaders' && (
          <MarketLeaders />
        )}

        {/* Footer */}
        <footer style={{ textAlign: 'center', marginTop: '64px', paddingTop: '32px', borderTop: '1px solid #1e1e1e' }}>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', color: '#888', fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Just send it!
          </div>
        </footer>
      </div>
    </div>
  );
}
