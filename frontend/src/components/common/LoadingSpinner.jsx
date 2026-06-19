import React from 'react';

export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div style={styles.container}>
      <div style={styles.spinner}></div>
      <p style={styles.text}>{message}</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '60px',
  },
  spinner: {
    width: '40px', height: '40px',
    border: '4px solid #e0e7ff',
    borderTop: '4px solid #2E5FA3',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginBottom: '12px',
  },
  text: { color: '#6c757d', fontSize: '14px' },
};