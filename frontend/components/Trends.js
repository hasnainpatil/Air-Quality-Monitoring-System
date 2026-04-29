'use client';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { useSensorData } from '../hooks/useSensorData';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function Trends({ token }) {
  const { data, connectionStatus, error } = useSensorData(token);

  const labels = data.map(d => {
    const date = new Date(d.timestamp || new Date());
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  const pmChartData = {
    labels,
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
        label: 'Outdoor PM2.5',
        data: data.map(d => d.pm2_5_outdoor),
        borderColor: '#10b981',
        tension: 0.4,
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

  const envChartData = {
    labels,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: data.map(d => d.temperature),
        borderColor: '#ef4444',
        tension: 0.4,
      },
      {
        label: 'Humidity (%)',
        data: data.map(d => d.humidity),
        borderColor: '#06b6d4',
        tension: 0.4,
      },
      {
        label: 'Gas Level',
        data: data.map(d => d.gas_level),
        borderColor: '#8b5cf6',
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
          <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', color: '#60a5fa' }}>Real-Time Trends</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Deep dive into sensor metrics over time
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="glass-card" style={{ height: '400px' }}>
          <h3 style={{ marginTop: 0, color: 'var(--text-secondary)' }}>Air Quality Trends (PM2.5)</h3>
          <div style={{ height: 'calc(100% - 40px)' }}>
            {data.length > 0 ? (
              <Line data={pmChartData} options={chartOptions} />
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                Waiting for sensor data...
              </div>
            )}
          </div>
        </div>

        <div className="glass-card" style={{ height: '400px' }}>
          <h3 style={{ marginTop: 0, color: 'var(--text-secondary)' }}>Environment Trends</h3>
          <div style={{ height: 'calc(100% - 40px)' }}>
            {data.length > 0 ? (
              <Line data={envChartData} options={chartOptions} />
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                Waiting for sensor data...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
