 import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  getProject,
  getProjectTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getProjectMembers,
  getAllDevelopers,
  addProjectMember,
  addTaskDependency,
} from '../../utils/api';
import MainLayout from '../../components/layout/MainLayout'; 
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../components/common/Toast';
import Icon from '../../components/common/Icon';

const STATUSES = ['todo', 'in_progress', 'in_review', 'done'];
const STATUS_LABELS = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
};
const STATUS_ICONS = {
  todo: 'clipboard',
  in_progress: 'zap',
  in_review: 'search',
  done: 'checkCircle',
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
  // The auth slice rehydrates `user` from localStorage on boot, so Redux is the
  // single source of truth for identity and role across this component.
  const isManager = useMemo(
    () => user?.role === 'manager' || user?.role === 'admin',
    [user]
  );
  const navigate = useNavigate();
  const showToast = useToast();

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

  const [editingTaskId, setEditingTaskId] = useState(null);
const [editTitle, setEditTitle] = useState('');

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

      if (isManager) {
        const devRes = await getAllDevelopers();
        setAllDevs(devRes.data);
      }
    } catch {
      setError('Could not load project.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id, isManager]);

  const getTasksByStatus = (status) =>
    tasks.filter(t => t.status === status);

 const handleAssignDeveloper = async (taskId, developerId) => {
  try {
    const response = await updateTask(taskId, {
      assigned_developer_id: developerId ? Number(developerId) : null
    });

    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              ...response.data
            }
          : task
      )
    );

    showToast('Developer assigned successfully.', 'success');
  } catch (err) {
    console.error(
      'ASSIGN DEVELOPER ERROR:',
      err.response?.data || err
    );

    showToast(
      err.response?.data?.error || 'Could not assign developer.',
      'error'
    );
  }
};

const handleStatusChange = async (taskId, newStatus) => {
  try {
    await updateTaskStatus(taskId, newStatus);

    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, status: newStatus }
          : task
      )
    );
  } catch {
    showToast('Could not update task status.', 'error');
  }
};

const handleAddDependency = async (taskId, dependsOnId) => {
  if (!dependsOnId) return;

  try {
    await addTaskDependency(taskId, Number(dependsOnId));

    showToast('Task dependency added successfully.', 'success');

    fetchAll();
  } catch (err) {
    console.error(
      'ADD DEPENDENCY ERROR:',
      err.response?.data || err
    );

    showToast(
      err.response?.data?.error ||
      'Could not add task dependency.',
      'error'
    );
  }
};

 const handleCreateTask = async (e) => {
  e.preventDefault();
  setSaving(true);
  setError('');

  try {
    const skillVector = {};

    taskForm.required_skills.forEach(skill => {
      skillVector[skill] = 3;
    });

    await createTask({
      ...taskForm,
      project_id: id,
      required_skills: skillVector,
    });

    setShowTaskForm(false);

    setTaskForm({
      title: '',
      description: '',
      deadline: '',
      effort_hours: '',
      business_value: 5,
      required_skills: []
    });

    await fetchAll();

    showToast('Task created successfully.', 'success');

  } catch (err) {
    console.error(
      'CREATE TASK ERROR:',
      err.response?.data || err
    );

    setError(
      err.response?.data?.error ||
      'Could not create task.'
    );

    showToast(
      err.response?.data?.error ||
      'Could not create task.',
      'error'
    );

  } finally {
    setSaving(false);
  }
};

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;

    try {
      await deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      showToast('Task deleted successfully.', 'success');
    } catch (err) {
      showToast(
        err.response?.data?.error || 'Could not delete task.',
        'error'
      );
    }
  };

const handleEditTask = async (taskId) => {
  if (!editTitle.trim()) {
    showToast('Task title is required.', 'error');
    return;
  }

  try {
    const response = await updateTask(taskId, {
      title: editTitle.trim()
    });

    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, ...response.data }
          : task
      )
    );

    setEditingTaskId(null);
    setEditTitle('');

    showToast('Task updated successfully.', 'success');
  } catch (err) {
    console.error(
      'UPDATE TASK ERROR:',
      err.response?.data || err
    );

    showToast(
      err.response?.data?.error ||
      'Could not update task.',
      'error'
    );
  }
};  

  const handleAddMember = async (userId) => {
    try {
      await addProjectMember(id, { user_id: userId });
      await fetchAll();
      showToast('Developer added to the project.', 'success');
    } catch (err) {
      showToast(
        err.response?.data?.error || 'Could not add developer to the project.',
        'error'
      );
    }
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
          <button onClick={() => navigate('/dashboard')} style={{ ...styles.backBtn, ...styles.inline }}>
            <Icon name="arrowLeft" size={14} />
            Back to Projects
          </button>
          <h1 style={styles.title}>{project?.title}</h1>
          <p style={styles.desc}>{project?.description}</p>
          <div style={{ ...styles.dates, ...styles.inline, gap: '10px' }}>
            <span className="icon-text">
              <Icon name="calendar" size={13} />
              {new Date(project?.start_date).toLocaleDateString()}
            </span>
            <Icon name="arrowRight" size={13} />
            <span className="icon-text">
              <Icon name="flag" size={13} />
              {new Date(project?.end_date).toLocaleDateString()}
            </span>
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
        {isManager && (
          <>
            <button
              style={{ ...styles.primaryBtn, ...styles.inline }}
              onClick={() => setShowTaskForm(!showTaskForm)}
            >
              <Icon name={showTaskForm ? 'x' : 'plus'} size={15} />
              {showTaskForm ? 'Cancel' : 'Add Task'}
            </button>
           <button
  type="button"
  style={{ ...styles.secondaryBtn, ...styles.inline, position: 'relative', zIndex: 10 }}
  onClick={() => setShowMemberPanel(prev => !prev)}
>
  <Icon name="users" size={15} />
  Manage Team ({members.length})
</button>
          </>
        )}
        <button
          style={{ ...styles.scheduleBtn, ...styles.inline }}
          onClick={() => navigate(`/projects/${id}/schedule`)}
        >
          <Icon name="cpu" size={15} />
          Generate MCO Schedule
          <Icon name="arrowRight" size={15} />
        </button>
       <button
  type="button"
  style={{ ...styles.reportBtn, ...styles.inline }}
  onClick={() => navigate(`/projects/${id}/reports`)}
>
  <Icon name="barChart" size={15} />
  Reports &amp; Analytics
</button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Team Member Panel */}
      {showMemberPanel && (
        <div style={styles.panel}>
          <h3 style={{ ...styles.panelTitle, ...styles.inline }}>
            <Icon name="users" size={16} />
            Project Team
          </h3>
          <div style={styles.memberGrid}>
            <div>
              <p style={styles.panelSubtitle}>Current Members</p>
              {members.length === 0
                ? <p style={styles.muted}>No members yet.</p>
                : members.map(m => (
                  <div key={m.id} style={{ ...styles.memberTag, ...styles.inline }}>
                    <Icon name="user" size={13} />
                    {m.full_name} — <span style={styles.roleLabel}>{m.role}</span>
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
                    <span className="icon-text">
                      <Icon name="user" size={13} />
                      {d.full_name}
                    </span>
                    <button
                      style={{ ...styles.addMemberBtn, ...styles.inline }}
                      onClick={() => handleAddMember(d.id)}
                    >
                      <Icon name="userPlus" size={13} />
                      Add
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
      {showTaskForm && isManager && ( 
        <div style={styles.panel}>
          <h3 style={{ ...styles.panelTitle, ...styles.inline }}>
            <Icon name="plus" size={16} />
            Create New Task
          </h3>
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
            <button type="submit" style={{ ...styles.primaryBtn, ...styles.inline }} disabled={saving}>
              {!saving && <Icon name="check" size={15} />}
              {saving ? 'Creating...' : 'Create Task'}
            </button>
          </form>
        </div>
      )}

      {/* Kanban Board */}
      <div style={styles.kanban}>
        {STATUSES.map(status => (
          <div key={status} style={{ ...styles.column, background: STATUS_COLORS[status] }}>
            <div style={styles.columnHeader}>
              <span style={{ ...styles.columnTitle, ...styles.inline }}>
                <Icon name={STATUS_ICONS[status]} size={14} />
                {STATUS_LABELS[status]}
              </span>
              <span style={styles.columnCount}>{getTasksByStatus(status).length}</span>
            </div>

            {getTasksByStatus(status).length === 0 ? (
              <div style={styles.emptyCol}>No tasks here</div>
            ) : (
              getTasksByStatus(status).map(task => (
                <div key={task.id} style={styles.taskCard}>
                  <div style={styles.taskTop}>
                    {editingTaskId === task.id ? (
  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
    <input
      value={editTitle}
      onChange={(e) => setEditTitle(e.target.value)}
      style={{
        ...styles.input,
        flex: 1,
        margin: 0
      }}
      autoFocus
    />

    <button
      type="button"
      onClick={() => handleEditTask(task.id)}
      style={styles.saveBtn}
    >
      Save
    </button>

    <button
      type="button"
      onClick={() => {
        setEditingTaskId(null);
        setEditTitle('');
      }}
      style={styles.cancelBtn}
    >
      Cancel
    </button>
  </div>
) : (
 <p style={styles.taskTitle}>{task.title}</p>
)}

{isManager && (
  <>
    <button
      type="button"
      style={styles.editBtn}
      onClick={() => {
        setEditingTaskId(task.id);
        setEditTitle(task.title);
      }}
    >
      Edit
    </button>

    <button
      type="button"
      style={styles.deleteTaskBtn}
      onClick={() => handleDeleteTask(task.id)}
      aria-label="Delete task"
    >
      <Icon name="trash" size={14} />
    </button>
  </>
)}
                  </div>

                  {task.description && (
                    <p style={styles.taskDesc}>{task.description}</p>
                  )}

                  <div style={styles.taskMeta}>
                    <span style={{ ...styles.metaItem, ...styles.inline }}>
                      <Icon name="calendar" size={11} />
                      {new Date(task.deadline).toLocaleDateString()}
                    </span>
                    <span style={{ ...styles.metaItem, ...styles.inline }}>
                      <Icon name="clock" size={11} />
                      {task.effort_hours}h
                    </span>
                    {task.priority_score > 0 && (
                      <span style={{ ...styles.scoreTag, ...styles.inline }}>
                        <Icon name="target" size={11} />
                        {parseFloat(task.priority_score).toFixed(3)}
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
                 
              {isManager && (
  <div style={{ marginBottom: '10px' }}>
    <label style={{
      display: 'block',
      fontSize: '12px',
      color: '#555',
      marginBottom: '5px',
      fontWeight: '600'
    }}>
      Assign Developer
    </label>

    <select
      value={task.assigned_developer_id || ''}
      onChange={(e) => handleAssignDeveloper(task.id, e.target.value)}
      style={{
        width: '100%',
        padding: '8px',
        border: '1px solid #ccc',
        borderRadius: '6px',
        background: 'white',
        cursor: 'pointer'
      }}
    >
      <option value="">Unassigned</option>

      {allDevs.map((dev) => (
        <option key={dev.id} value={dev.id}>
          {dev.full_name}
        </option>
      ))}
    </select>

    <div style={{ marginTop: '10px' }}>
  <label style={{ 
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '5px',
    color: '#555'
  }}>
    Depends On
  </label>

  <select
    defaultValue=""
    onChange={(e) =>
      handleAddDependency(task.id, e.target.value)
    }
    style={{
      width: '100%',
      padding: '8px',
      border: '1px solid #ccc',
      borderRadius: '6px',
      background: 'white',
      cursor: 'pointer'
    }}
  >
    <option value="">No dependency</option>

    {tasks
      .filter(otherTask => otherTask.id !== task.id)
      .map(otherTask => (
        <option key={otherTask.id} value={otherTask.id}>
          {otherTask.title}
        </option>
      ))}
  </select>
</div>
  </div>
)}   
 
                  {/* Status changer */}
                  <select
  value={task.status}
  onChange={e => handleStatusChange(task.id, e.target.value)}
  style={styles.statusSelect}
>
  <option value="todo">To Do</option>
  <option value="in_progress">In Progress</option>
  <option value="in_review">In Review</option>
  <option value="done">Done</option>
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
  // Lines an icon up with its label inside buttons, headings and tags.
  inline: { display: 'inline-flex', alignItems: 'center', gap: '7px' },
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
  reportBtn: {
  background: '#8E44AD',
  color: 'white',
  border: 'none',
  padding: '10px 16px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: '600',
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
  editBtn: {
  background: '#eef4ff',
  color: '#2E5FA3',
  border: '1px solid #d6e4ff',
  padding: '6px 12px',
  borderRadius: '7px',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '12px',
  transition: 'all 0.2s ease',
  marginRight: '6px'
},
  deleteTaskBtn: {
    background: 'none', border: 'none', color: '#c0392b',
    cursor: 'pointer', padding: '4px', display: 'inline-flex',
    alignItems: 'center', opacity: 0.65,
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
  padding: '6px 10px',
  border: '1px solid #d9dee7',
  borderRadius: '6px',
  background: 'white',
  color: '#333',
  fontSize: '12px',
  fontWeight: '600',
  cursor: 'pointer',
  outline: 'none'
},
};