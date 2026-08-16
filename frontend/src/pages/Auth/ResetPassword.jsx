import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../../utils/api';
import AuthLayout from '../../components/layout/AuthLayout';

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const token = params.get('token') || '';
  const email = params.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      if (err.response) {
        setError(err.response.data?.error || 'Could not reset your password.');
      } else {
        setError('Unable to reach the server. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout
        title="Invalid reset link"
        footer="MCO — Multi-Criteria Optimization Project Scheduling System"
      >
        <div className="auth-message is-error" style={{ marginTop: 20 }}>
          This link is missing its reset token. Please request a new one.
        </div>
        <p className="auth-switch">
          <Link to="/forgot-password">Request a new link</Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle={email ? `Resetting the password for ${email}.` : undefined}
      footer="MCO — Multi-Criteria Optimization Project Scheduling System"
    >
      {done ? (
        <>
          <div className="auth-message is-success" style={{ marginTop: 20 }}>
            Your password has been reset. Taking you to sign in…
          </div>
          <p className="auth-switch">
            <Link to="/login">Sign in now</Link>
          </p>
        </>
      ) : (
        <>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-label" htmlFor="password">New password</label>
              <input
                id="password"
                className="auth-input"
                type="password"
                autoComplete="new-password"
                placeholder="Enter a new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className="auth-hint">
                At least {MIN_PASSWORD_LENGTH} characters.
              </span>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="confirm">Confirm new password</label>
              <input
                id="confirm"
                className="auth-input"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter the new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="auth-message is-error" role="alert">{error}</div>
            )}

            <button className="auth-submit" type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Reset password'}
            </button>
          </form>

          <p className="auth-switch">
            Changed your mind?
            <Link to="/login">Back to sign in</Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
