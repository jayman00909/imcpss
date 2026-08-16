 import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Landing from './pages/Landing';
import AdminDashboard from './pages/Admin/AdminDashboard';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Projects/Dashboard';
import ProjectDetail from './pages/Projects/ProjectDetail';
import SchedulePage from './pages/Schedule/SchedulePage';
import DeveloperProfile from './pages/Developer/DeveloperProfile';
import DeveloperManagement from './pages/Developer/DeveloperManagement';
import AlgorithmComparison from './pages/Schedule/AlgorithmComparison';
import ReportsPage from './pages/Reports/ReportsPage';
import './styles/global.css';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useSelector((s) => s.auth);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useSelector((s) => s.auth);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

// Route-level role gate. The backend enforces this too — this only keeps
// users from landing on a page they cannot use.
function RoleRoute({ roles, children }) {
  const { isAuthenticated, user } = useSelector((s) => s.auth);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><DeveloperProfile /></ProtectedRoute>} />

        <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
        <Route path="/projects/:id/schedule" element={<ProtectedRoute><SchedulePage /></ProtectedRoute>} />
        <Route path="/projects/:id/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/projects/:id/compare" element={<ProtectedRoute><AlgorithmComparison /></ProtectedRoute>} />

        <Route
          path="/admin"
          element={<RoleRoute roles={['admin']}><AdminDashboard /></RoleRoute>}
        />
        <Route
          path="/developers"
          element={<RoleRoute roles={['manager', 'admin']}><DeveloperManagement /></RoleRoute>}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}