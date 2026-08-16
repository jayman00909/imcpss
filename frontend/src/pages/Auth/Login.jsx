import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../store/authSlice';
import { loginUser } from '../../utils/api';
import AuthLayout from '../../components/layout/AuthLayout';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const { data } = await loginUser({ email: email.trim(), password });

      // The auth slice persists token + user to localStorage.
      dispatch(login({ user: data.user, token: data.token }));

      navigate('/dashboard');
    } catch (err) {
      if (err.response) {
        setError(err.response.data?.error || 'Sign in failed.');
      } else {
        setError('Unable to reach the server. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to manage your projects and schedules."
      footer="MCO — Multi-Criteria Optimization Project Scheduling System"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label className="auth-label" htmlFor="email">Email</label>
          <input
            id="email"
            className="auth-input"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="password">Password</label>
          <input
            id="password"
            className="auth-input"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <div className="auth-message is-error" role="alert">
            {error}
          </div>
        )}

        <button className="auth-submit" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p className="auth-switch">
        Don&apos;t have an account?
        <Link to="/register">Create account</Link>
      </p>
    </AuthLayout>
  );
}
