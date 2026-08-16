import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getDeveloperManagement } from '../../utils/api';
import MainLayout from '../../components/layout/MainLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

function parseSkillVector(value) {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function parseJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getTopSkills(skillVector) {
  return Object.entries(skillVector)
    .map(([skill, level]) => [skill, Number(level) || 0])
    .filter(([, level]) => level > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
}

export default function DeveloperManagement() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!['manager', 'admin'].includes(user?.role)) {
      navigate('/dashboard');
      return;
    }

    getDeveloperManagement()
      .then((res) => setDevelopers(res.data))
      .catch((err) => {
        setError(err.response?.data?.error || 'Could not load developers.');
      })
      .finally(() => setLoading(false));
  }, [navigate, user?.role]);

  const summary = useMemo(() => {
    const normalized = developers.map((developer) => {
      const skills = parseSkillVector(developer.skill_vector);
      const assignedTasks = parseJsonArray(developer.assigned_tasks);
      const projectMemberships = parseJsonArray(developer.project_memberships);
      return {
        ...developer,
        assignedTasks,
        projectMemberships,
        skills,
        skill_count: Object.keys(skills).length,
      };
    });

    const totalAssigned = normalized.reduce(
      (sum, developer) => sum + Number(developer.assigned_task_count || 0),
      0
    );
    const totalActive = normalized.reduce(
      (sum, developer) => sum + Number(developer.active_task_count || 0),
      0
    );
    const completeProfiles = normalized.filter((developer) => developer.skill_count > 0).length;

    return { normalized, totalAssigned, totalActive, completeProfiles };
  }, [developers]);

  if (loading) return <MainLayout><LoadingSpinner /></MainLayout>;

  return (
    <MainLayout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Developer Management</h1>
          <p style={styles.subtitle}>
            Review skill vectors and current workload before generating deterministic MCO schedules.
          </p>
        </div>
        <button style={styles.secondaryButton} onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.statGrid}>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{developers.length}</span>
          <span style={styles.statLabel}>Developers</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{summary.completeProfiles}</span>
          <span style={styles.statLabel}>Skill Profiles Ready</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{summary.totalAssigned}</span>
          <span style={styles.statLabel}>Assigned Tasks</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{summary.totalActive}</span>
          <span style={styles.statLabel}>Active Workload</span>
        </div>
      </div>

      <div style={styles.infoPanel}>
        <strong>Defense note:</strong> This page exposes the exact developer skill vectors used by
        cosine similarity. No trained model is involved; task assignment is deterministic and can be
        recalculated from the visible task requirements, developer skills, and configured weights.
      </div>

      {summary.normalized.length === 0 ? (
        <div style={styles.empty}>No developer accounts have been created yet.</div>
      ) : (
        <div style={styles.grid}>
          {summary.normalized.map((developer) => {
            const skillList = getTopSkills(developer.skills);
            const activeTasks = Number(developer.active_task_count || 0);
            const assignedTasks = Number(developer.assigned_task_count || 0);
            const completedTasks = Number(developer.completed_task_count || 0);
            const averageScore = Number(developer.average_priority_score || 0);
            const recentAssignedTasks = developer.assignedTasks.slice(0, 4);

            return (
              <div key={developer.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div>
                    <h2 style={styles.name}>{developer.full_name}</h2>
                    <p style={styles.email}>{developer.email}</p>
                  </div>
                  <span style={{
                    ...styles.profileBadge,
                    background: developer.skill_count > 0 ? '#e8f5e9' : '#fdecea',
                    color: developer.skill_count > 0 ? '#155724' : '#c0392b',
                  }}>
                    {developer.skill_count > 0 ? 'Profile ready' : 'No skills'}
                  </span>
                </div>

                <div style={styles.metricGrid}>
                  <div style={styles.metric}>
                    <span style={styles.metricValue}>{developer.skill_count}</span>
                    <span style={styles.metricLabel}>Skills</span>
                  </div>
                  <div style={styles.metric}>
                    <span style={styles.metricValue}>{developer.project_count || 0}</span>
                    <span style={styles.metricLabel}>Projects</span>
                  </div>
                  <div style={styles.metric}>
                    <span style={styles.metricValue}>{activeTasks}</span>
                    <span style={styles.metricLabel}>Active</span>
                  </div>
                  <div style={styles.metric}>
                    <span style={styles.metricValue}>{completedTasks}</span>
                    <span style={styles.metricLabel}>Done</span>
                  </div>
                </div>

                <div style={styles.workloadBlock}>
                  <div style={styles.workloadHeader}>
                    <span>Assigned workload</span>
                    <strong>{assignedTasks} tasks</strong>
                  </div>
                  <div style={styles.workloadTrack}>
                    <div
                      style={{
                        ...styles.workloadFill,
                        width: `${Math.min(activeTasks * 20, 100)}%`,
                        background: activeTasks > 3 ? '#c0392b' : '#2E5FA3',
                      }}
                    />
                  </div>
                </div>

                <div style={styles.skillBlock}>
                  <p style={styles.sectionLabel}>Top skill vector values</p>
                  {skillList.length === 0 ? (
                    <p style={styles.muted}>Developer has not set a skill vector.</p>
                  ) : (
                    <div style={styles.skillList}>
                      {skillList.map(([skill, level]) => (
                        <span key={skill} style={styles.skillChip}>
                          {skill}: {level}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={styles.sectionBlock}>
                  <p style={styles.sectionLabel}>Project membership</p>
                  {developer.projectMemberships.length === 0 ? (
                    <p style={styles.muted}>Not assigned to any project.</p>
                  ) : (
                    <div style={styles.projectList}>
                      {developer.projectMemberships.map((project) => (
                        <span key={project.id} style={styles.projectChip}>{project.title}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={styles.sectionBlock}>
                  <p style={styles.sectionLabel}>Assigned tasks</p>
                  {recentAssignedTasks.length === 0 ? (
                    <p style={styles.muted}>No tasks assigned by the MCO scheduler yet.</p>
                  ) : (
                    <div style={styles.taskList}>
                      {recentAssignedTasks.map((task) => (
                        <div key={task.id} style={styles.taskRow}>
                          <div>
                            <p style={styles.taskTitle}>{task.title}</p>
                            <p style={styles.taskMeta}>
                              {task.project_title || 'Unlinked project'} - {String(task.status).replace('_', ' ')}
                            </p>
                          </div>
                          <span style={styles.priorityPill}>
                            {task.priority_score === null || task.priority_score === undefined
                              ? 'No score'
                              : Number(task.priority_score).toFixed(4)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {assignedTasks > 0 && (
                  <div style={styles.scoreLine}>
                    <span>Average stored MCO score</span>
                    <strong>{averageScore.toFixed(4)}</strong>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </MainLayout>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    gap: '16px',
  },
  title: { fontSize: '24px', fontWeight: '700', color: '#1a1a2e', marginBottom: '6px' },
  subtitle: { color: '#6c757d', fontSize: '14px', lineHeight: '1.5' },
  secondaryButton: {
    background: 'white',
    color: '#2E5FA3',
    border: '1px solid #c8d8ef',
    borderRadius: '8px',
    padding: '10px 16px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  error: {
    background: '#fdecea',
    color: '#c0392b',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '14px',
    marginBottom: '16px',
  },
  statCard: {
    background: 'white',
    borderRadius: '10px',
    padding: '18px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statValue: { fontSize: '28px', fontWeight: '800', color: '#2E5FA3' },
  statLabel: { fontSize: '12px', color: '#6c757d', fontWeight: '600' },
  infoPanel: {
    background: '#f0f4ff',
    border: '1px solid #d7e4fb',
    color: '#1a3a6b',
    borderRadius: '10px',
    padding: '14px 16px',
    fontSize: '13px',
    lineHeight: '1.6',
    marginBottom: '18px',
  },
  empty: {
    background: 'white',
    borderRadius: '10px',
    padding: '40px',
    textAlign: 'center',
    color: '#6c757d',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '16px',
  },
  card: {
    background: 'white',
    borderRadius: '10px',
    padding: '18px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '14px',
  },
  name: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e', marginBottom: '4px' },
  email: { fontSize: '12px', color: '#6c757d' },
  profileBadge: {
    borderRadius: '20px',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },
  metricGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '8px',
    marginBottom: '14px',
  },
  metric: {
    background: '#f8faff',
    borderRadius: '8px',
    padding: '10px',
    textAlign: 'center',
  },
  metricValue: { display: 'block', fontWeight: '800', color: '#2E5FA3', fontSize: '18px' },
  metricLabel: { display: 'block', color: '#6c757d', fontSize: '11px', marginTop: '2px' },
  workloadBlock: { marginBottom: '14px' },
  workloadHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#555',
    marginBottom: '6px',
  },
  workloadTrack: {
    background: '#e5edf7',
    height: '8px',
    borderRadius: '20px',
    overflow: 'hidden',
  },
  workloadFill: {
    height: '8px',
    borderRadius: '20px',
    transition: 'width 0.2s',
  },
  skillBlock: { marginBottom: '14px' },
  sectionBlock: { marginBottom: '14px' },
  sectionLabel: { color: '#333', fontWeight: '700', fontSize: '12px', marginBottom: '8px' },
  muted: { color: '#888', fontSize: '12px' },
  skillList: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  skillChip: {
    background: '#eef4ff',
    color: '#2E5FA3',
    borderRadius: '20px',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: '700',
  },
  projectList: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  projectChip: {
    background: '#f0f4ff',
    color: '#1a3a6b',
    borderRadius: '20px',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: '700',
  },
  taskList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  taskRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    background: '#fafbff',
    border: '1px solid #edf1f7',
    borderRadius: '8px',
    padding: '8px 10px',
  },
  taskTitle: { color: '#1a1a2e', fontWeight: '700', fontSize: '12px', lineHeight: '1.4' },
  taskMeta: { color: '#6c757d', fontSize: '11px', marginTop: '2px' },
  priorityPill: {
    background: '#eef4ff',
    color: '#2E5FA3',
    borderRadius: '20px',
    padding: '3px 8px',
    fontSize: '11px',
    fontWeight: '800',
    whiteSpace: 'nowrap',
  },
  scoreLine: {
    borderTop: '1px solid #edf1f7',
    paddingTop: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    color: '#555',
    fontSize: '12px',
  },
};
