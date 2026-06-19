 import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateSchedule, getProject } from '../../utils/api';
import MainLayout from '../../components/Layout/MainLayout';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DEFAULT_WEIGHTS = { w1: 0.30, w2: 0.25, w3: 0.20, w4: 0.15, w5: 0.10 };
const WEIGHT_LABELS = {
  w1: 'Deadline Urgency',
  w2: 'Skill Match',
  w3: 'Dependency Status',
  w4: 'Business Value',
  w5: 'Effort Efficiency',
};

export default function SchedulePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getProject(id).then(r => setProject(r.data)).catch(() => {});
  }, [id]);

  const weightSum = Object.values(weights).reduce((a, b) => a + b, 0);
  const weightsValid = Math.abs(weightSum - 1.0) < 0.001;

  const handleWeightChange = (key, value) => {
    setWeights(prev => ({ ...prev, [key]: parseFloat(value) }));
  };

  const handleGenerate = async () => {
    if (!weightsValid) {
      setError('Weights must sum to exactly 1.0. Current sum: ' + weightSum.toFixed(2));
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await generateSchedule(id, weights);
      setSchedule(res.data.schedule);
      setGenerated(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not generate schedule.');
    } finally {
      setLoading(false);
    }
  };

  const activeTasks = schedule.filter(t => !t.is_blocked);
  const blockedTasks = schedule.filter(t => t.is_blocked);

  // Gantt chart data
  const ganttData = {
    labels: activeTasks.slice(0, 10).map(t =>
      t.title.length > 20 ? t.title.slice(0, 20) + '…' : t.title
    ),
    datasets: [{
      label: 'Priority Score',
      data: activeTasks.slice(0, 10).map(t =>
        parseFloat(t.priority_score)
      ),
      backgroundColor: activeTasks.slice(0, 10).map((_, i) =>
        `hsl(${210 + i * 12}, 65%, ${55 + i * 2}%)`
      ),
      borderRadius: 6,
      borderSkipped: false,
    }]
  };

  const ganttOptions = {
    indexAxis: 'y',
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Task Priority Scores (MCO Engine Output)',
        font: { size: 14, weight: 'bold' },
        color: '#1a1a2e',
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` Priority Score: ${ctx.raw.toFixed(4)}`,
        }
      }
    },
    scales: {
      x: {
        min: 0, max: 1,
        title: { display: true, text: 'Composite MCO Score (0–1)' },
        grid: { color: '#f0f0f0' },
      },
      y: { grid: { display: false } },
    },
  };

  return (
    <MainLayout>
      <div style={styles.header}>
        <button
  onClick={() => navigate(`/projects/${id}/compare`)}
  style={{
    background: '#1a1a2e', color: '#7dd3fc', border: '1px solid #334155',
    padding: '8px 18px', borderRadius: '8px', cursor: 'pointer',
    fontSize: '13px', fontWeight: '600', marginTop: '10px',
    display: 'inline-block',
  }}
>
  📊 Run Algorithm Comparison →
</button>  
        <button onClick={() => navigate(`/projects/${id}`)} style={styles.backBtn}>
          ← Back to Project
        </button>
        <h1 style={styles.title}>🧠 MCO Schedule Generator</h1>
        {project && (
          <p style={styles.sub}>Project: <strong>{project.title}</strong></p>
        )}
      </div>

      {/* Weight Configuration */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>⚙️ Configure Scheduling Weights</h2>
        <p style={styles.cardDesc}>
          Adjust how much each criterion influences the priority score.
          The five weights must add up to exactly <strong>1.0</strong>.
        </p>

        <div style={styles.weightsGrid}>
          {Object.entries(weights).map(([key, val]) => (
            <div key={key} style={styles.weightItem}>
              <div style={styles.weightHeader}>
                <label style={styles.weightLabel}>{WEIGHT_LABELS[key]}</label>
                <span style={styles.weightVal}>{val.toFixed(2)}</span>
              </div>
              <input
                type="range" min="0" max="1" step="0.05"
                value={val}
                onChange={e => handleWeightChange(key, e.target.value)}
                style={{ width: '100%', accentColor: '#2E5FA3' }}
              />
            </div>
          ))}
        </div>

        <div style={{
          ...styles.sumBar,
          background: weightsValid ? '#e8f5e9' : '#fdecea',
          color: weightsValid ? '#155724' : '#c0392b',
        }}>
          {weightsValid
            ? `✅ Weights sum = 1.00 — Ready to generate`
            : `⚠️ Weights sum = ${weightSum.toFixed(2)} — Must equal 1.00`
          }
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <button
          style={{
            ...styles.generateBtn,
            opacity: weightsValid ? 1 : 0.5,
            cursor: weightsValid ? 'pointer' : 'not-allowed',
          }}
          onClick={handleGenerate}
          disabled={loading || !weightsValid}
        >
          {loading ? '⏳ Running MCO Algorithm...' : '🚀 Generate Optimised Schedule'}
        </button>
      </div>

      {/* Results */}
      {generated && schedule.length > 0 && (
        <>
          {/* Gantt Chart */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>📊 Priority Score Chart</h2>
            <div style={{ maxHeight: '380px' }}>
              <Bar data={ganttData} options={ganttOptions} />
            </div>
          </div>

          {/* Ranked Task List */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>
              📋 Optimised Task Schedule ({activeTasks.length} active tasks)
            </h2>
            <p style={styles.cardDesc}>
              Tasks are ranked by composite MCO score. Developers are assigned
              based on cosine similarity between their skill profile and task requirements.
            </p>

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['Rank', 'Task', 'Assigned To', 'Score', 'Urgency', 'Skill Match', 'Dependency', 'Value', 'Efficiency', 'Status'].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeTasks.map((task, idx) => (
                    <tr key={task.id} style={{ background: idx % 2 === 0 ? '#fafbff' : 'white' }}>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.rankBadge,
                          background: idx === 0 ? '#ffd700' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : '#e0e0e0',
                        }}>#{idx + 1}</span>
                      </td>
                      <td style={{ ...styles.td, fontWeight: '600', maxWidth: '160px' }}>{task.title}</td>
                      <td style={styles.td}>
                        {task.assigned_developer
                          ? <span style={styles.devBadge}>👤 {task.assigned_developer.full_name}</span>
                          : <span style={styles.unassigned}>Unassigned</span>
                        }
                      </td>
                      <td style={{ ...styles.td, fontWeight: '700', color: '#2E5FA3' }}>
                        {parseFloat(task.priority_score).toFixed(4)}
                      </td>
                      <td style={styles.td}>{task.score_breakdown?.deadline_urgency?.toFixed(3) ?? '—'}</td>
                      <td style={styles.td}>{task.score_breakdown?.skill_match?.toFixed(3) ?? '—'}</td>
                      <td style={styles.td}>{task.score_breakdown?.dependency_status?.toFixed(3) ?? '—'}</td>
                      <td style={styles.td}>{task.score_breakdown?.business_value?.toFixed(3) ?? '—'}</td>
                      <td style={styles.td}>{task.score_breakdown?.effort_efficiency?.toFixed(3) ?? '—'}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusChip,
                          background: task.status === 'done' ? '#d4edda' : '#fff3cd',
                          color: task.status === 'done' ? '#155724' : '#856404',
                        }}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {blockedTasks.length > 0 && (
              <div style={styles.blockedSection}>
                <h3 style={styles.blockedTitle}>🔒 Blocked Tasks ({blockedTasks.length})</h3>
                <p style={styles.blockedDesc}>
                  These tasks have unfinished predecessor tasks and cannot be started yet.
                </p>
                {blockedTasks.map(task => (
                  <div key={task.id} style={styles.blockedItem}>
                    <span>🔒 {task.title}</span>
                    <span style={styles.muted}>Waiting on dependencies</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MCO Explanation */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>📖 How the MCO Score is Calculated</h2>
            <p style={styles.cardDesc}>
              Each task receives a composite score using the Weighted Sum Method (WSM):
            </p>
            <div style={styles.formulaBox}>
              P(Tᵢ) = w₁·U + w₂·S + w₃·D + w₄·V + w₅·E
            </div>
            <div style={styles.criteriaGrid}>
              {[
                ['U', 'Deadline Urgency', 'How close is the deadline? Closer = higher score.', weights.w1],
                ['S', 'Skill Match', 'Cosine similarity between developer skills and task requirements.', weights.w2],
                ['D', 'Dependency Status', 'Fraction of predecessor tasks already completed.', weights.w3],
                ['V', 'Business Value', 'Business importance rated 1–10 by the project manager.', weights.w4],
                ['E', 'Effort Efficiency', 'Shorter tasks score higher — quick wins first.', weights.w5],
              ].map(([symbol, name, desc, w]) => (
                <div key={symbol} style={styles.criteriaCard}>
                  <div style={styles.criteriaTop}>
                    <span style={styles.symbol}>{symbol}</span>
                    <span style={styles.criteriaName}>{name}</span>
                    <span style={styles.weightChip}>w = {w.toFixed(2)}</span>
                  </div>
                  <p style={styles.criteriaDesc}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {generated && schedule.length === 0 && (
        <div style={styles.emptyResult}>
          <p style={{ fontSize: '48px' }}>📭</p>
          <p style={{ color: '#6c757d', marginTop: '12px' }}>
            No tasks found in this project. Add tasks first, then generate the schedule.
          </p>
        </div>
      )}
    </MainLayout>
  );
}

const styles = {
  header: { marginBottom: '24px' },
  backBtn: {
    background: 'none', border: 'none', color: '#2E5FA3',
    cursor: 'pointer', fontSize: '13px', fontWeight: '600',
    padding: '0', marginBottom: '8px',
  },
  title: { fontSize: '24px', fontWeight: '700', color: '#1a1a2e', marginBottom: '4px' },
  sub: { color: '#6c757d', fontSize: '14px' },
  card: {
    background: 'white', borderRadius: '12px', padding: '24px',
    marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
  },
  cardTitle: { fontSize: '17px', fontWeight: '700', color: '#1a1a2e', marginBottom: '8px' },
  cardDesc: { color: '#6c757d', fontSize: '13px', marginBottom: '20px', lineHeight: '1.6' },
  weightsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
  weightItem: {},
  weightHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' },
  weightLabel: { fontSize: '13px', fontWeight: '600', color: '#333' },
  weightVal: {
    fontSize: '13px', fontWeight: '700', color: '#2E5FA3',
    background: '#EBF5FB', padding: '2px 10px', borderRadius: '12px',
  },
  sumBar: { padding: '12px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', marginBottom: '16px' },
  error: { background: '#fdecea', color: '#c0392b', padding: '12px', borderRadius: '8px', marginBottom: '12px', fontSize: '14px' },
  generateBtn: {
    background: 'linear-gradient(135deg, #1A3A6B, #2E5FA3)',
    color: 'white', border: 'none', padding: '14px 32px',
    borderRadius: '10px', fontSize: '15px', fontWeight: '700',
    width: '100%',
  },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: {
    background: '#2E5FA3', color: 'white', padding: '10px 12px',
    textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap',
  },
  td: { padding: '10px 12px', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' },
  rankBadge: {
    display: 'inline-block', padding: '3px 10px', borderRadius: '12px',
    fontSize: '12px', fontWeight: '700',
  },
  devBadge: {
    background: '#EBF5FB', color: '#2E5FA3', padding: '3px 10px',
    borderRadius: '12px', fontSize: '12px', fontWeight: '600',
  },
  unassigned: { color: '#aaa', fontSize: '12px' },
  statusChip: { padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' },
  blockedSection: { marginTop: '24px', padding: '16px', background: '#fff8f0', borderRadius: '10px' },
  blockedTitle: { fontSize: '14px', fontWeight: '700', color: '#856404', marginBottom: '6px' },
  blockedDesc: { fontSize: '13px', color: '#6c757d', marginBottom: '12px' },
  blockedItem: {
    display: 'flex', justifyContent: 'space-between',
    padding: '8px 0', borderBottom: '1px solid #ffe8cc', fontSize: '13px',
  },
  muted: { color: '#aaa', fontSize: '12px' },
  formulaBox: {
    background: '#1a1a2e', color: '#7dd3fc', padding: '16px 24px',
    borderRadius: '10px', fontFamily: 'monospace', fontSize: '16px',
    textAlign: 'center', marginBottom: '20px', letterSpacing: '1px',
  },
  criteriaGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' },
  criteriaCard: { background: '#f8faff', borderRadius: '10px', padding: '14px', border: '1px solid #e0e8ff' },
  criteriaTop: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
  symbol: {
    width: '28px', height: '28px', background: '#2E5FA3', color: 'white',
    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '700', fontSize: '13px',
  },
  criteriaName: { fontWeight: '600', fontSize: '13px', flex: 1 },
  weightChip: { background: '#dce8ff', color: '#2E5FA3', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' },
  criteriaDesc: { fontSize: '12px', color: '#6c757d', lineHeight: '1.5' },
  emptyResult: {
    textAlign: 'center', padding: '60px',
    background: 'white', borderRadius: '12px',
  },
};