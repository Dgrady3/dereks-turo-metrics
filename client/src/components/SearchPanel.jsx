import { useState } from 'react';
import CarDropdown from './CarDropdown';
import { NC_CITIES } from '../data/cars';

const labelStyle = {
  fontFamily: 'Orbitron, sans-serif',
  display: 'block',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  color: '#888',
  marginBottom: '8px',
};

const inputStyle = {
  fontFamily: 'Rajdhani, sans-serif',
  width: '100%',
  padding: '12px 16px',
  paddingRight: '36px',
  background: '#0a0a0a',
  border: '1px solid #1e1e1e',
  borderRadius: '4px',
  color: '#f0f0f0',
  fontSize: '16px',
  fontWeight: 600,
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

export default function SearchPanel({ onSearch, loading }) {
  const [selectedCar, setSelectedCar] = useState('');
  const [city, setCity] = useState('charlotte');
  const [sortBy, setSortBy] = useState('volume');

  const handleSearch = () => {
    if (!selectedCar) return;
    const [make, ...modelParts] = selectedCar.split(' ');
    const model = modelParts.join(' ');
    onSearch({ make, model, city, sortBy });
  };

  return (
    <div className="search-panel" style={{
      background: '#141414',
      border: '1px solid #1e1e1e',
      borderRadius: '4px',
      padding: '28px 32px',
      marginBottom: '32px',
      position: 'relative',
      overflow: 'visible',
      zIndex: 10,
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #00ff6a, transparent)' }} />

      <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '4px', color: '#00ff6a', textTransform: 'uppercase', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        Search Internal Turo Market Data
      </div>

      <div className="search-controls" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
          <label style={labelStyle}>Make / Model</label>
          <CarDropdown value={selectedCar} onChange={setSelectedCar} />
        </div>

        <div style={{ flex: '0.6 1 160px', minWidth: '160px' }}>
          <label style={labelStyle}>Location</label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={{
              ...inputStyle,
              cursor: 'pointer',
              appearance: 'none',
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2300ff6a' stroke-width='2' fill='none'/%3E%3C/svg%3E\")",
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 14px center',
            }}
          >
            {NC_CITIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div className="sort-row" style={{ flex: 'none', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <div>
            <label style={labelStyle}>Sort By</label>
            <div style={{ display: 'flex', border: '1px solid #1e1e1e', borderRadius: '3px', overflow: 'hidden', height: '38px' }}>
              {['volume', 'profit'].map(s => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    padding: '0 14px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    background: sortBy === s ? '#00ff6a' : '#0a0a0a',
                    color: sortBy === s ? '#0a0a0a' : '#888',
                    boxShadow: sortBy === s ? '0 0 20px rgba(0,255,106,0.15)' : 'none',
                  }}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <button
              onClick={handleSearch}
              disabled={loading || !selectedCar}
              style={{
                fontFamily: 'Orbitron, sans-serif',
                height: '38px',
                padding: '0 20px',
                background: loading || !selectedCar ? '#1e1e1e' : '#00ff6a',
                border: loading || !selectedCar ? '1px solid #333' : 'none',
                borderRadius: '3px',
                color: loading || !selectedCar ? '#888' : '#0a0a0a',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                cursor: loading || !selectedCar ? 'not-allowed' : 'pointer',
                opacity: 1,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
