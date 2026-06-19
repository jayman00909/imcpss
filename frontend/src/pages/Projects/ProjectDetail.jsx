 import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  getProject, getProjectTasks, createTask,
  updateTaskStatus, deleteTask, getProjectMembers,
  getAllDevelopers, addProjectMember
} from '../../utils/api';
import MainLayout from '../../components/Layout/MainLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const STATUSES = ['todo', 'in_progress', 'in_review', 'done'];
const STATUS_LABELS = {
  todo: '📋 To Do',
  in_progress: '⚡ In Progress',
  in_review: '🔍 In Review',
  done: '✅ Done',
};
const STATUS_COLORS = {
  todo: '#e3eaf5',
  in_progress: '#fff3cd',
  in_review: '#e8f4fd',
  done: '#e8f5e9',
};
const STATUS_BADGE = {
  todo: { bg: '#dbe4f0', color: '#2E5FA3' },
  in_progress: { bg: '#fff0b3', color: '#856404' },
  in_review: { bg: '#cce5ff', color: '#004085' },
  done: { bg: '#d4edda', color: '#155724' },
};

const SKILL_OPTIONS = [
  'React', 'Node.js', 'PostgreSQL', 'JavaScript', 'CSS',
  'Python', 'UI/UX Design', 'API Development', 'Testing', 'DevOps'
];

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [allDevs, setAllDevs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showMemberPanel, setShowMemberPanel] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', deadline: '',
    effort_hours: '', business_value: 5, required_skills: []
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    try {
      const [projRes, tasksRes, membersRes] = await Promise.all([
        getProject(id),
        getProjectTasks(id),
        getProjectMembers(id),
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
      setMembers(membersRes.data);
      if (user.role === 'manager') {
        const devRes = await getAllDevelopers();
        setAllDevs(devRes.data);
      }
    } catch {
      setError('Could not load project.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const getTasksByStatus = (status) =>
    tasks.filter(t => t.status === status);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      setTasks(tasks.map(t =>
        t.id === taskId ? { ...t, status: newStatus } : t
      ));
    } catch {
      alert('Could not update task status.');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const skillVector = {};
      taskForm.required_skills.forEach(s => { skillVector[s] = 3; });
      await createTask({
        ...taskForm,
        project_id: id,
        required_skills: skillVector,
      });
      setShowTaskForm(false);
      setTaskForm({
        title: '', description: '', deadline: '',
        effort_hours: '', business_value: 5, required_skills: []
      });
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create task.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    await deleteTask(taskId);
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const handleAddMember = async (userId) => {
    await addProjectMember(id, { user_id: userId });
    fetchAll();
  };

  const toggleSkill = (skill) => {
    setTaskForm(prev => ({
      ...prev,
      required_skills: prev.required_skills.includes(skill)
        ? prev.required_skills.filter(s => s !== skill)
        : [...prev.required_skills, skill]
    }));
  };

  const completedCount = tasks.filter(t => t.status === 'done').length;
  const progressPct = tasks.length > 0
    ? Math.round((completedCount / tasks.length) * 100) : 0;

  if (loading) return <MainLayout><LoadingSpinner /></MainLayout>;

  return (
    <MainLayout>
      {/* Project Header */}
      <div style={styles.header}>
        <div>
          <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
            ← Back to Projects
          </button>
          <h1 style={styles.title}>{project?.title}</h1>
          <p style={styles.desc}>{project?.description}</p>
          <div style={styles.dates}>
            <span>📅 {new Date(project?.start_date).toLocaleDateString()}</span>
            <span style={{ margin: '0 8px' }}>→</span>
            <span>🏁 {new Date(project?.end_date).toLocaleDateString()}</span>
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.progressBox}>
            <p style={styles.progressLabel}>Progress</p>
            <p style={styles.progressNum}>{progressPct}%</p>
            <div style={styles.progressBarBg}>
              <div style={{ ...styles.progressBarFill, width: `${progressPct}%` }} />
            </div>
            <p style={styles.progressSub}>{completedCount}/{tasks.length} tasks done</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={styles.actionBar}>
        {user.role === 'manager' && (
          <>
            <button style={styles.primaryBtn} onClick={() => setShowTaskForm(!showTaskForm)}>
              {showTaskForm ? '✕ Cancel' : '+ Add Task'}
            </button>
            <button style={styles.secondaryBtn} onClick={() => setShowMemberPanel(!showMemberPanel)}>
              👥 Manage Team ({members.length})
            </button>
          </>
        )}
        <button
          style={styles.scheduleBtn}
          onClick={() => navigate(`/projects/${id}/schedule`)}
        >
          🧠 Generate MCO Schedule →
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Team Member Panel */}
      {showMemberPanel && user.role === 'manager' && (
        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>👥 Project Team</h3>
          <div style={styles.memberGrid}>
            <div>
              <p style={styles.panelSubtitle}>Current Members</p>
              {members.length === 0
                ? <p style={styles.muted}>No members yet.</p>
                : members.map(m => (
                  <div key={m.id} style={styles.memberTag}>
                    👤 {m.full_name} — <span style={styles.roleLabel}>{m.role}</span>
                  </div>
                ))
              }
            </div>
            <div>
              <p style={styles.panelSubtitle}>Add Developer</p>
              {allDevs
                .filter(d => !members.find(m => m.id === d.id))
                .map(d => (
                  <div key={d.id} style={styles.devRow}>
                    <span>👤 {d.full_name}</span>
                    <button style={styles.addMemberBtn} onClick={() => handleAddMember(d.id)}>
                      + Add
                    </button>
                  </div>
                ))
              }
              {allDevs.filter(d => !members.find(m => m.id === d.id)).length === 0 && (
                <p style={styles.muted}>All developers are already on this project.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task Creation Form */}
      {showTaskForm && user.role === 'manager' && (
        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>➕ Create New Task</h3>
          <form onSubmit={handleCreateTask}>
            <div style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Task Title *</label>
                <input style={styles.input} required
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Build Login Page"
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Description</label>
                <input style={styles.input}
                  value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="What needs to be done?"
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Deadline *</label>
                <input type="date" style={styles.input} required
                  value={taskForm.deadline}
                  onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Effort (hours) *</label>
                <input type="number" style={styles.input} required min="1"
                  value={taskForm.effort_hours}
                  onChange={e => setTaskForm({ ...taskForm, effort_hours: e.target.value })}
                  placeholder="e.g. 8"
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Business Value (1–10): {taskForm.business_value}</label>
                <input type="range" min="1" max="10"
                  value={taskForm.business_value}
                  onChange={e => setTaskForm({ ...taskForm, business_value: Number(e.target.value) })}
                  style={{ width: '100%', marginTop: '8px' }}
                />
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Required Skills (select all that apply)</label>
              <div style={styles.skillGrid}>
                {SKILL_OPTIONS.map(skill => (
                  <button
                    key={skill} type="button"
                    onClick={() => toggleSkill(skill)}
                    style={{
                      ...styles.skillTag,
                      background: taskForm.required_skills.includes(skill) ? '#2E5FA3' : '#f0f2f5',
                      color: taskForm.required_skills.includes(skill) ? 'white' : '#555',
                      borderColor: taskForm.required_skills.includes(skill) ? '#2E5FA3' : '#dee2e6',
                    }}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" style={styles.primaryBtn} disabled={saving}>
              {saving ? 'Creating...' : '✓ Create Task'}
            </button>
          </form>
        </div>
      )}

      {/* Kanban Board */}
      <div style={styles.kanban}>
        {STATUSES.map(status => (
          <div key={status} style={{ ...styles.column, background: STATUS_COLORS[status] }}>
            <div style={styles.columnHeader}>
              <span style={styles.columnTitle}>{STATUS_LABELS[status]}</span>
              <span style={styles.columnCount}>{getTasksByStatus(status).length}</span>
            </div>

            {getTasksByStatus(status).length === 0 ? (
              <div style={styles.emptyCol}>No tasks here</div>
            ) : (
              getTasksByStatus(status).map(task => (
                <div key={task.id} style={styles.taskCard}>
                  <div style={styles.taskTop}>
                    <p style={styles.taskTitle}>{task.title}</p>
                    {user.role === 'manager' && (
                      <button
                        style={styles.deleteTaskBtn}
                        onClick={() => handleDeleteTask(task.id)}
                      >✕</button>
                    )}
                  </div>

                  {task.description && (
                    <p style={styles.taskDesc}>{task.description}</p>
                  )}

                  <div style={styles.taskMeta}>
                    <span style={styles.metaItem}>
                      📅 {new Date(task.deadline).toLocaleDateString()}
                    </span>
                    <span style={styles.metaItem}>⏱ {task.effort_hours}h</span>
                    {task.priority_score > 0 && (
                      <span style={styles.scoreTag}>
                        🎯 {parseFloat(task.priority_score).toFixed(3)}
                      </span>
                    )}
                  </div>

                  {/* Required skills */}
                  {task.required_skills && Object.keys(task.required_skills).length > 0 && (
                    <div style={styles.skillRow}>
                      {Object.keys(task.required_skills).map(s => (
                        <span key={s} style={styles.smallSkillTag}>{s}</span>
                      ))}
                    </div>
                  )}

                  {/* Status changer */}
                  <select
                    value={task.status}
                    onChange={e => handleStatusChange(task.id, e.target.value)}
                    style={styles.statusSelect}
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </MainLayout>
  );
}

const styles = {
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    background: 'white', borderRadius: '12px', padding: '24px',
    marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
  },
  backBtn: {
    background: 'none', border: 'none', color: '#2E5FA3',
    cursor: 'pointer', fontSize: '13px', marginBottom: '8px',
    padding: '0', fontWeight: '600',
  },
  title: { fontSize: '22px', fontWeight: '700', color: '#1a1a2e', marginBottom: '6px' },
  desc: { color: '#6c757d', fontSize: '14px', marginBottom: '8px' },
  dates: { fontSize: '13px', color: '#888' },
  headerRight: {},
  progressBox: {
    background: '#f0f4ff', borderRadius: '10px', padding: '16px',
    minWidth: '180px', textAlign: 'center',
  },
  progressLabel: { fontSize: '12px', color: '#6c757d', marginBottom: '4px' },
  progressNum: { fontSize: '32px', fontWeight: '800', color: '#2E5FA3', marginBottom: '8px' },
  progressBarBg: { background: '#dce8ff', borderRadius: '10px', height: '8px', marginBottom: '6px' },
  progressBarFill: { background: '#2E5FA3', borderRadius: '10px', height: '8px', transition: 'width 0.4s' },
  progressSub: { fontSize: '11px', color: '#888' },
  actionBar: { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' },
  primaryBtn: {
    background: '#2E5FA3', color: 'white', border: 'none',
    padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
    fontWeight: '600', fontSize: '14px',
  },
  secondaryBtn: {
    background: 'white', color: '#2E5FA3', border: '2px solid #2E5FA3',
    padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
    fontWeight: '600', fontSize: '14px',
  },
  scheduleBtn: {
    background: 'linear-gradient(135deg, #1A3A6B, #2E5FA3)',
    color: 'white', border: 'none', padding: '10px 20px',
    borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px',
  },
  error: {
    background: '#fdecea', color: '#c0392b', padding: '12px',
    borderRadius: '8px', marginBottom: '16px', fontSize: '14px',
  },
  panel: {
    background: 'white', borderRadius: '12px', padding: '24px',
    marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
  },
  panelTitle: { fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1a1a2e' },
  panelSubtitle: { fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '10px' },
  memberGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  memberTag: {
    background: '#f0f4ff', padding: '8px 12px', borderRadius: '8px',
    marginBottom: '8px', fontSize: '13px',
  },
  roleLabel: { color: '#2E5FA3', fontWeight: '600' },
  devRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: '13px',
  },
  addMemberBtn: {
    background: '#e8f5e9', color: '#27AE60', border: 'none',
    padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600',
  },
  muted: { color: '#6c757d', fontSize: '13px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
  field: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: '13px', fontWeight: '600', color: '#444', marginBottom: '6px' },
  input: {
    padding: '10px 12px', border: '1.5px solid #dee2e6',
    borderRadius: '8px', fontSize: '14px', outline: 'none',
  },
  skillGrid: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' },
  skillTag: {
    padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
    fontSize: '13px', fontWeight: '500', border: '1.5px solid',
    transition: 'all 0.15s',
  },
  kanban: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    alignItems: 'start',
  },
  column: {
    borderRadius: '12px', padding: '16px', minHeight: '400px',
  },
  columnHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '14px',
  },
  columnTitle: { fontWeight: '700', fontSize: '14px', color: '#333' },
  columnCount: {
    background: 'rgba(0,0,0,0.1)', color: '#444', borderRadius: '20px',
    padding: '2px 10px', fontSize: '12px', fontWeight: '600',
  },
  emptyCol: {
    textAlign: 'center', color: '#aaa', fontSize: '13px',
    padding: '30px 0', fontStyle: 'italic',
  },
  taskCard: {
    background: 'white', borderRadius: '10px', padding: '14px',
    marginBottom: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  taskTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' },
  taskTitle: { fontSize: '14px', fontWeight: '600', color: '#1a1a2e', flex: 1, lineHeight: '1.4' },
  deleteTaskBtn: {
    background: 'none', border: 'none', color: '#ccc',
    cursor: 'pointer', fontSize: '14px', padding: '0 0 0 6px',
  },
  taskDesc: { fontSize: '12px', color: '#888', marginBottom: '8px', lineHeight: '1.5' },
  taskMeta: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' },
  metaItem: { fontSize: '11px', color: '#666', background: '#f5f5f5', padding: '2px 8px', borderRadius: '10px' },
  scoreTag: {
    fontSize: '11px', background: '#e8f0fe', color: '#2E5FA3',
    padding: '2px 8px', borderRadius: '10px', fontWeight: '600',
  },
  skillRow: { display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' },
  smallSkillTag: {
    fontSize: '10px', background: '#eef2ff', color: '#4a6fa5',
    padding: '2px 8px', borderRadius: '10px',
  },
  statusSelect: {
    width: '100%', padding: '6px 8px', border: '1px solid #dee2e6',
    borderRadius: '6px', fontSize: '12px', background: '#fafafa', cursor: 'pointer',
  },
};