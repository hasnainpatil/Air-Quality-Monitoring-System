'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';
const WS_URL = 'ws://localhost:8000/ws';

const POLL_INTERVAL_MS = 5000;
const WS_RECONNECT_DELAY_MS = 3000;
const WS_MAX_RECONNECT_ATTEMPTS = 10;

export function useSensorData(token) {
  const [data, setData] = useState([]);
  const [alert, setAlert] = useState(null);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  const wsRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const pollTimerRef = useRef(null);
  const isMountedRef = useRef(true);

  // -------------------------------------------------------
  // Fetch initial data from the REST API
  // -------------------------------------------------------
  const fetchData = async () => {
    try {
      const dataRes = await axios.get(`${API_URL}/data?limit=50`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (isMountedRef.current) {
        if (dataRes.data.length > 0) {
          setData(dataRes.data);
        }
        setError(null);
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      if (err.response?.status !== 401) {
        setError('Cannot connect to the backend server. Please ensure the Python backend is running on port 8000.');
      }
    }
  };

  // -------------------------------------------------------
  // Polling fallback — if WebSocket is not connected, poll
  // -------------------------------------------------------
  const startPolling = () => {
    stopPolling();
    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await axios.get(`${API_URL}/data?limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (isMountedRef.current && res.data.length > 0) {
          setData(res.data);
        }
      } catch (err) {
        // ignore polling errors
      }
    }, POLL_INTERVAL_MS);
  };

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  // -------------------------------------------------------
  // WebSocket with auto-reconnect
  // -------------------------------------------------------
  const connectWebSocket = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttemptsRef.current = 0;
      if (isMountedRef.current) {
        setConnectionStatus('connected');
        stopPolling();
      }
    };

    ws.onmessage = (event) => {
      try {
        const newData = JSON.parse(event.data);
        newData.timestamp = new Date().toISOString();

        if (isMountedRef.current) {
          setData((prev) => {
            const updated = [...prev, newData];
            if (updated.length > 50) updated.shift();
            return updated;
          });

          if (newData.pm2_5_indoor > 35.4 || newData.predicted_pm2_5_next_hour > 35.4) {
            setAlert(`Warning: Air Quality is concerning! PM2.5 is ${newData.pm2_5_indoor} µg/m³`);
            setTimeout(() => {
              if (isMountedRef.current) setAlert(null);
            }, 8000);
          }
        }
      } catch (err) {
        // Ignore parse errors
      }
    };

    ws.onclose = (event) => {
      if (isMountedRef.current) {
        setConnectionStatus('disconnected');
        startPolling();
        scheduleReconnect();
      }
    };

    ws.onerror = (err) => {
      ws.close();
    };
  };

  const scheduleReconnect = () => {
    if (reconnectAttemptsRef.current >= WS_MAX_RECONNECT_ATTEMPTS) {
      return;
    }
    reconnectAttemptsRef.current += 1;
    const delay = WS_RECONNECT_DELAY_MS * reconnectAttemptsRef.current;
    reconnectTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) connectWebSocket();
    }, delay);
  };

  // -------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------
  useEffect(() => {
    isMountedRef.current = true;
    if (token) {
      fetchData();
      connectWebSocket();
      startPolling();
    }

    return () => {
      isMountedRef.current = false;
      stopPolling();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const latest = data[data.length - 1] || {};

  return { data, latest, error, connectionStatus, alert };
}
