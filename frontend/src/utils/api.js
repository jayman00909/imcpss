 import axios from 'axios';
import { store } from '../store/index';
import { logout } from '../store/authSlice';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

// Automatically attach the JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('imcpss_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Automatically handle expired/invalid tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token is expired or invalid — log the user out automatically
      store.dispatch(logout());
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);

// Projects
export const getProjects = () => api.get('/projects');
export const createProject = (data) => api.post('/projects', data);
export const getProject = (id) => api.get(`/projects/${id}`);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);
export const getProjectMembers = (id) => api.get(`/projects/${id}/members`);
export const addProjectMember = (id, data) => api.post(`/projects/${id}/members`, data);

// Tasks
export const getProjectTasks = (projectId) => api.get(`/tasks/project/${projectId}`);
export const createTask = (data) => api.post('/tasks', data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data);
export const updateTaskStatus = (id, status) => api.patch(`/tasks/${id}/status`, { status });
export const deleteTask = (id) => api.delete(`/tasks/${id}`);
export const addTaskDependency = (id, depends_on_id) =>
  api.post(`/tasks/${id}/dependencies`, { depends_on_id });

// Schedule
export const generateSchedule = (projectId, weights) =>
  api.post(`/schedule/generate/${projectId}`, { weights });

// Developers
export const getMyProfile = () => api.get('/developers/profile');
export const updateMyProfile = (data) => api.put('/developers/profile', data);
export const getAllDevelopers = () => api.get('/developers');
export const getDeveloperManagement = () => api.get('/developers/management');
// Admin
export const getAdminStats = () => api.get('/admin/stats');
export const getAdminUsers = () => api.get('/admin/users');
export const getAdminProjects = () => api.get('/admin/projects');
export const updateUserRole = (id, role) => api.patch(`/admin/users/${id}/role`, { role });
export const adminDeleteUser = (id) => api.delete(`/admin/users/${id}`);
export const adminDeleteProject = (id) => api.delete(`/admin/projects/${id}`);
export default api;