 import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getProjects, createProject } from '../../utils/api';
import MainLayout from '../../components/layout/MainLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Icon from '../../components/common/Icon';

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
  });

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await getProjects();
      setProjects(response.data);
    } catch (err) {
      console.error('Error loading projects:', err);
      setError(
        err.response?.data?.error ||
        'Unable to load projects.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();

    try {
      setCreating(true);
      setError('');

      await createProject(form);

      setForm({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
      });

      setShowForm(false);
      await loadProjects();
    } catch (err) {
      console.error('Create project error:', err);
      setError(
        err.response?.data?.error ||
        'Unable to create project.'
      );
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <LoadingSpinner />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Project Dashboard</h1>

            <p style={styles.subtitle}>
              Welcome back, {user?.full_name || 'User'}
            </p>

            <p style={styles.description}>
              Manage your projects, tasks, team members and
              optimized schedules from one place.
            </p>
          </div>

          {user?.role === 'manager' && (
            <button
              style={{ ...styles.createButton, ...styles.btnInner }}
              onClick={() => setShowForm(!showForm)}
            >
              <Icon name={showForm ? 'x' : 'plus'} size={15} />
              {showForm ? 'Cancel' : 'New Project'}
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {/* Create Project Form */}
        {showForm && user?.role === 'manager' && (
          <div style={styles.formCard}>
            <h2 style={styles.formTitle}>
              Create New Project
            </h2>

            <form onSubmit={handleCreateProject}>

              <div style={styles.formGrid}>

                <div>
                  <label style={styles.label}>
                    Project Title
                  </label>

                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        title: e.target.value
                      })
                    }
                    placeholder="Enter project title"
                    style={styles.input}
                  />
                </div>

                <div>
                  <label style={styles.label}>
                    Description
                  </label>

                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description: e.target.value
                      })
                    }
                    placeholder="Project description"
                    style={styles.input}
                  />
                </div>

                <div>
                  <label style={styles.label}>
                    Start Date
                  </label>

                  <input
                    type="date"
                    required
                    value={form.start_date}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        start_date: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

                <div>
                  <label style={styles.label}>
                    End Date
                  </label>

                  <input
                    type="date"
                    required
                    value={form.end_date}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        end_date: e.target.value
                      })
                    }
                    style={styles.input}
                  />
                </div>

              </div>

              <button
                type="submit"
                disabled={creating}
                style={{ ...styles.saveButton, ...styles.btnInner }}
              >
                {!creating && <Icon name="check" size={15} />}
                {creating ? 'Creating...' : 'Create Project'}
              </button>

            </form>
          </div>
        )}

        {/* Statistics */}
        <div style={styles.statsGrid}>

          <div style={styles.statCard}>
            <div style={styles.statIcon}><Icon name="folder" size={24} /></div>
            <div>
              <p style={styles.statLabel}>Total Projects</p>
              <h2 style={styles.statNumber}>
                {projects.length}
              </h2>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}><Icon name="clipboard" size={24} /></div>
            <div>
              <p style={styles.statLabel}>Total Tasks</p>
              <h2 style={styles.statNumber}>
                {projects.reduce(
                  (total, project) =>
                    total + Number(project.total_tasks || 0),
                  0
                )}
              </h2>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}><Icon name="checkCircle" size={24} /></div>
            <div>
              <p style={styles.statLabel}>Completed Tasks</p>
              <h2 style={styles.statNumber}>
                {projects.reduce(
                  (total, project) =>
                    total + Number(project.completed_tasks || 0),
                  0
                )}
              </h2>
            </div>
          </div>

        </div>

        {/* Projects */}
        <div style={styles.projectsSection}>

          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>
                Your Projects
              </h2>

              <p style={styles.sectionSubtitle}>
                Select a project to manage tasks and scheduling.
              </p>
            </div>

            <span style={styles.projectCount}>
              {projects.length} project
              {projects.length !== 1 ? 's' : ''}
            </span>
          </div>

          {projects.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}><Icon name="folder" size={44} strokeWidth={1.4} /></div>

              <h3>No projects yet</h3>

              <p>
                Create your first project to get started.
              </p>
            </div>
          ) : (
            <div style={styles.projectGrid}>

              {projects.map((project) => {

                const totalTasks =
                  Number(project.total_tasks || 0);

                const completedTasks =
                  Number(project.completed_tasks || 0);

                const progress =
                  totalTasks > 0
                    ? Math.round(
                        (completedTasks / totalTasks) * 100
                      )
                    : 0;

                return (
                  <div
                    key={project.id}
                    style={styles.projectCard}
                    onClick={() =>
                      navigate(`/projects/${project.id}`)
                    }
                  >

                    <div style={styles.cardTop}>
                      <div style={styles.folderIcon}>
                        <Icon name="folder" size={22} />
                      </div>

                      <span style={styles.status}>
                        Active
                      </span>
                    </div>

                    <h3 style={styles.projectTitle}>
                      {project.title}
                    </h3>

                    <p style={styles.projectDescription}>
                      {project.description ||
                        'No project description available.'}
                    </p>

                    <div style={styles.dateRow}>
                      <span className="icon-text">
                        <Icon name="calendar" size={13} />
                        {new Date(project.start_date).toLocaleDateString()}
                      </span>

                      <Icon name="arrowRight" size={13} />

                      <span className="icon-text">
                        <Icon name="flag" size={13} />
                        {new Date(project.end_date).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={styles.progressHeader}>
                      <span>Progress</span>
                      <strong>{progress}%</strong>
                    </div>

                    <div style={styles.progressBackground}>
                      <div
                        style={{
                          ...styles.progressFill,
                          width: `${progress}%`,
                        }}
                      />
                    </div>

                    <div style={styles.taskInfo}>
                      <span className="icon-text">
                        <Icon name="clipboard" size={13} />
                        {totalTasks} Tasks
                      </span>

                      <span className="icon-text">
                        <Icon name="checkCircle" size={13} />
                        {completedTasks} Completed
                      </span>
                    </div>

                    <button
                      style={{ ...styles.viewButton, ...styles.btnInner, justifyContent: 'center' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/projects/${project.id}`);
                      }}
                    >
                      Open Project <Icon name="arrowRight" size={15} />
                    </button>

                  </div>
                );
              })}

            </div>
          )}

        </div>

      </div>
    </MainLayout>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    marginBottom: '24px',
    gap: '20px',
  },

  title: {
    margin: 0,
    color: '#1a1a2e',
    fontSize: '28px',
    fontWeight: '700',
  },

  subtitle: {
    margin: '8px 0 4px',
    color: '#555',
    fontSize: '16px',
  },

  description: {
    margin: 0,
    color: '#888',
    fontSize: '14px',
  },

  createButton: {
    background: '#2E5FA3',
    color: 'white',
    border: 'none',
    padding: '11px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  },

  error: {
    background: '#fdecea',
    color: '#c0392b',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '28px',
  },

  statCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
  },

  statIcon: {
    color: '#2E5FA3',
    background: '#f0f4ff',
    padding: '12px',
    borderRadius: '10px',
    display: 'flex',
  },
  btnInner: { display: 'inline-flex', alignItems: 'center', gap: '8px' },

  statLabel: {
    margin: 0,
    color: '#888',
    fontSize: '12px',
  },

  statNumber: {
    margin: '4px 0 0',
    color: '#2E5FA3',
    fontSize: '25px',
  },

  projectsSection: {
    background: 'transparent',
  },

  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },

  sectionTitle: {
    margin: 0,
    color: '#1a1a2e',
    fontSize: '20px',
  },

  sectionSubtitle: {
    margin: '5px 0 0',
    color: '#888',
    fontSize: '13px',
  },

  projectCount: {
    background: '#e8f0fe',
    color: '#2E5FA3',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },

  projectGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
  },

  projectCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },

  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },

  folderIcon: {
    color: '#2E5FA3',
    display: 'flex',
  },

  status: {
    background: '#d4edda',
    color: '#155724',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '600',
  },

  projectTitle: {
    margin: '0 0 8px',
    color: '#1a1a2e',
    fontSize: '18px',
  },

  projectDescription: {
    color: '#777',
    fontSize: '13px',
    lineHeight: '1.5',
    minHeight: '40px',
  },

  dateRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    color: '#777',
    fontSize: '11.5px',
    margin: '15px 0',
  },

  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#777',
    marginBottom: '6px',
  },

  progressBackground: {
    height: '8px',
    background: '#e5e9f2',
    borderRadius: '10px',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    background: '#2E5FA3',
    borderRadius: '10px',
  },

  taskInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '12px',
    color: '#777',
    fontSize: '11px',
  },

  viewButton: {
    width: '100%',
    marginTop: '16px',
    padding: '9px',
    background: '#f0f4ff',
    color: '#2E5FA3',
    border: 'none',
    borderRadius: '7px',
    cursor: 'pointer',
    fontWeight: '600',
  },

  empty: {
    background: 'white',
    borderRadius: '12px',
    padding: '60px 20px',
    textAlign: 'center',
    color: '#777',
  },

  emptyIcon: {
    color: '#c3cddd',
    marginBottom: '14px',
    display: 'flex',
    justifyContent: 'center',
  },

  formCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
  },

  formTitle: {
    marginTop: 0,
    color: '#1a1a2e',
    fontSize: '18px',
  },

  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '18px',
  },

  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '6px',
    color: '#444',
  },

  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '7px',
    fontSize: '14px',
  },

  saveButton: {
    background: '#2E5FA3',
    color: 'white',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '7px',
    cursor: 'pointer',
    fontWeight: '600',
  },
};