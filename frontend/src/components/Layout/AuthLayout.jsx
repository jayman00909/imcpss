import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Shared shell for the Sign In and Create Account pages, so both stay
 * visually consistent. Layout classes live in global.css because the
 * responsive breakpoints cannot be expressed with inline styles.
 */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-brand">
          <span className="auth-brand-mark">🗂</span>
          <span className="auth-brand-name">MCO</span>
        </Link>

        <p className="auth-brand-tagline">Multi-Criteria Optimization Scheduling</p>

        <h1 className="auth-title">{title}</h1>
        {subtitle && <p className="auth-subtitle">{subtitle}</p>}

        {children}
      </div>

      {footer && <div className="auth-footer">{footer}</div>}
    </div>
  );
}
