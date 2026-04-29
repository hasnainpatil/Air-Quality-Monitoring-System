'use client';
import { useState, useEffect } from 'react';
import Auth from '../components/Auth';
import Overview from '../components/Overview';
import Trends from '../components/Trends';
import Insights from '../components/Insights';
import HistoryTable from '../components/HistoryTable';
import Layout from '../components/Layout';

export default function Home() {
  const [token, setToken] = useState(null);
  const [currentPage, setCurrentPage] = useState('overview');

  useEffect(() => {
    // Check if token exists in localStorage on load
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', padding: '24px' }}>
        <Auth onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <Layout 
      token={token} 
      onLogout={handleLogout} 
      currentPage={currentPage} 
      setCurrentPage={setCurrentPage}
    >
      {currentPage === 'overview' && <Overview token={token} />}
      {currentPage === 'trends' && <Trends token={token} />}
      {currentPage === 'insights' && <Insights token={token} />}
      {currentPage === 'history' && <HistoryTable token={token} />}
    </Layout>
  );
}
