import { useState } from 'react';

function calculateROI(purchasePrice, avgDailyPrice) {
  const occupancyRate = 0.65;
  const turoFeeRate = 0.25;
  const monthlyInsurance = 150;
  const monthlyMaintenance = 100;
  const monthlyDepreciation = purchasePrice * 0.01;

  const monthlyRevenue = Math.round(avgDailyPrice * 30 * occupancyRate);
  const turoFees = Math.round(monthlyRevenue * turoFeeRate);
  const monthlyCosts = Math.round(monthlyInsurance + monthlyMaintenance + monthlyDepreciation + turoFees);
  const monthlyProfit = monthlyRevenue - monthlyCosts;
  const annualROI = Math.round((monthlyProfit * 12 / purchasePrice) * 100);
  const payoffMonths = monthlyProfit > 0 ? Math.ceil(purchasePrice / monthlyProfit) : null;

  return { monthlyRevenue, monthlyCosts, monthlyProfit, annualROI, payoffMonths, turoFees, monthlyInsurance, monthlyMaintenance, monthlyDepreciation: Math.round(monthlyDepreciation) };
}

export default function InvestmentCalculator({ avgDailyPrice }) {
  const [isOpen, setIsOpen] = useState(false);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [roi, setRoi] = useState(null);

  const formatNumber = (val) => {
    const digits = val.replace(/\D/g, '');
    return digits ? parseInt(digits).toLocaleString() : '';
  };

  const rawPrice = parseInt(purchasePrice.replace(/\D/g, '')) || 0;

  const handlePriceChange = (e) => {
    const formatted = formatNumber(e.target.value);
    setPurchasePrice(formatted);
    setRoi(null);
  };

  const handleCalculate = () => {
    if (!rawPrice || !avgDailyPrice) return;
    setRoi(calculateROI(rawPrice, avgDailyPrice));
  };

  const verdict = roi ? (roi.annualROI >= 20 ? 'STRONG BUY' : roi.annualROI >= 10 ? 'BUY' : roi.annualROI >= 0 ? 'MAYBE' : 'PASS') : null;
  const verdictColor = verdict === 'STRONG BUY' || verdict === 'BUY' ? '#00ff6a' : verdict === 'MAYBE' ? '#ffd600' : '#ff3b3b';

  return (
    <div style={{
      background: '#141414',
      border: isOpen ? '1px solid rgba(0,255,106,0.3)' : '1px solid #1e1e1e',
      borderRadius: '4px',
      marginBottom: '32px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'border-color 0.3s',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #00ff6a, transparent)' }} />

      {/* Toggle header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          padding: '16px 20px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00ff6a" strokeWidth="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
          </svg>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '12px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#00ff6a' }}>
              Investment Calculator
            </div>
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '14px', color: '#888', marginTop: '2px' }}>
              Thinking about buying? Enter your purchase price for a full ROI breakdown
            </div>
          </div>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00ff6a" strokeWidth="2"
          style={{ flexShrink: 0, transition: 'transform 0.3s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {/* Expandable content */}
      {isOpen && (
        <div className="calc-content" style={{ padding: '0 20px 24px', borderTop: '1px solid #1e1e1e' }}>
          <div className="calc-input-row" style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', marginTop: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ fontFamily: 'Orbitron, sans-serif', display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#888', marginBottom: '8px' }}>
                Purchase Price
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#00ff6a', fontWeight: 700, fontSize: '18px', fontFamily: 'Rajdhani, sans-serif' }}>$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={purchasePrice}
                  onChange={handlePriceChange}
                  placeholder="e.g. 25,000"
                  style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    width: '100%',
                    padding: '14px 16px 14px 30px',
                    background: '#0a0a0a',
                    border: '1px solid #1e1e1e',
                    borderRadius: '4px',
                    color: '#f0f0f0',
                    fontSize: '18px',
                    fontWeight: 600,
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                />
              </div>
            </div>
            <div style={{ flex: 'none' }}>
              <button
                onClick={handleCalculate}
                disabled={!rawPrice}
                style={{
                  fontFamily: 'Orbitron, sans-serif',
                  height: '50px',
                  padding: '0 28px',
                  background: rawPrice ? '#00ff6a' : '#1e1e1e',
                  border: 'none',
                  borderRadius: '4px',
                  color: rawPrice ? '#0a0a0a' : '#888',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  cursor: rawPrice ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
                Calculate ROI
              </button>
            </div>
          </div>

          {/* ROI Results */}
          {roi && (
            <div style={{ marginTop: '24px' }}>
              {/* Verdict */}
              <div style={{
                textAlign: 'center',
                padding: '16px',
                marginBottom: '16px',
                borderRadius: '4px',
                background: `${verdictColor}10`,
                border: `1px solid ${verdictColor}40`,
              }}>
                <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '28px', fontWeight: 900, color: verdictColor, letterSpacing: '4px' }}>
                  {verdict}
                </div>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '13px', color: '#888', marginTop: '4px' }}>
                  {roi.annualROI >= 10 ? 'This looks like a solid investment based on the data' : roi.annualROI >= 0 ? 'Marginal returns — review the numbers carefully' : 'The numbers don\'t support this purchase price'}
                </div>
              </div>

              {/* Metrics grid */}
              <div className="calc-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', padding: '20px', background: '#0a0a0a', borderRadius: '4px', border: '1px solid #1e1e1e' }}>
                <div>
                  <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#888', marginBottom: '4px' }}>Annual ROI</div>
                  <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '22px', fontWeight: 900, color: roi.annualROI >= 0 ? '#00ff6a' : '#ff3b3b' }}>{roi.annualROI}%</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#888', marginBottom: '4px' }}>Monthly Profit</div>
                  <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '22px', fontWeight: 900, color: roi.monthlyProfit >= 0 ? '#00ff6a' : '#ff3b3b' }}>${roi.monthlyProfit}</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#888', marginBottom: '4px' }}>Monthly Revenue</div>
                  <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '20px', fontWeight: 700, color: '#ccc' }}>${roi.monthlyRevenue}</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#888', marginBottom: '4px' }}>Monthly Costs</div>
                  <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '20px', fontWeight: 700, color: '#ff3b3b' }}>${roi.monthlyCosts}</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#888', marginBottom: '4px' }}>Payoff Period</div>
                  <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '20px', fontWeight: 700, color: '#ccc' }}>{roi.payoffMonths ? `${roi.payoffMonths} mo` : '—'}</div>
                </div>
              </div>

              {/* Cost breakdown */}
              <div style={{ marginTop: '12px', padding: '16px 20px', background: '#0a0a0a', borderRadius: '4px', border: '1px solid #1e1e1e' }}>
                <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#888', marginBottom: '10px' }}>Cost Breakdown (Monthly)</div>
                {[
                  { label: 'Turo fees (25%)', value: roi.turoFees, source: 'Turo host fee — standard plan' },
                  { label: 'Insurance', value: roi.monthlyInsurance, source: 'Avg commercial rideshare policy in NC' },
                  { label: 'Maintenance', value: roi.monthlyMaintenance, source: 'AAA avg for sedans — tires, oil, brakes' },
                  { label: 'Depreciation', value: roi.monthlyDepreciation, source: `1% of purchase price/mo — IRS standard` },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 0', fontFamily: 'Rajdhani, sans-serif', fontSize: '14px' }}>
                    <div>
                      <span style={{ color: '#888' }}>{item.label}</span>
                      <div style={{ fontSize: '11px', color: '#555', marginTop: '1px' }}>{item.source}</div>
                    </div>
                    <span style={{ color: '#ccc', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '16px' }}>${item.value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', marginTop: '8px', borderTop: '1px solid #1e1e1e', fontFamily: 'Rajdhani, sans-serif', fontSize: '15px', fontWeight: 700 }}>
                  <span style={{ color: '#888' }}>Total costs</span>
                  <span style={{ color: '#ff3b3b' }}>${roi.monthlyCosts}</span>
                </div>
              </div>

              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '11px', color: '#555', marginTop: '10px', textAlign: 'center' }}>
                * Revenue assumes 65% occupancy (Turo avg). Costs are estimates — insurance varies by provider, maintenance by vehicle age/mileage. Not financial advice.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
