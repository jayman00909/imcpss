import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../../utils/api';
import AuthLayout from '../../components/layout/AuthLayout';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      if (err.response) {
        setError(err.response.data?.error || 'Could not send the reset link.');
      } else {
        setError('Unable to reach the server. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle={
        sent
          ? undefined
          : 'Enter your email and we will send you a link to choose a new password.'
      }
      footer="MCO — Multi-Criteria Optimization Project Scheduling System"
    >
      {sent ? (
        <>
          <div className="auth-message is-success" style={{ marginTop: 20 }}>
            If that email is registered, a reset link is on its way. The link
            expires in 1 hour and can only be used once.
          </div>
          <p className="auth-switch">
            Remembered it?
            <Link to="/login">Back to sign in</Link>
          </p>
        </>
      ) : (
        <>
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

            {error && (
              <div className="auth-message is-error" role="alert">{error}</div>
            )}

            <button className="auth-submit" type="submit" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send reset link'}
            </button>
          </form>

          <p className="auth-switch">
            Remembered it?
            <Link to="/login">Back to sign in</Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
