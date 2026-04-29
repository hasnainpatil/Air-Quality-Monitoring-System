'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';
const PAGE_SIZE = 15;

export default function HistoryTable({ token }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);

  const fetchHistory = async (pageIndex) => {
    setLoading(true);
    try {
      const skip = pageIndex * PAGE_SIZE;
      const res = await axios.get(`${API_URL}/data?limit=${PAGE_SIZE}&skip=${skip}&sort=desc`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch historical data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(page);
  }, [page, token]);

  return (
    <div className="history-container">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', margin: '0 0 8px 0', color: '#60a5fa' }}>Historical Data</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Review past sensor readings</p>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #ef4444' }}>
          {error}
        </div>
      )}

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Indoor PM2.5 (µg/m³)</th>
                <th>Predicted PM2.5</th>
                <th>Temperature (°C)</th>
                <th>Humidity (%)</th>
                <th>Gas Level</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>Loading...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>No historical data found</td>
                </tr>
              ) : (
                data.map((row, i) => (
                  <tr key={i}>
                    <td>{new Date(row.timestamp).toLocaleString()}</td>
                    <td>{row.pm2_5_indoor}</td>
                    <td>{row.predicted_pm2_5_next_hour != null ? row.predicted_pm2_5_next_hour : '--'}</td>
                    <td>{row.temperature}</td>
                    <td>{row.humidity}</td>
                    <td>{row.gas_level}</td>
                    <td>
                      <span className={`status-badge ${row.pm2_5_indoor > 35.4 ? 'warning' : 'success'}`}>
                        {row.indoor_air_quality_category || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="pagination">
          <button 
            className="btn-secondary" 
            disabled={page === 0 || loading} 
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </button>
          <span style={{ color: 'var(--text-secondary)' }}>Page {page + 1}</span>
          <button 
            className="btn-secondary" 
            disabled={data.length < PAGE_SIZE || loading} 
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
