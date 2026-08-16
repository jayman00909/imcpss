import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';

// Placeholder: no navigation currently links here. Kept so the /compare route
// resolves instead of falling through to the catch-all redirect.
export default function AlgorithmComparison() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div style={styles.panel}>
        <button
          onClick={() => navigate(`/projects/${id}`)}
          style={styles.backButton}
        >
          ← Back to Project
        </button>

        <h1 style={styles.title}>Algorithm Comparison</h1>

        <p style={styles.text}>
          This page is reserved for comparing the MCO schedule against
          baseline scheduling strategies. It has not been implemented yet.
        </p>

        <button
          onClick={() => navigate(`/projects/${id}/schedule`)}
          style={styles.primaryButton}
        >
          View the MCO Schedule →
        </button>
      </div>
    </MainLayout>
  );
}

const styles = {
  panel: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    maxWidth: '800px',
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#2E5FA3',
    cursor: 'pointer',
    fontWeight: '600',
    padding: 0,
    marginBottom: '10px',
    fontSize: '13px',
  },
  title: { fontSize: '22px', fontWeight: '700', color: '#1a1a2e', marginBottom: '8px' },
  text: { color: '#6c757d', fontSize: '14px', lineHeight: '1.6', marginBottom: '18px' },
  primaryButton: {
    background: '#2E5FA3',
    color: 'white',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },
};
