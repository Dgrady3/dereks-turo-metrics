export default function DataTable({ title, data, columns, icon }) {
  if (!data || data.length === 0) return null;

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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
