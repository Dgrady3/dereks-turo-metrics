import { useState, useEffect } from 'react';

const DEFAULT_PHASES = [
  { label: 'Searching Turo listings', detail: 'Finding cars in your area...', duration: 4000 },
  { label: 'Pulling rental data', detail: 'Gathering prices, trips & ratings...', duration: 5000 },
  { label: 'Analyzing market trends', detail: 'Crunching supply & demand numbers...', duration: 4000 },
  { label: 'Looking up cost estimates', detail: 'Insurance, fuel, maintenance & depreciation...', duration: 3000 },
  { label: 'Generating AI summary', detail: 'Claude is reviewing the data...', duration: 6000 },
];

export default function LoadingState({ phases, accentColor }) {
  const activePhases = phases || DEFAULT_PHASES;
  const color = accentColor || '#00ff6a';
  const totalTime = activePhases.reduce((sum, p) => sum + p.duration, 0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setElapsed(0);
    const interval = setInterval(() => {
      setElapsed(prev => prev + 100);
    }, 100);
    return () => clearInterval(interval);
  }, [phases]);

  let accumulated = 0;
  let currentPhase = activePhases[activePhases.length - 1];
  let phaseIndex = activePhases.length - 1;
  for (let i = 0; i < activePhases.length; i++) {
    if (elapsed < accumulated + activePhases[i].duration) {
      currentPhase = activePhases[i];
      phaseIndex = i;
      break;
    }
    accumulated += activePhases[i].duration;
  }

  const progress = Math.min((elapsed / totalTime) * 100, 95);
  const estimatedRemaining = Math.max(0, Math.ceil((totalTime - elapsed) / 1000));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
      {/* Interlocking gear spinner */}
      <div style={{ position: 'relative', width: '80px', height: '80px', marginBottom: '28px' }}>
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '64px', height: '64px', animation: 'gear-spin 2s linear infinite' }} viewBox="0 0 100 100" fill="none">
          <path d="M50 15 L54 0 H46 L50 15 M50 85 L54 100 H46 L50 85 M15 50 L0 54 V46 L15 50 M85 50 L100 54 V46 L85 50 M22 22 L11 11 L18 4 L29 15 M78 22 L89 11 L82 4 L71 15 M22 78 L11 89 L18 96 L29 85 M78 78 L89 89 L82 96 L71 85" stroke={color} strokeWidth="6"/>
          <circle cx="50" cy="50" r="35" stroke={color} strokeWidth="6"/>
          <circle cx="50" cy="50" r="18" stroke={color} strokeWidth="4"/>
        </svg>
        <svg style={{ position: 'absolute', top: '36px', left: '36px', width: '44px', height: '44px', animation: 'gear-spin 1.4s linear infinite reverse' }} viewBox="0 0 100 100" fill="none">
          <path d="M50 15 L54 0 H46 L50 15 M50 85 L54 100 H46 L50 85 M15 50 L0 54 V46 L15 50 M85 50 L100 54 V46 L85 50 M22 22 L11 11 L18 4 L29 15 M78 22 L89 11 L82 4 L71 15 M22 78 L11 89 L18 96 L29 85 M78 78 L89 89 L82 96 L71 85" stroke={color} strokeWidth="7"/>
          <circle cx="50" cy="50" r="35" stroke={color} strokeWidth="7"/>
          <circle cx="50" cy="50" r="15" stroke={color} strokeWidth="5"/>
        </svg>
      </div>

      {/* Phase label */}
      <div style={{ fontFamily: 'Orbitron, sans-serif', color, fontSize: '14px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px', animation: 'pulse-text 1.5s ease-in-out infinite' }}>
        {currentPhase.label}
      </div>
      <div style={{ fontFamily: 'Rajdhani, sans-serif', color: '#888', fontSize: '14px', marginBottom: '20px' }}>
        {currentPhase.detail}
      </div>

      {/* Progress bar */}
      <div style={{ width: '240px', height: '3px', background: '#1e1e1e', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px' }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${color}, ${color}aa)`,
          borderRadius: '2px',
          transition: 'width 0.3s ease',
          boxShadow: `0 0 8px ${color}66`,
        }} />
      </div>

      {/* Time estimate */}
      <div style={{ fontFamily: 'Rajdhani, sans-serif', color: '#555', fontSize: '12px', letterSpacing: '1px' }}>
        ~{estimatedRemaining}s remaining
      </div>

      {/* Phase dots */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
        {activePhases.map((_, i) => (
          <div key={i} style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: i <= phaseIndex ? color : '#1e1e1e',
            opacity: i <= phaseIndex ? 1 : 0.3,
            transition: 'all 0.3s',
            boxShadow: i === phaseIndex ? `0 0 8px ${color}99` : 'none',
          }} />
        ))}
      </div>
    </div>
  );
}
