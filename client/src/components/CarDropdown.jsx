import { useState, useRef, useEffect } from 'react';
import { CARS } from '../data/cars';

export default function CarDropdown({ value, onChange }) {
  const [inputValue, setInputValue] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const wrapperRef = useRef(null);

  const getFilteredCars = () => {
    const lower = inputValue.toLowerCase();
    const results = [];
    for (const [make, models] of Object.entries(CARS)) {
      const matching = models.filter(m => {
        const full = `${make} ${m}`.toLowerCase();
        return !inputValue || full.includes(lower);
      });
      if (matching.length > 0) {
        results.push({ make, models: matching });
      }
    }
    return results;
  };

  const filtered = getFilteredCars();
  const flatOptions = filtered.flatMap(g => g.models.map(m => `${g.make} ${m}`));

  const selectCar = (val) => {
    setInputValue(val);
    onChange(val);
    setIsOpen(false);
  };

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        if (!flatOptions.includes(inputValue)) {
          setInputValue(value || '');
        }
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [inputValue, value, flatOptions]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIdx(i => Math.min(i + 1, flatOptions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIdx >= 0 && flatOptions[highlightedIdx]) {
        selectCar(flatOptions[highlightedIdx]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', zIndex: 50 }}>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => { setInputValue(e.target.value); setIsOpen(true); setHighlightedIdx(-1); onChange(''); }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Type to search cars..."
        autoComplete="off"
        style={{
          fontFamily: 'Rajdhani, sans-serif',
          width: '100%',
          padding: '12px 36px 12px 16px',
          background: '#0a0a0a',
          border: '1px solid #1e1e1e',
          borderRadius: '4px',
          color: '#f0f0f0',
          fontSize: '16px',
          fontWeight: 600,
          outline: 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
        onFocusCapture={(e) => { e.target.style.borderColor = '#00ff6a'; e.target.style.boxShadow = '0 0 0 2px rgba(0,255,106,0.15), inset 0 0 12px rgba(0,255,106,0.15)'; }}
        onBlurCapture={(e) => { e.target.style.borderColor = '#1e1e1e'; e.target.style.boxShadow = 'none'; }}
      />
      {inputValue ? (
        <button
          onClick={() => { setInputValue(''); onChange(''); setIsOpen(false); }}
          style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      ) : (
        <svg style={{ position: 'absolute', right: '14px', top: '50%', transform: isOpen ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%)', pointerEvents: 'none', transition: 'transform 0.2s' }} width="12" height="8" viewBox="0 0 12 8">
          <path d="M1 1l5 5 5-5" stroke="#00ff6a" strokeWidth="2" fill="none"/>
        </svg>
      )}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: '#141414',
          border: '1px solid #1e1e1e',
          borderRadius: '4px',
          maxHeight: '280px',
          overflowY: 'auto',
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
          zIndex: 50,
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: '#888', fontSize: '14px' }}>No matching cars found</div>
          ) : (
            filtered.map(({ make, models }, gi) => (
              <div key={make}>
                <div style={{
                  fontFamily: 'Orbitron, sans-serif',
                  padding: '8px 12px 4px',
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '3px',
                  textTransform: 'uppercase',
                  color: '#00cc55',
                  borderTop: gi > 0 ? '1px solid #1e1e1e' : 'none',
                }}>{make}</div>
                {models.map(model => {
                  const full = `${make} ${model}`;
                  const idx = flatOptions.indexOf(full);
                  const isHighlighted = idx === highlightedIdx;
                  return (
                    <div
                      key={full}
                      style={{
                        fontFamily: 'Rajdhani, sans-serif',
                        padding: '10px 16px',
                        cursor: 'pointer',
                        fontSize: '15px',
                        fontWeight: 600,
                        transition: 'background 0.15s, color 0.15s',
                        background: isHighlighted ? 'rgba(0,255,106,0.15)' : 'transparent',
                        color: isHighlighted ? '#00ff6a' : '#aaa',
                      }}
                      onMouseDown={(e) => { e.preventDefault(); selectCar(full); }}
                      onMouseEnter={() => setHighlightedIdx(idx)}
                    >
                      {full}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
