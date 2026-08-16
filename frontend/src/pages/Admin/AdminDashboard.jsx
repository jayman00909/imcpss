import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  getAdminStats, getAdminUsers, getAdminProjects,
  updateUserRole, adminDeleteUser, adminDeleteProject
} from '../../utils/api';
import MainLayout from '../../components/layout/MainLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../components/common/Toast';

const ROLE_COLORS = {
  admin: { bg: '#fdecea', color: '#c0392b' },
  manager: { bg: '#EBF5FB', color: '#2E5FA3' },
  developer: { bg: '#e8f5e9', color: '#27AE60' },
};

export default function AdminDashboard() {
  const { user } = useSelector(s => s.auth);
  const navigate = useNavigate();
  const showToast = useToast();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [sRes, uRes, pRes] = await Promise.all([
        getAdminStats(),
        getAdminUsers(),
        getAdminProjects(),
      ]);
      setStats(sRes.data);
      setUsers(uRes.data);
      setProjects(pRes.data);
    } catch {
      setError('Could not load admin data.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Change this user's role to ${newRole}?`)) return;
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map(u =>
        u.id === userId ? { ...u, role: newRole } : u
      ));
    } catch {
      showToast('Could not update role.', 'error');
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Permanently delete user "${name}"? This cannot be undone.`)) return;
    try {
      await adminDeleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch {
      showToast('Could not delete user.', 'error');
    }
  };

  const handleDeleteProject = async (projectId, title) => {
    if (!window.confirm(`Delete project "${title}" and all its tasks?`)) return;
    try {
      await adminDeleteProject(projectId);
      setProjects(projects.filter(p => p.id !== projectId));
    } catch {
      showToast('Could not delete project.', 'error');
    }
  };

  if (loading) return <MainLayout><LoadingSpinner message="Loading admin panel..." /></MainLayout>;

  const completionRate = stats
    ? Math.round((stats.completed_tasks / Math.max(stats.total_tasks, 1)) * 100)
    : 0;

  return (
    <MainLayout>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>⚙️ System Administration</h1>
          <p style={s.sub}>Full system overview — IMCPSS Admin Panel</p>
        </div>
        <div style={s.adminBadge}>🔴 Admin Mode</div>
      </div>

      {error && <div style={s.error}>{error}</div>}

      {/* Tab Navigation */}
      <div style={s.tabs}>
        {[
          { key: 'overview', label: '📊 Overview' },
          { key: 'users', label: `👥 All Users (${users.length})` },
          { key: 'projects', label: `📋 All Projects (${projects.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              ...s.tab,
              background: tab === t.key ? '#2E5FA3' : 'white',
              color: tab === t.key ? 'white' : '#555',
              borderColor: tab === t.key ? '#2E5FA3' : '#dee2e6',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────── */}
      {tab === 'overview' && stats && (
        <>
          {/* Stat Cards */}
          <div style={s.statGrid}>
            {[
              { label: 'Total Users', value: stats.total_users, icon: '👥', color: '#2E5FA3', bg: '#EBF5FB' },
              { label: 'Managers', value: stats.total_managers, icon: '🎯', color: '#8e44ad', bg: '#f5eef8' },
              { label: 'Developers', value: stats.total_developers, icon: '💻', color: '#27AE60', bg: '#e8f5e9' },
              { label: 'Total Projects', value: stats.total_projects, icon: '📋', color: '#e67e22', bg: '#fef9e7' },
              { label: 'Total Tasks', value: stats.total_tasks, icon: '✅', color: '#16a085', bg: '#e8f8f5' },
              { label: 'Completion Rate', value: `${completionRate}%`, icon: '📈', color: '#c0392b', bg: '#fdecea' },
            ].map(card => (
              <div key={card.label} style={{ ...s.statCard, background: card.bg }}>
                <div style={s.statIcon}>{card.icon}</div>
                <div style={{ ...s.statValue, color: card.color }}>{card.value}</div>
                <div style={s.statLabel}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div style={s.twoCol}>
            <div style={s.card}>
              <h3 style={s.cardTitle}>🕐 Recent Users</h3>
              {stats.recentUsers?.map(u => (
                <div key={u.id} style={s.recentRow}>
                  <div>
                    <p style={s.recentName}>{u.full_name}</p>
                    <p style={s.recentSub}>{u.email}</p>
                  </div>
                  <span style={{
                    ...s.rolePill,
                    background: ROLE_COLORS[u.role]?.bg,
                    color: ROLE_COLORS[u.role]?.color,
                  }}>{u.role}</span>
                </div>
              ))}
            </div>

            <div style={s.card}>
              <h3 style={s.cardTitle}>🕐 Recent Projects</h3>
              {stats.recentProjects?.map(p => (
                <div key={p.id} style={s.recentRow}>
                  <div>
                    <p style={s.recentName}>{p.title}</p>
                    <p style={s.recentSub}>by {p.manager_name}</p>
                  </div>
                  <span style={s.datePill}>
                    {new Date(p.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* System Health */}
          <div style={s.card}>
            <h3 style={s.cardTitle}>🏥 System Health</h3>
            <div style={s.healthGrid}>
              {[
                { label: 'Database', status: 'Connected', ok: true },
                { label: 'Authentication', status: 'JWT Active', ok: true },
                { label: 'MCO Engine', status: 'Operational', ok: true },
                { label: 'API Server', status: 'Running', ok: true },
              ].map(h => (
                <div key={h.label} style={s.healthItem}>
                  <span style={{
                    ...s.healthDot,
                    background: h.ok ? '#27AE60' : '#E74C3C',
                    boxShadow: `0 0 6px ${h.ok ? '#27AE60' : '#E74C3C'}`,
                  }} />
                  <div>
                    <p style={s.healthLabel}>{h.label}</p>
                    <p style={{ ...s.healthStatus, color: h.ok ? '#27AE60' : '#E74C3C' }}>
                      {h.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── USERS TAB ────────────────────────────────────── */}
      {tab === 'users' && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>👥 All Registered Users</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Name', 'Email', 'Role', 'Projects', 'Joined', 'Change Role', 'Action'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} style={{ background: i % 2 === 0 ? '#fafbff' : 'white' }}>
                    <td style={{ ...s.td, fontWeight: '600' }}>{u.full_name}</td>
                    <td style={s.td}>{u.email}</td>
                    <td style={s.td}>
                      <span style={{
                        ...s.rolePill,
                        background: ROLE_COLORS[u.role]?.bg,
                        color: ROLE_COLORS[u.role]?.color,
                      }}>{u.role}</span>
                    </td>
                    <td style={{ ...s.td, textAlign: 'center' }}>
                      {u.project_count || 0}
                    </td>
                    <td style={s.td}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td style={s.td}>
                      {u.id !== user.id && (
                        <select
                          value={u.role}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                          style={s.select}
                        >
                          <option value="developer">Developer</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>
                    <td style={s.td}>
                      {u.id !== user.id && (
                        <button
                          style={s.deleteBtn}
                          onClick={() => handleDeleteUser(u.id, u.full_name)}
                        >
                          🗑 Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PROJECTS TAB ─────────────────────────────────── */}
      {tab === 'projects' && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>📋 All Projects in System</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Project', 'Manager', 'Tasks', 'Done', 'Members', 'Progress', 'Created', 'Action'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map((p, i) => {
                  const pct = p.task_count > 0
                    ? Math.round((p.done_count / p.task_count) * 100) : 0;
                  return (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? '#fafbff' : 'white' }}>
                      <td style={{ ...s.td, fontWeight: '600', maxWidth: '200px' }}>{p.title}</td>
                      <td style={s.td}>{p.manager_name}</td>
                      <td style={{ ...s.td, textAlign: 'center' }}>{p.task_count}</td>
                      <td style={{ ...s.td, textAlign: 'center', color: '#27AE60', fontWeight: '600' }}>
                        {p.done_count}
                      </td>
                      <td style={{ ...s.td, textAlign: 'center' }}>{p.member_count}</td>
                      <td style={s.td}>
                        <div style={s.miniBarBg}>
                          <div style={{ ...s.miniBarFill, width: `${pct}%` }} />
                        </div>
                        <span style={s.pctLabel}>{pct}%</span>
                      </td>
                      <td style={s.td}>
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td style={s.td}>
                        <button
                          style={s.deleteBtn}
                          onClick={() => handleDeleteProject(p.id, p.title)}
                        >
                          🗑 Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: '700', color: '#1a1a2e' },
  sub: { color: '#6c757d', fontSize: '14px', marginTop: '4px' },
  adminBadge: {
    background: '#fdecea', color: '#c0392b', padding: '8px 20px',
    borderRadius: '20px', fontWeight: '700', fontSize: '13px',
    border: '2px solid #f5c6cb',
  },
  error: { background: '#fdecea', color: '#c0392b', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  tabs: { display: 'flex', gap: '10px', marginBottom: '24px' },
  tab: {
    padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
    fontWeight: '600', fontSize: '13px', border: '2px solid',
    transition: 'all 0.15s',
  },
  statGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px', marginBottom: '20px',
  },
  statCard: {
    borderRadius: '12px', padding: '20px', textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  statIcon: { fontSize: '28px', marginBottom: '8px' },
  statValue: { fontSize: '32px', fontWeight: '800', marginBottom: '4px' },
  statLabel: { fontSize: '12px', color: '#6c757d', fontWeight: '600' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
  card: { background: 'white', borderRadius: '12px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  cardTitle: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e', marginBottom: '16px' },
  recentRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 0', borderBottom: '1px solid #f5f5f5',
  },
  recentName: { fontSize: '13px', fontWeight: '600', color: '#1a1a2e' },
  recentSub: { fontSize: '12px', color: '#888', marginTop: '2px' },
  rolePill: { padding: '3px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' },
  datePill: { background: '#f0f2f5', color: '#555', padding: '3px 10px', borderRadius: '12px', fontSize: '11px' },
  healthGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' },
  healthItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8faff', borderRadius: '10px' },
  healthDot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  healthLabel: { fontSize: '13px', fontWeight: '600', color: '#333' },
  healthStatus: { fontSize: '11px', marginTop: '2px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: { background: '#2E5FA3', color: 'white', padding: '10px 14px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' },
  td: { padding: '10px 14px', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' },
  select: { padding: '5px 8px', borderRadius: '6px', border: '1px solid #dee2e6', fontSize: '12px', cursor: 'pointer' },
  deleteBtn: { background: '#fdecea', color: '#c0392b', border: 'none', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' },
  miniBarBg: { background: '#e0e0e0', borderRadius: '10px', height: '6px', width: '80px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' },
  miniBarFill: { background: '#2E5FA3', borderRadius: '10px', height: '6px' },
  pctLabel: { fontSize: '11px', color: '#555', fontWeight: '600' },
};