function turoUrl(row) {
  if (!row?.vehicleId) return null;
  const make = (row.make || '').toLowerCase();
  const model = (row.model || '').toLowerCase().replace(/ /g, '-');
  return `https://turo.com/us/en/car-rental/united-states/${make}/${model}/${row.vehicleId}`;
}

export default function DataTable({ title, data, columns, icon }) {
  if (!data || data.length === 0) return null;

  const hasVehicleIds = data.some(row => row.vehicleId);

  return (
    <div style={{ background: '#141414', border: '1px solid #1e1e1e', borderRadius: '4px', marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #00ff6a, transparent)' }} />
      <div className="data-table-header" style={{ fontFamily: 'Orbitron, sans-serif', display: 'flex', alignItems: 'center', gap: '8px', padding: '20px 20px 12px', fontSize: '11px', fontWeight: 700, letterSpacing: '4px', textTransform: 'uppercase', color: '#00ff6a' }}>
        {icon}
        {title}
      </div>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table className="data-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '480px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e1e1e' }}>
              <th style={{ fontFamily: 'Orbitron, sans-serif', padding: '12px 20px', fontSize: '10px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#888', width: '40px' }}>#</th>
              {columns.map((col) => (
                <th key={col.key} style={{ fontFamily: 'Orbitron, sans-serif', padding: '12px 20px', fontSize: '10px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: '#888' }}>
                  {col.label}
                </th>
              ))}
              {hasVehicleIds && <th style={{ width: '40px' }} />}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} style={{ borderBottom: i < data.length - 1 ? '1px solid #1e1e1e' : 'none' }}>
                <td style={{ fontFamily: 'Orbitron, sans-serif', padding: '12px 20px', color: '#00ff6a', fontWeight: 700, fontSize: '14px' }}>
                  {i + 1}
                </td>
                {columns.map((col) => (
                  <td key={col.key} style={{ fontFamily: 'Rajdhani, sans-serif', padding: '12px 20px', color: '#ccc', fontSize: '15px', fontWeight: 600 }}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {hasVehicleIds && (
                  <td style={{ padding: '12px 20px' }}>
                    {row.vehicleId && (
                      <a
                        href={turoUrl(row)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#00ff6a', fontSize: '12px', textDecoration: 'none', opacity: 0.6, transition: 'opacity 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                        title="View on Turo"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </a>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
