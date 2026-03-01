const MetricCard = ({ label, value, sub, icon }) => (
  <div className="metric-card" style={{
    background: '#141414',
    border: '1px solid #1e1e1e',
    borderRadius: '4px',
    padding: '20px',
    position: 'relative',
    flex: '1 1 200px',
    minWidth: '200px',
  }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #00ff6a, transparent)' }} />
    <div style={{ fontFamily: 'Orbitron, sans-serif', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '10px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#888' }}>
      {icon}
      {label}
    </div>
    <div className="metric-card-value" style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '28px', fontWeight: 900, color: '#00ff6a' }}>
      {value}
    </div>
    {sub && (
      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '14px', color: '#888', marginTop: '4px' }}>
        {sub}
      </div>
    )}
  </div>
);

export default function MetricCards({ metrics }) {
  if (!metrics) return null;

  const { roi, supplyDemand, revenuePerListing, competitiveDensity, avgMonthlyProfit } = metrics;

  // ROI card: show annual ROI if purchase price was given, otherwise show avg monthly profit
  const roiValue = roi?.annualROI ? `${roi.annualROI}%` : avgMonthlyProfit != null ? `$${avgMonthlyProfit}` : 'N/A';
  const roiSub = roi?.monthsToBreakeven
    ? `${roi.monthsToBreakeven} months to break even`
    : avgMonthlyProfit != null ? 'Est. monthly profit' : null;
  const roiLabel = roi ? 'Est. ROI' : 'Monthly Profit';

  // Supply/Demand: 0-10 scale (demand from trips + scarcity from low listings)
  const sdScore = supplyDemand?.score != null ? supplyDemand.score.toFixed(1) : null;
  const sdLabel = supplyDemand?.avgTripsPerListing != null
    ? `${supplyDemand.avgTripsPerListing} avg trips across ${supplyDemand.totalListings} listing${supplyDemand.totalListings !== 1 ? 's' : ''}`
    : null;

  const cards = [
    {
      label: roiLabel,
      value: roiValue,
      sub: roiSub,
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
    },
    {
      label: 'Supply / Demand',
      value: sdScore ? `${sdScore}/10` : 'N/A',
      sub: sdLabel,
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>,
    },
    {
      label: 'Avg Revenue',
      value: revenuePerListing?.average ? `$${revenuePerListing.average}` : 'N/A',
      sub: revenuePerListing?.median ? `Median: $${revenuePerListing.median}/mo` : null,
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
    },
    {
      label: 'Competition',
      value: competitiveDensity?.saturation || 'N/A',
      sub: competitiveDensity?.totalListings ? `${competitiveDensity.totalListings} listings in area` : null,
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    },
  ];

  return (
    <div className="metric-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
      {cards.map((card) => (
        <MetricCard key={card.label} {...card} />
      ))}
    </div>
  );
}
