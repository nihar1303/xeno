'use client';

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components (Crucial for chart rendering)
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// Types
interface SummaryMetrics {
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  aov: number;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  total_spent: number;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<SummaryMetrics | null>(null);
  const [topCustomers, setTopCustomers] = useState<Customer[]>([]);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Custom Date States for Filtering (Assignment requirement: date range filtering)
  const [startDate, setStartDate] = useState('2023-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchData = async () => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      router.push('/login');
      return;
    }

    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      // 1. Fetch Summary Metrics
      const summaryRes = await axios.get(`${API_BASE_URL}/api/v1/insights/summary`, config);
      setMetrics(summaryRes.data);

      // 2. Fetch Top Customers
      const customersRes = await axios.get(`${API_BASE_URL}/api/v1/insights/top-customers`, config);
      setTopCustomers(customersRes.data);

      // 3. Fetch Trend Data (Using dynamic dates)
      const trendUrl = `${API_BASE_URL}/api/v1/insights/orders-by-date?start=${startDate}&end=${endDate}`;
      const trendRes = await axios.get(trendUrl, config);

      // Prepare Chart Data
      const labels = trendRes.data.map((item: any) => item.date);
      const revenue = trendRes.data.map((item: any) => item.totalRevenue);

      setChartData({
        labels,
        datasets: [
          {
            label: 'Revenue ($)',
            data: revenue,
            borderColor: '#BB86FC', // Primary Purple Line Color
            backgroundColor: 'rgba(187, 134, 252, 0.2)', // Light purple fill
            tension: 0.3,
            pointBackgroundColor: '#BB86FC',
          },
        ],
      });

    } catch (err: any) {
      console.error('Error fetching data:', err.response?.data || err.message);
      // If 401 Unauthorized, redirect to login
      if (err.response && err.response.status === 401) {
          localStorage.removeItem('jwtToken');
          router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
      // Re-run fetch whenever start or end dates change
      setLoading(true);
      fetchData();
  }, [router, startDate, endDate]); // Dependencies list ensures data refreshes on filter change

  // Configuration options for the chart styling (dark theme compatible)
  const chartOptions = useMemo(() => ({
    responsive: true, 
    maintainAspectRatio: false,
    scales: {
        y: { 
            grid: { color: '#333' }, 
            ticks: { color: '#E0E0E0' } 
        },
        x: { 
            grid: { color: '#333' }, 
            ticks: { color: '#E0E0E0' } 
        }
    },
    plugins: {
        legend: {
            labels: {
                color: '#E0E0E0' // Legend text color
            }
        },
        title: {
            display: false,
        }
    }
  }), []);


  if (loading) return <div style={styles.loading}>Loading Insights...</div>;
  if (!metrics) return <div style={{...styles.loading, color: '#ff4d4f'}}>Error loading core data. Check backend logs.</div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>📊 Merchant Insights Dashboard</h1>
        <button 
          onClick={() => { localStorage.removeItem('jwtToken'); router.push('/login'); }}
          style={styles.logoutBtn}
        >
          Logout
        </button>
      </header>
      
      {/* Date Filter Bar */}
      <div style={styles.filterBar}>
        <div style={styles.inputGroup}>
            <label style={styles.label}>Start Date:</label>
            <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                style={styles.dateInput}
            />
        </div>
        <div style={styles.inputGroup}>
            <label style={styles.label}>End Date:</label>
            <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                style={styles.dateInput}
            />
        </div>
      </div>

      <div style={styles.grid}>
        {/* Metric Cards */}
        <div style={styles.card}>
            <h3>💰 Total Revenue</h3>
            <p style={styles.metricValue}>${metrics.totalRevenue.toLocaleString()}</p>
        </div>
        <div style={styles.card}>
            <h3>👥 Total Customers</h3>
            <p style={styles.metricValue}>{metrics.totalCustomers.toLocaleString()}</p>
        </div>
        <div style={styles.card}>
            <h3>📦 Total Orders</h3>
            <p style={styles.metricValue}>{metrics.totalOrders.toLocaleString()}</p>
        </div>
        <div style={styles.card}>
            <h3>📈 Avg Order Value</h3>
            <p style={styles.metricValue}>${metrics.aov.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>

        {/* Chart Section */}
        <div style={{ ...styles.card, gridColumn: 'span 2' }}>
            <h3>Revenue Trend (Orders by Date)</h3>
            <div style={{ height: '300px' }}>
                {chartData ? (
                    <Line options={chartOptions} data={chartData} />
                ) : (
                    <p style={{textAlign: 'center', marginTop: '100px', color: '#A0A0A0'}}>No trend data available for this range.</p>
                )}
            </div>
        </div>

        {/* Top Customers Table */}
        <div style={{ ...styles.card, gridColumn: 'span 2' }}>
            <h3>🏆 Top 5 Customers by Spend</h3>
            <table style={styles.table}>
                <thead>
                    <tr style={styles.tableBorder}>
                        <th style={styles.th}>Name</th>
                        <th style={styles.th}>Email</th>
                        <th style={styles.th}>Total Spent</th>
                    </tr>
                </thead>
                <tbody>
                    {topCustomers.length > 0 ? topCustomers.map((c) => (
                        <tr key={c.id}>
                            {/* Apply td styles directly to cells to handle borders correctly */}
                            <td style={styles.td}>{c.first_name} {c.last_name}</td>
                            <td style={styles.tdEmail}>{c.email}</td>
                            <td style={{...styles.td, fontWeight: 'bold'}}>${c.total_spent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                    )) : (
                        <tr><td colSpan={3} style={{...styles.td, textAlign: 'center'}}>No customer data found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}

// 🎨 Final Dark Theme Styles with Purple Accent (BB86FC)
const styles = {
  container: {
    padding: '2rem',
    background: '#121212', // Primary Dark Background
    minHeight: '100vh',
    fontFamily: 'system-ui, sans-serif',
    color: '#E0E0E0', // Primary Light Text
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '1.5rem',
    color: '#A0A0A0',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  headerTitle: {
    color: '#BB86FC', // Accent Purple Title
    margin: 0,
  },
  logoutBtn: {
    background: '#03DAC6', // Teal Accent for secondary action
    color: '#1a1a1a', 
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'background 0.3s',
  },
  filterBar: {
    display: 'flex',
    gap: '20px',
    marginBottom: '2rem',
    alignItems: 'center',
  },
  inputGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  label: {
    color: '#A0A0A0',
  },
  dateInput: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #444',
    background: '#2c2c2c',
    color: '#E0E0E0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  card: {
    background: '#1e1e1e', // Surface/Card Background
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
  },
  metricValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#03DAC6', // Teal Accent Color (Metrics)
    margin: '10px 0 0 0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginTop: '15px',
  },
  // **FIXED STYLES** (Integrated into the object)
  th: {
    padding: '10px',
    textAlign: 'left' as const,
    borderBottom: '1px solid #444',
    color: '#A0A0A0',
    fontSize: '0.9rem',
  },
  td: {
    padding: '10px',
    fontSize: '0.95rem',
    borderBottom: '1px solid #2c2c2c', 
  },
  tdEmail: {
    padding: '10px', 
    color: '#BB86FC', // Purple link/email color
    fontSize: '0.95rem',
    borderBottom: '1px solid #2c2c2c',
  },
  tableBorder: { // This definition is now safe inside the object
    borderBottom: '1px solid #444',
  },
  tableRow: {
    transition: 'background 0.2s',
  }
};