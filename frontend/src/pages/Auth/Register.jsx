import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../store/authSlice';
import { registerUser } from '../../utils/api';
import AuthLayout from '../../components/layout/AuthLayout';

// Must match the roles the database CHECK constraint accepts.
const ROLES = [
  {
    value: 'manager',
    icon: '🎯',
    name: 'Manager',
    description: 'Create projects, add tasks and generate schedules.',
  },
  {
    value: 'developer',
    icon: '💻',
    name: 'Developer',
    description: 'Track assigned work and maintain your skill profile.',
  },
];

const MIN_PASSWORD_LENGTH = 8;

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    role: 'developer',
    manager_code: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      const { data } = await registerUser({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        // Only meaningful for manager signups; ignored otherwise.
        ...(form.role === 'manager' ? { manager_code: form.manager_code.trim() } : {}),
      });

      // The auth slice persists token + user to localStorage.
      dispatch(login({ user: data.user, token: data.token }));

      navigate('/dashboard');
    } catch (err) {
      if (err.response) {
        setError(err.response.data?.error || 'Registration failed.');
      } else {
        setError('Unable to reach the server. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Set up an account to start scheduling with MCO."
      footer="MCO — Multi-Criteria Optimization Project Scheduling System"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field">
          <label className="auth-label" htmlFor="full_name">Full Name</label>
          <input
            id="full_name"
            className="auth-input"
            type="text"
            autoComplete="name"
            placeholder="e.g. Ada Lovelace"
            value={form.full_name}
            onChange={update('full_name')}
            required
          />
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="email">Email</label>
          <input
            id="email"
            className="auth-input"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={update('email')}
            required
          />
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="password">Password</label>
          <input
            id="password"
            className="auth-input"
            type="password"
            autoComplete="new-password"
            placeholder="Create a password"
            value={form.password}
            onChange={update('password')}
            required
          />
          <span className="auth-hint">
            At least {MIN_PASSWORD_LENGTH} characters.
          </span>
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="confirm_password">
            Confirm Password
          </label>
          <input
            id="confirm_password"
            className="auth-input"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={form.confirm_password}
            onChange={update('confirm_password')}
            required
          />
        </div>

        <div className="auth-field">
          <label className="auth-label">Select your role</label>
          <div className="auth-roles">
            {ROLES.map((role) => (
              <button
                key={role.value}
                type="button"
                className="auth-role"
                aria-pressed={form.role === role.value}
                onClick={() => setForm((prev) => ({ ...prev, role: role.value }))}
              >
                <span className="auth-role-icon">{role.icon}</span>
                <span className="auth-role-name">{role.name}</span>
                <span className="auth-role-desc">{role.description}</span>
              </button>
            ))}
          </div>
        </div>

        {form.role === 'manager' && (
          <div className="auth-field">
            <label className="auth-label" htmlFor="manager_code">
              Manager invite code
            </label>
            <input
              id="manager_code"
              className="auth-input"
              type="text"
              placeholder="Provided by your administrator"
              value={form.manager_code}
              onChange={update('manager_code')}
            />
            <span className="auth-hint">
              Manager accounts can create projects and manage teams, so they
              require an invite code. Leave blank if your administrator has
              not set one.
            </span>
          </div>
        )}

        {error && (
          <div className="auth-message is-error" role="alert">
            {error}
          </div>
        )}

        <button className="auth-submit" type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account?
        <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
