'use client';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { useSensorData } from '../hooks/useSensorData';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function Overview({ token }) {
  const { data, latest, error, connectionStatus, alert } = useSensorData(token);

  const chartData = {
    labels: data.map(d => {
      const date = new Date(d.timestamp || new Date());
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }),
    datasets: [
      {
        label: 'Indoor PM2.5',
        data: data.map(d => d.pm2_5_indoor),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Predicted Next Hour',
        data: data.map(d => d.predicted_pm2_5_next_hour),
        borderColor: '#f59e0b',
        borderDash: [5, 5],
        tension: 0.4,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#94a3b8' } }
    },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
    }
  };

  const statusColor = connectionStatus === 'connected' ? 'var(--success)' : 'var(--warning)';
  const statusLabel = connectionStatus === 'connected' ? '● Live' : '● Polling';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', color: '#60a5fa' }}>Overview</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Real-time sensor data
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="glass-card">
          <div className="metric-label">Indoor PM2.5</div>
          <div className="metric-value">{latest.pm2_5_indoor != null ? latest.pm2_5_indoor : '--'}</div>
          <div style={{ color: latest.pm2_5_indoor > 35.4 ? 'var(--warning)' : 'var(--success)' }}>
            {latest.indoor_air_quality_category || 'Waiting for sensor data...'}
          </div>
        </div>
        <div className="glass-card">
          <div className="metric-label">Predicted PM2.5</div>
          <div className="metric-value">{latest.predicted_pm2_5_next_hour != null ? latest.predicted_pm2_5_next_hour : '--'}</div>
          <div style={{ color: 'var(--text-secondary)' }}>Next Hour AI Forecast</div>
        </div>
        <div className="glass-card">
          <div className="metric-label">Environment</div>
          <div className="metric-value">{latest.temperature != null ? latest.temperature : '--'}°C</div>
          <div style={{ color: 'var(--text-secondary)' }}>Humidity: {latest.humidity != null ? latest.humidity : '--'}%</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="glass-card" style={{ height: '400px' }}>
          <h3 style={{ marginTop: 0, color: 'var(--text-secondary)' }}>PM2.5 Trends</h3>
          <div style={{ height: 'calc(100% - 40px)' }}>
            {data.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '2rem' }}>📡</div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  Waiting for sensor data...
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="glass-card">
          <h3 style={{ marginTop: 0, color: 'var(--text-secondary)' }}>AI Insights & Recommendations</h3>
          {latest.indoor_health_advice ? (
            <>
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ color: 'white' }}>Health Advice:</strong>
                <p style={{ margin: '8px 0', color: 'var(--text-secondary)' }}>{latest.indoor_health_advice}</p>
              </div>
              {latest.ventilation_advice && (
                <div>
                  <strong style={{ color: 'white' }}>Ventilation Strategy:</strong>
                  <p style={{ margin: '8px 0', color: 'var(--text-secondary)' }}>{latest.ventilation_advice}</p>
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', height: '200px', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              AI insights will appear once sensor data arrives...
            </div>
          )}
        </div>
      </div>

      {alert && (
        <div className="alert-popup">
          <div style={{ fontSize: '24px' }}>⚠️</div>
          <div>
            <strong style={{ display: 'block', color: 'white', marginBottom: '4px' }}>Alert</strong>
            <span style={{ color: '#fca5a5' }}>{alert}</span>
          </div>
        </div>
      )}
    </div>
  );
}
