'use client';
import { useSensorData } from '../hooks/useSensorData';

export default function Insights({ token }) {
  const { latest, connectionStatus, error } = useSensorData(token);

  const statusColor = connectionStatus === 'connected' ? 'var(--success)' : 'var(--warning)';
  const statusLabel = connectionStatus === 'connected' ? '● Live' : '● Polling';

  const indoor = latest.pm2_5_indoor != null ? latest.pm2_5_indoor : 0;
  const predicted = latest.predicted_pm2_5_next_hour != null ? latest.predicted_pm2_5_next_hour : 0;

  const getEmoji = (val) => {
    if (val <= 12) return "🟢";
    if (val <= 35.4) return "🟡";
    if (val <= 55.4) return "🟠";
    if (val <= 150.4) return "🔴";
    return "🟣";
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', color: '#60a5fa' }}>AI Insights & Recommendations</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Deep analysis and health guidance
            <span style={{ marginLeft: '16px', color: statusColor, fontSize: '0.85rem' }}>
              {statusLabel}
            </span>
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #ef4444' }}>
          {error}
        </div>
      )}

      {predicted > indoor ? (
        <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--warning)', padding: '16px 24px', borderRadius: '12px', marginBottom: '32px', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <strong>Warning: Air quality is predicted to worsen in the next hour.</strong>
        </div>
      ) : (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', padding: '16px 24px', borderRadius: '12px', marginBottom: '32px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.5rem' }}>✅</span>
          <strong>Good News: Air quality is expected to remain stable or improve.</strong>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="glass-card">
          <h3 style={{ marginTop: 0, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>Current vs Predicted PM2.5</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '1.1rem' }}>
            <li style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <strong>Current Indoor:</strong> {getEmoji(indoor)} <span style={{ color: 'var(--text-secondary)' }}>{indoor} µg/m³</span>
            </li>
            <li style={{ padding: '12px 0' }}>
              <strong>Predicted Next Hour:</strong> {getEmoji(predicted)} <span style={{ color: 'var(--text-secondary)' }}>{predicted} µg/m³</span>
            </li>
          </ul>
        </div>

        <div className="glass-card">
          <h3 style={{ marginTop: 0, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>Actionable Strategies</h3>
          {latest.indoor_health_advice ? (
            <>
              <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <strong style={{ display: 'block', color: 'white', marginBottom: '4px' }}>Health Advice</strong>
                <span style={{ color: 'var(--text-secondary)' }}>{latest.indoor_health_advice}</span>
              </div>
              <div style={{ padding: '12px 0' }}>
                <strong style={{ display: 'block', color: 'white', marginBottom: '4px' }}>Ventilation Strategy</strong>
                <span style={{ color: 'var(--text-secondary)' }}>{latest.ventilation_advice || 'Maintain current ventilation settings.'}</span>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              Waiting for sensor data...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
