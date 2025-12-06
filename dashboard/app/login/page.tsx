'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

// Use environment variable or fallback to localhost
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // API_BASE_URL will be http://localhost:3000 locally, or your deployed Render URL
      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
        email,
        password,
      });

      const { token } = response.data;

      // Store token securely for authorization
      localStorage.setItem('jwtToken', token);
      
      // Redirect to dashboard on success
      router.push('/dashboard'); 
    } catch (err: any) {
      console.error('Login failed:', err);
      // Display the error message returned from the backend (auth.service.ts)
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🔐 Tenant Login</h1>
        <p style={styles.subtitle}>Sign in to access your store insights</p>
        
        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              style={styles.input}
              placeholder="e.g. admin@store.com"
              required 
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              style={styles.input}
              placeholder="••••••••"
              required 
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

// 🎨 Dark Theme Styles with Purple Accent (BB86FC)
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#121212', // Primary Dark Background
    fontFamily: 'sans-serif',
    color: '#E0E0E0', // Primary Light Text
  },
  card: {
    background: '#1e1e1e', // Surface/Card Background
    padding: '2.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)', // Darker shadow
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    margin: '0 0 10px 0',
    color: '#BB86FC', // Accent Purple Title
    textAlign: 'center' as const,
  },
  subtitle: {
    margin: '0 0 30px 0',
    color: '#A0A0A0', // Secondary Text
    textAlign: 'center' as const,
    fontSize: '0.9rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#E0E0E0', // Light text color
  },
  input: {
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #444', // Darker border
    background: '#2c2c2c', // Dark input background
    color: '#E0E0E0', // Input text color
    fontSize: '1rem',
  },
  button: {
    background: '#BB86FC', // Accent Purple Button
    color: '#1a1a1a', // Dark text on light button for contrast
    padding: '12px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'background 0.3s',
  },
  error: {
    color: '#ff4d4f', // Warning/Error Red
    fontSize: '0.9rem',
    textAlign: 'center' as const,
    background: '#400', // Darker error background
    padding: '10px',
    borderRadius: '4px',
  },
};