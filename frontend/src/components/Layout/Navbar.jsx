 import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { logout } from '../../store/authSlice';

export default function Navbar() {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showToken, setShowToken] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Decode JWT expiry time
  const getTokenInfo = () => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresAt = new Date(payload.exp * 1000);
      const now = new Date();
      const hoursLeft = Math.round((expiresAt - now) / (1000 * 60 * 60));
      return { expiresAt, hoursLeft, valid: expiresAt > now };
    } catch {
      return null;
    }
  };

  const tokenInfo = getTokenInfo();

  return (
    <>
      <nav style={styles.nav}>
        <div style={styles.left}>
          <Link to="/dashboard" style={styles.logo}>
            🗂 IMCPSS
          </Link>
        </div>

        <div style={styles.right}>
          {user && (
            <>
              {/* JWT Status Badge */}
              <button
  onClick={() => setShowToken(!showToken)}
  style={{
    ...styles.jwtBadge,
    background: tokenInfo?.valid ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.15)',
    border: `1px solid ${tokenInfo?.valid ? '#27AE60' : '#E74C3C'}`,
  }}
  title="Authentication status — click for details"
>
  <span style={{ fontSize: '10px' }}>
    {tokenInfo?.valid ? '🔐' : '⚠️'}
  </span>
  <span style={{
    fontSize: '10px', fontWeight: '600',
    color: tokenInfo?.valid ? '#a8f0c6' : '#f5b7b1',
    letterSpacing: '0.5px',
  }}>
    SECURED
  </span>
</button>

              <span style={styles.welcome}>
                👋 {user.full_name}
                <span style={styles.rolePill}>
                  {user.role === 'manager' ? '🎯 Manager' : '💻 Developer'}
                </span>
              </span>

              {user.role === 'developer' && (
                <Link to="/profile" style={styles.link}>My Skills</Link>
              )}

              {(user.role === 'manager' || user.role === 'admin') && (
                <Link to="/developers" style={styles.link}>👥 Developers</Link>
              )}

              {user.role === 'admin' && (
                <Link to="/admin" style={{
                  ...styles.link,
                  background: 'rgba(192,57,43,0.3)',
                  border: '1px solid rgba(231,76,60,0.5)',
                }}>⚙️ Admin Panel</Link>
              )}

              <button onClick={handleLogout} style={styles.logoutBtn}>
                Logout
              </button>
            </>
          )}
        </div>
      </nav>
      {/* JWT Info Dropdown Panel */}
      {showToken && tokenInfo && (
        <div style={styles.tokenPanel}>
          <div style={styles.tokenPanelInner}>
            <div style={styles.tokenHeader}>
              <h3 style={styles.tokenTitle}>🔐 JWT Authentication Details</h3>
              <button onClick={() => setShowToken(false)} style={styles.closeBtn}>✕</button>
            </div>

            <div style={styles.tokenGrid}>
              <div style={styles.tokenItem}>
                <span style={styles.tokenLabel}>Status</span>
                <span style={{
                  ...styles.tokenValue,
                  color: tokenInfo.valid ? '#27AE60' : '#E74C3C',
                  fontWeight: '700',
                }}>
                  {tokenInfo.valid ? '✅ Valid & Active' : '❌ Expired'}
                </span>
              </div>
              <div style={styles.tokenItem}>
                <span style={styles.tokenLabel}>User</span>
                <span style={styles.tokenValue}>{user.full_name}</span>
              </div>
              <div style={styles.tokenItem}>
                <span style={styles.tokenLabel}>Role</span>
                <span style={styles.tokenValue}>{user.role}</span>
              </div>
              <div style={styles.tokenItem}>
                <span style={styles.tokenLabel}>Expires</span>
                <span style={styles.tokenValue}>
                  {tokenInfo.expiresAt.toLocaleDateString()} at {tokenInfo.expiresAt.toLocaleTimeString()}
                </span>
              </div>
              <div style={styles.tokenItem}>
                <span style={styles.tokenLabel}>Time Left</span>
                <span style={{ ...styles.tokenValue, color: '#2E5FA3', fontWeight: '700' }}>
                  {tokenInfo.hoursLeft > 0 ? `${tokenInfo.hoursLeft} hours remaining` : 'Expired'}
                </span>
              </div>
            </div>

            <div style={styles.tokenPreview}>
              <p style={styles.tokenLabel}>Token Preview (first 60 characters)</p>
              <code style={styles.tokenCode}>
                {token.slice(0, 60)}...
              </code>
            </div>

            <div style={styles.tokenExplain}>
              <p style={styles.explainTitle}>How JWT protects your app</p>
              <p style={styles.explainText}>
                Every request your browser makes to the backend automatically includes this token
                in the request header as: <code>Authorization: Bearer eyJ...</code>.
                The backend verifies it on every single API call. If it's missing, wrong,
                or expired — the server returns 401 Unauthorized and you are automatically
                logged out. No token = no data.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  nav: {
    background: '#2E5FA3',
    padding: '0 24px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  left: { display: 'flex', alignItems: 'center' },
  logo: {
    color: 'white', fontSize: '20px', fontWeight: '700',
    textDecoration: 'none', letterSpacing: '1px',
  },
  right: { display: 'flex', alignItems: 'center', gap: '12px' },
  jwtBadge: {
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '4px 10px', borderRadius: '20px', cursor: 'pointer',
    background: 'transparent',
  },
  welcome: {
    color: '#cce0ff', fontSize: '13px',
    display: 'flex', alignItems: 'center', gap: '8px',
  },
  rolePill: {
    background: 'rgba(255,255,255,0.15)', color: 'white',
    padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
  },
  link: {
    color: 'white', textDecoration: 'none', fontSize: '13px',
    padding: '6px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.15)',
  },
  logoutBtn: {
    background: 'rgba(255,255,255,0.15)', color: 'white',
    border: '1px solid rgba(255,255,255,0.3)', padding: '6px 14px',
    borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
  },

  // Token panel
  tokenPanel: {
    position: 'fixed', top: '60px', right: '0', left: '0',
    zIndex: 99, display: 'flex', justifyContent: 'flex-end',
    padding: '0 24px',
  },
  tokenPanelInner: {
    background: 'white', borderRadius: '0 0 12px 12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    padding: '20px', width: '480px',
    border: '1px solid #e0e8ff', borderTop: 'none',
  },
  tokenHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '16px',
  },
  tokenTitle: { fontSize: '15px', fontWeight: '700', color: '#1a1a2e' },
  closeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#aaa', fontSize: '16px',
  },
  tokenGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: '12px', marginBottom: '16px',
  },
  tokenItem: {
    background: '#f8faff', borderRadius: '8px', padding: '10px 12px',
  },
  tokenLabel: {
    display: 'block', fontSize: '11px', color: '#888',
    fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase',
  },
  tokenValue: { fontSize: '13px', color: '#333' },
  tokenPreview: {
    background: '#f8faff', borderRadius: '8px',
    padding: '12px', marginBottom: '14px',
  },
  tokenCode: {
    display: 'block', marginTop: '6px', fontSize: '11px',
    color: '#2E5FA3', wordBreak: 'break-all',
    fontFamily: 'monospace', lineHeight: '1.5',
  },
  tokenExplain: {
    background: '#f0f4ff', borderRadius: '8px', padding: '12px',
    border: '1px solid #dce8ff',
  },
  explainTitle: { fontSize: '12px', fontWeight: '700', color: '#2E5FA3', marginBottom: '6px' },
  explainText: { fontSize: '12px', color: '#555', lineHeight: '1.6' },
};