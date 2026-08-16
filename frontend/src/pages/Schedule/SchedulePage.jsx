 import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import MainLayout from '../../components/layout/MainLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Icon from '../../components/common/Icon';
export default function SchedulePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const loadSchedule = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/schedule/${id}`);
      setSchedule(response.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('No MCO schedule has been generated for this project yet.');
      } else {
        setError(
          err.response?.data?.error ||
          'Could not load the project schedule.'
        );
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadSchedule();
  }, [id]);
  const generateSchedule = async () => {
  try {
    setGenerating(true);
    setError('');

  const response = await api.post(`/schedule/generate/${id}`, {
  weights: {
  w1: 0.30,
  w2: 0.25,
  w3: 0.20,
  w4: 0.15,
  w5: 0.10
}
});

    const generatedSchedule =
      response.data.schedule ||
      response.data.saved_schedule?.schedule_data ||
      [];

    const savedSchedule = response.data.saved_schedule;

    setSchedule({
      id: savedSchedule?.id || response.data.id,
      project_id: id,
      weights: savedSchedule?.weights || response.data.weights || {},
      schedule_data: generatedSchedule,
      elapsed_ms: savedSchedule?.elapsed_ms || response.data.elapsed_ms || 0,
      created_at: savedSchedule?.created_at || response.data.created_at
    });

  } catch (err) {
    setError(
      err.response?.data?.error ||
      'Could not generate MCO schedule.'
    );
  } finally {
    setGenerating(false);
  }
};
  if (loading) {
    return (
      <MainLayout>
        <LoadingSpinner />
      </MainLayout>
    );
  }
  const tasks = schedule?.schedule_data || [];
  return (
    <MainLayout>
      <div style={styles.container}>
     {/* Header */}
<div style={styles.header}>
  <div>
    <button
      onClick={() => navigate(`/projects/${id}`)}
      style={{ ...styles.backButton, ...styles.inline }}
    >
      <Icon name="arrowLeft" size={14} />
      Back to Project
    </button>

    <h1 style={{ ...styles.title, ...styles.inline, gap: '10px' }}>
      <Icon name="cpu" size={24} />
      MCO Optimized Schedule
    </h1>

    <p style={styles.subtitle}>
      Multi-Criteria Optimization schedule generated from
      task urgency, developer skill matching, dependencies,
      business value and effort efficiency.
    </p>
  </div>

  <button
    onClick={generateSchedule}
    disabled={generating}
    style={{ ...styles.generateButton, ...styles.inline }}
  >
    {!generating && <Icon name="refresh" size={15} />}
    {generating ? 'Generating...' : 'Regenerate Schedule'}
  </button>
</div>
        {/* Error */}
        {error && (
          <div style={styles.error}>
            <strong>Notice:</strong> {error}
            {!schedule && (
              <button
                onClick={generateSchedule}
                style={styles.generateFromError}
              >
                Generate MCO Schedule
              </button>
            )}
          </div>
        )}
        {schedule && (
          <>
            {/* Summary cards */}
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statIcon}><Icon name="clipboard" size={26} /></div>
                <div>
                  <div style={styles.statLabel}>Scheduled Tasks</div>
                  <div style={styles.statValue}>{tasks.length}</div>
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statIcon}><Icon name="zap" size={26} /></div>
                <div>
                  <div style={styles.statLabel}>Generation Time</div>
                  <div style={styles.statValue}>
                    {schedule.elapsed_ms ?? 0} ms
                  </div>
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statIcon}><Icon name="target" size={26} /></div>
                <div>
                  <div style={styles.statLabel}>Highest Priority</div>
                  <div style={styles.statValue}>
                    {tasks.length > 0
                      ? Number(tasks[0].priority_score || 0).toFixed(4)
                      : '0.0000'}
                  </div>
                </div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statIcon}><Icon name="ban" size={26} /></div>
                <div>
                  <div style={styles.statLabel}>Blocked Tasks</div>
                  <div style={styles.statValue}>
                    {tasks.filter(t => t.is_blocked).length}
                  </div>
                </div>
              </div>
            </div>
            {/* Weights */}
            <div style={styles.panel}>
              <h2 style={{ ...styles.sectionTitle, ...styles.inline }}>
                <Icon name="sliders" size={18} />
                MCO Criteria Weights
              </h2>
              <div style={styles.weightsGrid}>
                <Weight
                  label="Deadline Urgency"
                  value={schedule.weights?.w1}
                />
                <Weight
                  label="Developer Skill Match"
                  value={schedule.weights?.w2}
                />
                <Weight
                  label="Dependency Status"
                  value={schedule.weights?.w3}
                />
                <Weight
                  label="Business Value"
                  value={schedule.weights?.w4}
                />
                <Weight
                  label="Effort Efficiency"
                  value={schedule.weights?.w5}
                />
              </div>
            </div>
            {/* Schedule table */}
            <div style={styles.panel}>
              <div style={styles.tableHeader}>
                <div>
                  <h2 style={{ ...styles.sectionTitle, ...styles.inline }}>
                    <Icon name="barChart" size={18} />
                    Optimized Task Schedule
                  </h2>
                  <p style={styles.tableDescription}>
                    Tasks are ranked from highest to lowest MCO
                    priority score.
                  </p>
                </div>
              </div>
              {tasks.length === 0 ? (
                <div style={styles.empty}>
                  No tasks were included in the generated schedule.
                </div>
              ) : (
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Rank</th>
                        <th style={styles.th}>Task</th>
                        <th style={styles.th}>Deadline</th>
                        <th style={styles.th}>Effort</th>
                        <th style={styles.th}>Priority</th>
                        <th style={styles.th}>Developer</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task, index) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          index={index}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {/* Explanation */}
            <div style={styles.panel}>
              <h2 style={{ ...styles.sectionTitle, ...styles.inline }}>
                <Icon name="cpu" size={18} />
                How the MCO Score Works
              </h2>
              <p style={styles.explanation}>
                Each task receives a priority score based on five
                criteria. The system combines deadline urgency,
                developer skill compatibility, dependency status,
                business value and effort efficiency to determine
                the recommended execution order.
              </p>
              <div style={styles.formula}>
                Priority Score =
                <br />
                (W1 × Deadline Urgency) +
                (W2 × Skill Match) +
                (W3 × Dependency Status) +
                (W4 × Business Value) +
                (W5 × Effort Efficiency)
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
function Weight({ label, value }) {
  const percentage = Math.round(Number(value || 0) * 100);
  return (
    <div style={styles.weightCard}>
      <div style={styles.weightTop}>
        <span>{label}</span>
        <strong>{percentage}%</strong>
      </div>
      <div style={styles.weightBar}>
        <div
          style={{
            ...styles.weightFill,
            width: `${percentage}%`
          }}
        />
      </div>
    </div>
  );
}
function TaskRow({ task, index }) {
  const score = Number(task.priority_score || 0);
  const developer =
    task.assigned_developer?.full_name ||
    task.assigned_developer_name ||
    'Not assigned';
  const deadline = task.deadline
    ? new Date(task.deadline).toLocaleDateString()
    : '—';
  return (
    <tr>
      <td style={styles.td}>
        <div style={styles.rank}>
          #{index + 1}
        </div>
      </td>
      <td style={styles.td}>
        <strong style={styles.taskName}>
          {task.title}
        </strong>
        {task.description && (
          <div style={styles.taskDescription}>
            {task.description}
          </div>
        )}
      </td>
      <td style={styles.td}>
        <span className="icon-text"><Icon name="calendar" size={13} />{deadline}</span>
      </td>
      <td style={styles.td}>
        <span className="icon-text"><Icon name="clock" size={13} />{task.effort_hours}h</span>
      </td>
      <td style={styles.td}>
        <span style={styles.score}>
          {score.toFixed(4)}
        </span>
      </td>
      <td style={styles.td}>
  <span style={{ ...styles.developerBadge, ...styles.inline }}>
    <Icon name="user" size={12} />
    {developer}
  </span>
</td>
      <td style={styles.td}>
        <span style={getStatusStyle(task.status)}>
          {formatStatus(task.status)}
        </span>
      </td>
      <td style={styles.td}>
        {task.is_blocked ? (
          <span style={{ ...styles.blocked, ...styles.inline }}>
            <Icon name="ban" size={13} />
            Blocked
          </span>
        ) : (
          <span style={{ ...styles.ready, ...styles.inline }}>
            <Icon name="check" size={13} />
            Ready
          </span>
        )}
      </td>
    </tr>
  );
}
function formatStatus(status) {
  const labels = {
    todo: 'To Do',
    in_progress: 'In Progress',
    in_review: 'In Review',
    done: 'Done'
  };
  return labels[status] || status;
}
function getStatusStyle(status) {
  const stylesMap = {
    todo: {
      ...styles.status,
      background: '#e3eaf5',
      color: '#2E5FA3'
    },
    in_progress: {
      ...styles.status,
      background: '#fff3cd',
      color: '#856404'
    },
    in_review: {
      ...styles.status,
      background: '#cce5ff',
      color: '#004085'
    },
    done: {
      ...styles.status,
      background: '#d4edda',
      color: '#155724'
    }
  };
  return stylesMap[status] || styles.status;
}
const styles = {
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  header: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)'
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#2E5FA3',
    cursor: 'pointer',
    fontWeight: '600',
    marginBottom: '10px'
  },
  title: {
    margin: '0 0 8px',
    color: '#1a1a2e',
    fontSize: '26px'
  },
  subtitle: {
    margin: 0,
    color: '#6c757d',
    maxWidth: '750px',
    lineHeight: '1.6',
    fontSize: '14px'
  },
  generateButton: {
    background: '#2E5FA3',
    color: 'white',
    border: 'none',
    padding: '11px 18px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    whiteSpace: 'nowrap'
  },
  error: {
    background: '#fff3cd',
    color: '#856404',
    padding: '14px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  generateFromError: {
    marginLeft: '12px',
    background: '#2E5FA3',
    color: 'white',
    border: 'none',
    padding: '7px 12px',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '20px'
  },
  statCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '18px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  statIcon: {
    color: '#2E5FA3',
    display: 'flex'
  },
  // Lines an icon up with its label.
  inline: { display: 'inline-flex', alignItems: 'center', gap: '7px' },
  statLabel: {
    fontSize: '12px',
    color: '#777',
    marginBottom: '4px'
  },
  statValue: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#1a1a2e'
  },
  panel: {
    background: 'white',
    borderRadius: '12px',
    padding: '22px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  sectionTitle: {
    margin: '0 0 8px',
    color: '#1a1a2e',
    fontSize: '17px'
  },
  weightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '12px',
    marginTop: '16px'
  },
  weightCard: {
    background: '#f7f9fc',
    padding: '12px',
    borderRadius: '8px'
  },
  weightTop: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#555',
    marginBottom: '8px'
  },
  weightBar: {
    height: '7px',
    background: '#e4e8ef',
    borderRadius: '10px',
    overflow: 'hidden'
  },
  weightFill: {
    height: '100%',
    background: '#2E5FA3',
    borderRadius: '10px'
  },
  tableDescription: {
    color: '#777',
    fontSize: '13px',
    marginBottom: '16px'
  },
  tableWrapper: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px'
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    background: '#f7f9fc',
    color: '#555',
    borderBottom: '2px solid #e5e7eb',
    whiteSpace: 'nowrap'
  },
  td: {
    padding: '14px 12px',
    borderBottom: '1px solid #edf0f3',
    verticalAlign: 'top'
  },
  rank: {
    fontWeight: '800',
    color: '#2E5FA3'
  },
  taskName: {
    color: '#1a1a2e',
    display: 'block',
    marginBottom: '4px'
  },
  taskDescription: {
    color: '#888',
    fontSize: '11px',
    maxWidth: '300px',
    lineHeight: '1.4'
  },
  score: {
    background: '#e8f0fe',
    color: '#2E5FA3',
    padding: '5px 9px',
    borderRadius: '6px',
    fontWeight: '700'
  },
  status: {
    padding: '5px 9px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    whiteSpace: 'nowrap'
  },
  blocked: {
    color: '#c0392b',
    fontWeight: '600',
    fontSize: '12px'
  },
  ready: {
    color: '#27AE60',
    fontWeight: '600',
    fontSize: '12px'
  },
    developerBadge: {
    display: 'inline-block',
    background: '#eef4ff',
    color: '#2E5FA3',
    padding: '5px 9px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600'
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#888'
  },
  explanation: {
    color: '#555',
    lineHeight: '1.7',
    fontSize: '14px'
  },
  formula: {
    background: '#f5f7fa',
    padding: '16px',
    borderRadius: '8px',
    color: '#2E5FA3',
    fontFamily: 'monospace',
    lineHeight: '1.8',
    fontSize: '13px'
  }
};
