 import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject, getProjectTasks } from '../../utils/api';
import MainLayout from '../../components/layout/MainLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Icon from '../../components/common/Icon';

const STATUS_LABELS = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
};

const STATUS_COLORS = {
  todo: '#6c757d',
  in_progress: '#2E5FA3',
  in_review: '#F39C12',
  done: '#27AE60',
};

export default function ReportsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoading(true);
        setError('');

        const [projectRes, tasksRes] = await Promise.all([
          getProject(id),
          getProjectTasks(id),
        ]);

        setProject(projectRes.data);
        setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
      } catch (err) {
        console.error('Load reports error:', err);
        setError(
          err.response?.data?.error ||
          'Could not load project reports.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [id]);

  if (loading) {
    return (
      <MainLayout>
        <div style={styles.center}>
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div style={styles.container}>
          <div style={styles.errorBox}>{error}</div>

          <button
            style={styles.secondaryBtn}
            onClick={() => navigate(`/projects/${id}`)}
          >
            <span className="icon-text"><Icon name="arrowLeft" size={14} />Back to Project</span>
          </button>
        </div>
      </MainLayout>
    );
  }

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    task => task.status === 'done'
  ).length;

  const inProgressTasks = tasks.filter(
    task => task.status === 'in_progress'
  ).length;

  const reviewTasks = tasks.filter(
    task => task.status === 'in_review'
  ).length;

  const todoTasks = tasks.filter(
    task => task.status === 'todo'
  ).length;

  const completion =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

  const totalEffort = tasks.reduce(
    (sum, task) => sum + Number(task.effort_hours || 0),
    0
  );

  const completedEffort = tasks
    .filter(task => task.status === 'done')
    .reduce(
      (sum, task) => sum + Number(task.effort_hours || 0),
      0
    );

  const assignedTasks = tasks.filter(
    task => task.assigned_developer_id
  ).length;

  const unassignedTasks = totalTasks - assignedTasks;

  const developers = {};

  tasks.forEach(task => {
    const developer =
      task.assigned_developer ||
      task.developer_name ||
      task.assigned_developer_name;

    if (!developer) return;

    const name =
      typeof developer === 'string'
        ? developer
        : developer.full_name || developer.name || 'Developer';

    if (!developers[name]) {
      developers[name] = {
        tasks: 0,
        effort: 0,
        completed: 0,
      };
    }

    developers[name].tasks += 1;
    developers[name].effort += Number(task.effort_hours || 0);

    if (task.status === 'done') {
      developers[name].completed += 1;
    }
  });

  const workloadEntries = Object.entries(developers).sort(
    (a, b) => b[1].tasks - a[1].tasks
  );

  return (
    <MainLayout>
      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <button
            style={styles.backBtn}
            onClick={() => navigate(`/projects/${id}`)}
          >
            <span className="icon-text"><Icon name="arrowLeft" size={14} />Back to Project</span>
          </button>

          <h1 style={styles.title}>
            Project Reports
          </h1>

          <p style={styles.subtitle}>
            {project?.title || 'Project'} — performance and task analytics
          </p>
        </div>

        {/* Summary cards */}
        <div style={styles.statsGrid}>
          <StatCard
            label="Total Tasks"
            value={totalTasks}
            color="#2E5FA3"
          />

          <StatCard
            label="Completed"
            value={completedTasks}
            color="#27AE60"
          />

          <StatCard
            label="In Progress"
            value={inProgressTasks}
            color="#F39C12"
          />

          <StatCard
            label="Completion"
            value={`${completion}%`}
            color="#8E44AD"
          />
        </div>

        {/* Project progress */}
        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>
            <Icon name="trendingUp" size={17} />Project Progress
          </h2>

          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressBar,
                width: `${completion}%`,
              }}
            />
          </div>

          <p style={styles.progressText}>
            {completedTasks} of {totalTasks} tasks completed ({completion}%)
          </p>
        </section>

        {/* Status breakdown */}
        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>
            <Icon name="barChart" size={17} />Task Status Breakdown
          </h2>

          <div style={styles.statusGrid}>
            {Object.keys(STATUS_LABELS).map(status => {
              const count = tasks.filter(
                task => task.status === status
              ).length;

              const percentage =
                totalTasks > 0
                  ? Math.round((count / totalTasks) * 100)
                  : 0;

              return (
                <div
                  key={status}
                  style={styles.statusCard}
                >
                  <div style={styles.statusTop}>
                    <span
                      style={{
                        ...styles.statusDot,
                        background:
                          STATUS_COLORS[status],
                      }}
                    />

                    <strong>
                      {STATUS_LABELS[status]}
                    </strong>

                    <span style={styles.muted}>
                      {count}
                    </span>
                  </div>

                  <div style={styles.miniTrack}>
                    <div
                      style={{
                        ...styles.miniBar,
                        width: `${percentage}%`,
                        background:
                          STATUS_COLORS[status],
                      }}
                    />
                  </div>

                  <span style={styles.muted}>
                    {percentage}%
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Project metrics */}
        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>
            <Icon name="clipboard" size={17} />Project Metrics
          </h2>

          <div style={styles.metricsGrid}>
            <Metric
              label="Total Planned Effort"
              value={`${totalEffort} hrs`}
            />

            <Metric
              label="Completed Effort"
              value={`${completedEffort} hrs`}
            />

            <Metric
              label="Assigned Tasks"
              value={assignedTasks}
            />

            <Metric
              label="Unassigned Tasks"
              value={unassignedTasks}
            />

            <Metric
              label="To Do"
              value={todoTasks}
            />

            <Metric
              label="In Review"
              value={reviewTasks}
            />
          </div>
        </section>

        {/* Developer workload */}
        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>
            <Icon name="users" size={17} />Developer Workload
          </h2>

          {workloadEntries.length === 0 ? (
            <p style={styles.muted}>
              No developer assignments are available yet.
            </p>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Developer</th>
                    <th style={styles.th}>Tasks</th>
                    <th style={styles.th}>Effort</th>
                    <th style={styles.th}>Completed</th>
                  </tr>
                </thead>

                <tbody>
                  {workloadEntries.map(([name, data]) => (
                    <tr key={name}>
                      <td style={styles.td}>
                        <strong>{name}</strong>
                      </td>

                      <td style={styles.td}>
                        {data.tasks}
                      </td>

                      <td style={styles.td}>
                        {data.effort} hrs
                      </td>

                      <td style={styles.td}>
                        <span style={styles.completedBadge}>
                          {data.completed}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Priority overview */}
        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>
            <Icon name="target" size={17} />Task Priority Overview
          </h2>

          {tasks.length === 0 ? (
            <p style={styles.muted}>
              No tasks available.
            </p>
          ) : (
            <div style={styles.priorityList}>
              {[...tasks]
                .sort(
                  (a, b) =>
                    Number(b.priority_score || 0) -
                    Number(a.priority_score || 0)
                )
                .map((task, index) => (
                  <div
                    key={task.id}
                    style={styles.priorityRow}
                  >
                    <div style={styles.rank}>
                      #{index + 1}
                    </div>

                    <div style={styles.taskInfo}>
                      <strong>
                        {task.title}
                      </strong>

                      <span style={styles.muted}>
                        {STATUS_LABELS[task.status] ||
                          task.status}
                        {' • '}
                        {task.effort_hours || 0} hrs
                      </span>
                    </div>

                    <div style={styles.priorityScore}>
                      {task.priority_score != null
                        ? Number(task.priority_score).toFixed(4)
                        : '—'}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>

      </div>
    </MainLayout>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={styles.statCard}>
      <div
        style={{
          ...styles.statAccent,
          background: color,
        }}
      />

      <div style={styles.statLabel}>
        {label}
      </div>

      <div
        style={{
          ...styles.statValue,
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div style={styles.metricCard}>
      <span style={styles.metricLabel}>
        {label}
      </span>

      <strong style={styles.metricValue}>
        {value}
      </strong>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '30px 24px 50px',
  },

  center: {
    minHeight: '70vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  header: {
    marginBottom: '28px',
  },

  backBtn: {
    border: 'none',
    background: 'transparent',
    color: '#2E5FA3',
    cursor: 'pointer',
    padding: '0',
    marginBottom: '12px',
    fontSize: '14px',
    fontWeight: '600',
  },

  title: {
    margin: '0',
    color: '#1a1a2e',
    fontSize: '28px',
  },

  subtitle: {
    color: '#6c757d',
    marginTop: '8px',
    fontSize: '14px',
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },

  statCard: {
    position: 'relative',
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow:
      '0 2px 8px rgba(0,0,0,0.07)',
    overflow: 'hidden',
  },

  statAccent: {
    position: 'absolute',
    left: '0',
    top: '0',
    bottom: '0',
    width: '4px',
  },

  statLabel: {
    color: '#6c757d',
    fontSize: '13px',
    marginBottom: '8px',
  },

  statValue: {
    fontSize: '25px',
    fontWeight: '700',
  },

  panel: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow:
      '0 2px 8px rgba(0,0,0,0.07)',
  },

  panelTitle: {
    margin: '0 0 20px',
    fontSize: '17px',
    color: '#1a1a2e',
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
  },

  progressTrack: {
    height: '14px',
    background: '#edf0f4',
    borderRadius: '20px',
    overflow: 'hidden',
  },

  progressBar: {
    height: '100%',
    background:
      'linear-gradient(90deg, #2E5FA3, #27AE60)',
    borderRadius: '20px',
  },

  progressText: {
    marginTop: '10px',
    color: '#555',
    fontSize: '14px',
  },

  statusGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '14px',
  },

  statusCard: {
    border: '1px solid #edf0f4',
    borderRadius: '10px',
    padding: '14px',
  },

  statusTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    marginBottom: '10px',
  },

  statusDot: {
    width: '9px',
    height: '9px',
    borderRadius: '50%',
  },

  miniTrack: {
    height: '7px',
    background: '#edf0f4',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '6px',
  },

  miniBar: {
    height: '100%',
    borderRadius: '10px',
  },

  muted: {
    color: '#6c757d',
    fontSize: '13px',
  },

  metricsGrid: {
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '14px',
  },

  metricCard: {
    background: '#f7f9fc',
    borderRadius: '10px',
    padding: '16px',
  },

  metricLabel: {
    display: 'block',
    color: '#6c757d',
    fontSize: '13px',
    marginBottom: '7px',
  },

  metricValue: {
    color: '#1a1a2e',
    fontSize: '20px',
  },

  tableWrapper: {
    overflowX: 'auto',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },

  th: {
    textAlign: 'left',
    padding: '12px',
    background: '#f7f9fc',
    color: '#555',
    fontSize: '13px',
    borderBottom: '1px solid #dee2e6',
  },

  td: {
    padding: '13px 12px',
    borderBottom: '1px solid #edf0f4',
    fontSize: '14px',
    color: '#333',
  },

  completedBadge: {
    display: 'inline-block',
    minWidth: '28px',
    padding: '4px 8px',
    borderRadius: '20px',
    background: '#e8f5e9',
    color: '#27AE60',
    textAlign: 'center',
    fontWeight: '600',
  },

  priorityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  priorityRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '12px',
    border: '1px solid #edf0f4',
    borderRadius: '9px',
  },

  rank: {
    width: '38px',
    color: '#2E5FA3',
    fontWeight: '700',
    fontSize: '13px',
  },

  taskInfo: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },

  priorityScore: {
    color: '#8E44AD',
    fontWeight: '700',
    fontSize: '15px',
  },

  secondaryBtn: {
    border: 'none',
    background: '#2E5FA3',
    color: 'white',
    padding: '10px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },

  errorBox: {
    background: '#fdecea',
    color: '#c0392b',
    padding: '14px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
};