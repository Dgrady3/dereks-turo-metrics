import { useState, useEffect } from 'react';
import { API_BASE, authHeaders, getToken } from './api';
import SearchPanel from './components/SearchPanel';
import LoadingState from './components/LoadingState';
import MetricCards from './components/MetricCards';
import VehicleList from './components/VehicleList';
import InvestmentCalculator from './components/InvestmentCalculator';
import MarketLeaders from './components/MarketLeaders';
import LoginButton from './components/LoginButton';
import DemoBadge from './components/DemoBadge';

const MODES = [
  { key: 'search', label: 'Search Market', desc: 'Look up a specific make & model', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
  )},
  { key: 'leaders', label: 'Market Leaders', desc: 'Find the best opportunities by category', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 01-2.5-2.5v0A2.5 2.5 0 014.5 4H6"/><path d="M18 9h1.5A2.5 2.5 0 0022 6.5v0A2.5 2.5 0 0019.5 4H18"/><path d="M6 4h12v5a6 6 0 01-12 0V4z"/><path d="M12 15v3"/><path d="M8 21h8"/><path d="M8 21v-3h8v3"/></svg>
  )},
];

export default function App() {
  const [mode, setMode] = useState('search');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // Check token on mount
  useEffect(() => {
    if (getToken()) {
      fetch(`${API_BASE}/api/me`, { headers: authHeaders() })
        .then(r => r.json())
        .then(data => { if (data.authenticated) setUser(data.user); })
        .catch(() => {});
    }
  }, []);

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
        headers: authHeaders(),
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
      <svg className="bg-gear-1" style={{ position: 'fixed', top: '-200px', right: '-150px', width: '600px', height: '600px', opacity: 0.045, zIndex: 0, animation: 'gear-spin 60s linear infinite' }} viewBox="0 0 100 100" fill="none">
        <path d="M50 15 L54 0 H46 L50 15 M50 85 L54 100 H46 L50 85 M15 50 L0 54 V46 L15 50 M85 50 L100 54 V46 L85 50 M22 22 L11 11 L18 4 L29 15 M78 22 L89 11 L82 4 L71 15 M22 78 L11 89 L18 96 L29 85 M78 78 L89 89 L82 96 L71 85" stroke="#00ff6a" strokeWidth="6"/>
        <circle cx="50" cy="50" r="35" stroke="#00ff6a" strokeWidth="8"/>
        <circle cx="50" cy="50" r="18" stroke="#00ff6a" strokeWidth="6"/>
      </svg>

      {/* Background gear 2 */}
      <svg className="bg-gear-2" style={{ position: 'fixed', bottom: '-300px', left: '-200px', width: '800px', height: '800px', opacity: 0.045, zIndex: 0, animation: 'gear-spin 90s linear infinite reverse' }} viewBox="0 0 100 100" fill="none">
        <path d="M50 15 L54 0 H46 L50 15 M50 85 L54 100 H46 L50 85 M15 50 L0 54 V46 L15 50 M85 50 L100 54 V46 L85 50 M22 22 L11 11 L18 4 L29 15 M78 22 L89 11 L82 4 L71 15 M22 78 L11 89 L18 96 L29 85 M78 78 L89 89 L82 96 L71 85" stroke="#00ff6a" strokeWidth="6"/>
        <circle cx="50" cy="50" r="35" stroke="#00ff6a" strokeWidth="8"/>
        <circle cx="50" cy="50" r="18" stroke="#00ff6a" strokeWidth="6"/>
      </svg>

      {/* Main content */}
      <div className="app-content" style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 24px 80px', position: 'relative', zIndex: 2 }}>
        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          {/* Login button - top right */}
          <div className="login-row" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
            <LoginButton user={user} onAuthChange={setUser} />
          </div>

          <div style={{ display: 'inline-block', position: 'relative' }}>
            <div className="app-header-title" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900, fontSize: 'clamp(32px, 6vw, 56px)', textTransform: 'uppercase', lineHeight: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span className="header-dereks" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '13px', letterSpacing: '8px', textTransform: 'uppercase', color: '#888', marginBottom: '4px' }}>Derek&apos;s</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3em' }}>
                <span className="header-turo" style={{ color: '#00ff6a', textShadow: '0 0 30px rgba(0,255,106,0.35), 0 0 60px rgba(0,255,106,0.15)' }}>TURO</span>
                <span className="header-metrics" style={{ color: '#f0f0f0' }}>Metrics</span>
              </div>
            </div>
            <div className="app-subtitle" style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '14px', fontWeight: 500, color: '#888', letterSpacing: '3px', textTransform: 'uppercase', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <span style={{ width: '40px', height: '1px', background: 'linear-gradient(90deg, transparent, #00cc55, transparent)' }} />
              North Carolina Market Intel
              <span style={{ width: '40px', height: '1px', background: 'linear-gradient(90deg, transparent, #00cc55, transparent)' }} />
            </div>
          </div>
        </header>

        {/* Demo Badge */}
        {!user && <DemoBadge />}

        {/* Mode Toggle — Card style */}
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '15px', fontWeight: 600, color: '#666', letterSpacing: '3px', textTransform: 'uppercase', textAlign: 'center', marginBottom: '12px' }}>Select a mode</div>
        <div className="mode-toggle" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxWidth: '520px', margin: '0 auto 40px' }}>
          {MODES.map(m => {
            const active = mode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => handleModeChange(m.key)}
                className="mode-card"
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = '#00ff6a80'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#141414'; }}}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = '#0e0e0e'; }}}
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  padding: '16px 16px',
                  border: active ? '1px solid #00ff6a' : '1px dashed #333',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: active ? 'rgba(0,255,106,0.08)' : '#0e0e0e',
                  color: active ? '#00ff6a' : '#888',
                  boxShadow: active ? '0 0 20px rgba(0,255,106,0.1)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  textAlign: 'center',
                }}
              >
                <span style={{ opacity: active ? 1 : 0.5 }}>{m.icon}</span>
                <span style={{
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                }}>
                  {m.label}
                </span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  textTransform: 'none',
                  opacity: active ? 0.7 : 0.4,
                  lineHeight: 1.3,
                  color: active ? '#ccc' : '#666',
                }}>
                  {m.desc}
                </span>
              </button>
            );
          })}
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
                {results.dataSource === 'sample' && !results.isDemo && (
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
                <MetricCards metrics={results.metrics} />
                <VehicleList
                  data={results.sortBy === 'profit' ? results.rankedByProfit : results.rankedByVolume}
                  sortBy={results.sortBy || 'volume'}
                  aiSummary={results.aiSummary}
                  title={`${results.searchQuery} in ${results.city}`}
                />
                <InvestmentCalculator
                  avgDailyPrice={results.metrics?.competitiveDensity?.avgDailyPrice}
                />
              </>
            )}
          </>
        )}

        {/* === FLOW 2: Market Leaders === */}
        {mode === 'leaders' && (
          <MarketLeaders onVehicleSearch={({ make, model, city }) => {
            setMode('search');
            setResults(null);
            setError(null);
            handleSearch({ make, model, city, sortBy: 'volume' });
          }} />
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
