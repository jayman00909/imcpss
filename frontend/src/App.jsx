 import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AdminDashboard from './pages/Admin/AdminDashboard';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Projects/Dashboard';
import ProjectDetail from './pages/Projects/ProjectDetail';
import SchedulePage from './pages/Schedule/SchedulePage';
import DeveloperProfile from './pages/Developer/DeveloperProfile';
import AlgorithmComparison from './pages/Schedule/AlgorithmComparison';
import './styles/global.css';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useSelector((s) => s.auth);
  return isAuthenticated ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
        <Route path="/projects/:id/schedule" element={<ProtectedRoute><SchedulePage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><DeveloperProfile /></ProtectedRoute>} />
        <Route path="/projects/:id/compare" element={<ProtectedRoute><AlgorithmComparison /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}