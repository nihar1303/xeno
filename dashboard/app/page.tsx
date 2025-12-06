import Link from 'next/link';

export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      color: '#333'
    }}>
      
      {/* Hero Section */}
      <main style={{
        textAlign: 'center',
        padding: '3rem',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        maxWidth: '600px',
        width: '90%'
      }}>
        <div style={{ marginBottom: '20px', fontSize: '3rem' }}>🚀</div>
        
        <h1 style={{ 
          fontSize: '2.5rem', 
          marginBottom: '1rem',
          fontWeight: '800',
          background: '-webkit-linear-gradient(45deg, #0070f3, #00d2ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Xeno FDE Service
        </h1>

        <p style={{ 
          fontSize: '1.2rem', 
          lineHeight: '1.6', 
          color: '#666',
          marginBottom: '2rem' 
        }}>
          A multi-tenant data ingestion and insights platform for Shopify Enterprise Retailers.
        </p>

        {/* Feature List (Good for Demo Video) */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '15px', 
          marginBottom: '2.5rem',
          fontSize: '0.9rem',
          color: '#555'
        }}>
          <span style={badgeStyle}>✨ Multi-Tenancy</span>
          <span style={badgeStyle}>🔄 Real-time Sync</span>
          <span style={badgeStyle}>📊 Analytics</span>
        </div>

        {/* Call to Action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <Link href="/login" style={primaryButtonStyle}>
            Login to Dashboard
          </Link>
          
          <a 
            href="https://github.com/nihar1303/xeno" 
            target="_blank" 
            rel="noopener noreferrer"
            style={secondaryButtonStyle}
          >
            View Source Code
          </a>
        </div>
      </main>

      <footer style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#666' }}>
        Built for Xeno FDE Internship Assignment 2025
      </footer>
    </div>
  );
}

// --- Styles ---

const badgeStyle = {
  background: '#f0f2f5',
  padding: '6px 12px',
  borderRadius: '20px',
  fontWeight: '500' as const,
  border: '1px solid #e1e4e8'
};

const primaryButtonStyle = {
  display: 'inline-block',
  background: '#0070f3',
  color: 'white',
  padding: '14px 28px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontWeight: '600',
  fontSize: '1.1rem',
  transition: 'background 0.2s',
  border: 'none',
  cursor: 'pointer'
};

const secondaryButtonStyle = {
  display: 'inline-block',
  background: 'transparent',
  color: '#666',
  padding: '10px 20px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '0.9rem',
  border: '1px solid #ddd',
  cursor: 'pointer'
};