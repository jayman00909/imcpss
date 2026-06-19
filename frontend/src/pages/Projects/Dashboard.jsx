import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getProjects, createProject, deleteProject } from '../../utils/api';
import MainLayout from '../../components/Layout/MainLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function Dashboard() {
  const { user } = useSelector((s) => s.auth);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', start_date: '', end_date: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      const res = await getProjects();
      setProjects(res.data);
    } catch {
      setError('Could not load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createProject(form);
      setShowForm(false);
      setForm({ title: '', description: '', start_date: '', end_date: '' });
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create project.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    await deleteProject(id);
    fetchProjects();
  };

  return (
    <MainLayout>
      <div style={styles.topBar}>
        <div>
          <h1 style={styles.heading}>My Projects</h1>
          <p style={styles.sub}>Welcome back, {user?.full_name}</p>
        </div>
        {user?.role === 'manager' && (
          <button style={styles.addBtn} onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ New Project'}
          </button>
        )}
      </div>

      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>Create New Project</h3>
          {error && <div style={styles.error}>{error}</div>}
          <form onSubmit={handleCreate}>
            <div style={styles.grid2}>
              <div style={styles.field}>
                <label style={styles.label}>Project Title *</label>
                <input style={styles.input} required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. IMCPSS Web Application"
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Description</label>
                <input style={styles.input}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief project description"
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Start Date *</label>
                <input type="date" style={styles.input} required
                  value={form.start_date}
                  onChange={e => setForm({ ...form, start_date: e.target.value })}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>End Date *</label>
                <input type="date" style={styles.input} required
                  value={form.end_date}
                  onChange={e => setForm({ ...form, end_date: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" style={styles.submitBtn}>Create Project</button>
          </form>
        </div>
      )}

      {loading ? <LoadingSpinner /> : (
        <div style={styles.grid}>
          {projects.length === 0 ? (
            <div style={styles.empty}>
              <p style={{ fontSize: '48px' }}>📋</p>
              <p style={{ color: '#6c757d', marginTop: '12px' }}>
                {user?.role === 'manager'
                  ? 'No projects yet. Click "+ New Project" to start.'
                  : 'You have not been added to any project yet.'}
              </p>
            </div>
          ) : (
            projects.map(p => (
              <div key={p.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <h3 style={styles.cardTitle}>{p.title}</h3>
                  <span style={styles.badge}>Active</span>
                </div>
                <p style={styles.cardDesc}>{p.description || 'No description provided.'}</p>
                <div style={styles.dates}>
                  <span>📅 {new Date(p.start_date).toLocaleDateString()}</span>
                  <span>→</span>
                  <span>🏁 {new Date(p.end_date).toLocaleDateString()}</span>
                </div>
                <div style={styles.cardActions}>
                  <button style={styles.openBtn} onClick={() => navigate(`/projects/${p.id}`)}>
                    Open Project →
                  </button>
                  {user?.role === 'manager' && (
                    <button style={styles.deleteBtn} onClick={() => handleDelete(p.id)}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </MainLayout>
  );
}

const styles = {
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  heading: { fontSize: '26px', fontWeight: '700', color: '#1a1a2e' },
  sub: { color: '#6c757d', marginTop: '4px', fontSize: '14px' },
  addBtn: {
    background: '#2E5FA3', color: 'white', border: 'none', padding: '10px 20px',
    borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
  },
  formCard: {
    background: 'white', borderRadius: '12px', padding: '24px',
    marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  formTitle: { marginBottom: '16px', color: '#1a1a2e' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: '13px', fontWeight: '600', color: '#444', marginBottom: '6px' },
  input: {
    padding: '10px 12px', border: '1.5px solid #dee2e6',
    borderRadius: '8px', fontSize: '14px', outline: 'none',
  },
  submitBtn: {
    marginTop: '16px', background: '#2E5FA3', color: 'white',
    border: 'none', padding: '10px 24px', borderRadius: '8px',
    cursor: 'pointer', fontWeight: '600',
  },
  error: { background: '#fdecea', color: '#c0392b', padding: '10px', borderRadius: '8px', marginBottom: '12px', fontSize: '14px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
  empty: { gridColumn: '1/-1', textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px' },
  card: {
    background: 'white', borderRadius: '12px', padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)', transition: 'transform 0.2s',
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  cardTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e' },
  badge: {
    background: '#e8f5e9', color: '#27AE60', padding: '3px 10px',
    borderRadius: '20px', fontSize: '12px', fontWeight: '600',
  },
  cardDesc: { color: '#6c757d', fontSize: '13px', marginBottom: '12px', lineHeight: '1.5' },
  dates: { display: 'flex', gap: '8px', fontSize: '12px', color: '#888', marginBottom: '16px' },
  cardActions: { display: 'flex', gap: '10px' },
  openBtn: {
    flex: 1, background: '#EBF5FB', color: '#2E5FA3', border: 'none',
    padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px',
  },
  deleteBtn: {
    background: '#fdecea', color: '#c0392b', border: 'none',
    padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
  },
};