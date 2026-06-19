import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../../utils/api';
import { loginSuccess } from '../../store/authSlice';

export default function Register() {
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', role: 'developer'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await registerUser(form);
      dispatch(loginSuccess(res.data));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>🗂 IMCPSS</h1>
          <p style={styles.subtitle}>Create your account</p>
        </div>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text" name="full_name"
              value={form.full_name} onChange={handleChange}
              style={styles.input} placeholder="e.g. Samuel Damilare Amos"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email" name="email"
              value={form.email} onChange={handleChange}
              style={styles.input} placeholder="your@email.com"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password" name="password"
              value={form.password} onChange={handleChange}
              style={styles.input} placeholder="Minimum 6 characters"
              required minLength={6}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>I am a...</label>
            <select
              name="role" value={form.role}
              onChange={handleChange} style={styles.input}
            >
              <option value="developer">Developer</option>
              <option value="manager">Project Manager</option>
            </select>
          </div>
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p style={styles.switchText}>
          Already have an account?{' '}
          <Link to="/login" style={styles.switchLink}>Sign in here</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', background: 'linear-gradient(135deg, #1A3A6B 0%, #2E5FA3 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
  },
  card: {
    background: 'white', borderRadius: '16px', padding: '40px',
    width: '100%', maxWidth: '420px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  header: { textAlign: 'center', marginBottom: '24px' },
  title: { fontSize: '28px', color: '#2E5FA3', fontWeight: '800', marginBottom: '4px' },
  subtitle: { color: '#6c757d', fontSize: '13px' },
  error: {
    background: '#fdecea', color: '#c0392b', padding: '10px 14px',
    borderRadius: '8px', marginBottom: '16px', fontSize: '14px',
  },
  field: { marginBottom: '14px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#444', marginBottom: '6px' },
  input: {
    width: '100%', padding: '10px 14px', border: '1.5px solid #dee2e6',
    borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  },
  btn: {
    width: '100%', padding: '12px', background: '#2E5FA3', color: 'white',
    border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600',
    cursor: 'pointer', marginTop: '8px',
  },
  switchText: { textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#6c757d' },
  switchLink: { color: '#2E5FA3', fontWeight: '600', textDecoration: 'none' },
};