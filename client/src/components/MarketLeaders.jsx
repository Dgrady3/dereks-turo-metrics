import { useState } from 'react';
import { API_BASE } from '../api';
import { NC_CITIES } from '../data/cars';
import LoadingState from './LoadingState';

const CATEGORIES = [
  { key: 'bestProfit', label: 'Top Profit', icon: '$' },
  { key: 'bestVolume', label: 'Most Booked', icon: '↑' },
  { key: 'bestBudget', label: 'Best Budget', icon: '★' },
  { key: 'bestPremium', label: 'Best Premium', icon: '◆' },
  { key: 'leastCompetition', label: 'Low Competition', icon: '○' },
];

export default function MarketLeaders() {
  const [city, setCity] = useState('charlotte');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('bestProfit');

  const handleScan = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`${API_BASE}/api/market-leaders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Scan failed');
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const activeCategory = data?.categories?.[activeTab] || [];

  return (
    <div className="market-leaders-panel" style={{
      background: '#141414',
      border: '1px solid #1e1e1e',
      borderRadius: '4px',
      padding: '28px 32px',
      marginBottom: '32px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #ffd600, transparent)' }} />

      {/* Header */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '4px', color: '#ffd600', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          Market Leaders
        </div>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '13px', color: '#888', marginBottom: '16px' }}>
          Scan all vehicles in a market to find the best opportunities
        </div>
        <div className="market-leaders-controls" style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={{
              fontFamily: 'Rajdhani, sans-serif',
              flex: 'none',
              minWidth: '200px',
              padding: '10px 32px 10px 14px',
              background: '#0a0a0a',
              border: '1px solid #1e1e1e',
              borderRadius: '3px',
              color: '#f0f0f0',
              fontSize: '14px',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23ffd600' stroke-width='1.5' fill='none'/%3E%3C/svg%3E\")",
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
            }}
          >
            {NC_CITIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <button
            onClick={handleScan}
            disabled={loading}
            style={{
              fontFamily: 'Orbitron, sans-serif',
              height: '42px',
              padding: '0 24px',
              background: loading ? '#1e1e1e' : '#ffd600',
              border: 'none',
              borderRadius: '3px',
              color: loading ? '#888' : '#0a0a0a',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? 'Scanning...' : 'Scan Market'}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <LoadingState
          accentColor="#ffd600"
          phases={[
            { label: 'Loading market data', detail: 'Fetching cached vehicle listings...', duration: 1500 },
            { label: 'Ranking opportunities', detail: 'Calculating profit, demand & competition...', duration: 1500 },
            { label: 'Yeee-yeee!', detail: 'Almost there...', duration: 1000 },
          ]}
        />
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: '16px', textAlign: 'center', color: '#ff3b3b', fontFamily: 'Rajdhani, sans-serif', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* Results */}
      {data && !loading && (
        <>
          {/* Stats bar */}
          <div className="market-leaders-stats" style={{ display: 'flex', gap: '24px', marginBottom: '16px', fontFamily: 'Rajdhani, sans-serif', fontSize: '13px', color: '#888', flexWrap: 'wrap' }}>
            <span><span style={{ color: '#ffd600', fontWeight: 700 }}>{data.totalVehicles}</span> vehicles scanned</span>
            <span><span style={{ color: '#ffd600', fontWeight: 700 }}>{data.totalModels}</span> unique models</span>
            <span>{data.city}</span>
            {data.lastUpdated && <span>Updated: {new Date(data.lastUpdated).toLocaleString()}</span>}
          </div>

          {/* Category tabs */}
          <div className="market-leaders-tabs" style={{ display: 'flex', gap: '4px', marginBottom: '16px', overflowX: 'auto' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveTab(cat.key)}
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  padding: '6px 14px',
                  border: 'none',
                  borderRadius: '3px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  background: activeTab === cat.key ? '#ffd600' : '#0a0a0a',
                  color: activeTab === cat.key ? '#0a0a0a' : '#888',
                  border: activeTab === cat.key ? 'none' : '1px solid #1e1e1e',
                }}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Rajdhani, sans-serif', minWidth: '700px' }}>
              <thead>
                <tr>
                  {['#', 'Vehicle', 'Avg $/Day', 'Demand', 'Avg/Mo', 'Lifetime Trips', 'Rating', 'Listings', 'Est. Monthly'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: h === '#' ? 'center' : 'left', fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#888', borderBottom: '1px solid #1e1e1e', fontFamily: 'Orbitron, sans-serif' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeCategory.map((car, i) => {
                  const demandColor = car.demandSignal === 'hot' ? '#00ff6a' : car.demandSignal === 'warm' ? '#ffd600' : '#ff3b3b';
                  const demandLabel = car.demandSignal === 'hot' ? 'HOT' : car.demandSignal === 'warm' ? 'WARM' : 'COLD';
                  return (
                  <tr key={`${car.make}-${car.model}`} style={{ borderBottom: '1px solid #111' }}>
                    <td style={{ padding: '10px 12px', textAlign: 'center', verticalAlign: 'middle', color: i < 3 ? '#ffd600' : '#555', fontWeight: 700, fontSize: '14px' }}>
                      {i + 1}
                    </td>
                    <td style={{ padding: '10px 12px', verticalAlign: 'middle', fontWeight: 600, fontSize: '15px', color: '#f0f0f0' }}>
                      {car.make} {car.model}
                    </td>
                    <td style={{ padding: '10px 12px', verticalAlign: 'middle', color: '#00ff6a', fontWeight: 700, fontSize: '15px' }}>
                      ${car.avgDailyPrice}
                    </td>
                    <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                      <div>
                        <span style={{ color: demandColor, fontWeight: 700, fontSize: '11px', letterSpacing: '1px', padding: '2px 8px', background: `${demandColor}15`, border: `1px solid ${demandColor}40`, borderRadius: '3px' }}>
                          {demandLabel}
                        </span>
                        {car.demandReason && (
                          <div style={{ fontSize: '11px', color: '#666', marginTop: '3px', lineHeight: 1.3, maxWidth: '200px' }}>
                            {car.demandReason}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', verticalAlign: 'middle', color: '#00ff6a', fontWeight: 700, fontSize: '14px' }}>
                      {car.avgMonthlyTrips}/mo
                    </td>
                    <td style={{ padding: '10px 12px', verticalAlign: 'middle', color: '#ccc', fontSize: '14px' }}>
                      {car.avgTrips}
                    </td>
                    <td style={{ padding: '10px 12px', verticalAlign: 'middle', color: '#ccc', fontSize: '14px' }}>
                      {car.avgRating ? `${car.avgRating} ★` : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', verticalAlign: 'middle', color: car.count <= 3 ? '#00ff6a' : car.count <= 8 ? '#ffd600' : '#ff3b3b', fontWeight: 600, fontSize: '14px' }}>
                      {car.count}
                    </td>
                    <td style={{ padding: '10px 12px', verticalAlign: 'middle', color: car.estimatedMonthly > 300 ? '#00ff6a' : car.estimatedMonthly > 100 ? '#ffd600' : '#ff3b3b', fontWeight: 700, fontSize: '15px' }}>
                      ${car.estimatedMonthly.toLocaleString()}
                    </td>
                  </tr>
                  );
                })}
                {activeCategory.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '14px' }}>
                      No vehicles in this category
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '11px', color: '#555', marginTop: '12px', textAlign: 'center' }}>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ color: '#00ff6a' }}>HOT</span> = 50+ trips or new listing w/ 5+ trips &nbsp;|&nbsp;
              <span style={{ color: '#ffd600' }}>WARM</span> = 10+ trips or new w/ bookings &nbsp;|&nbsp;
              <span style={{ color: '#ff3b3b' }}>COLD</span> = unproven demand
            </div>
            * Profit estimates use demand-weighted occupancy (20-70%), 25% Turo fees, $425/mo costs. Trips are lifetime totals from Turo.
          </div>
        </>
      )}
    </div>
  );
}
