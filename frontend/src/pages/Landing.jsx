import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/common/Icon';

const CRITERIA = [
  { icon: 'clock', name: 'Deadline Urgency', weight: '30%', desc: 'How close a task is to its due date.' },
  { icon: 'target', name: 'Skill Match', weight: '25%', desc: 'Cosine-similarity match between task needs and developer skills.' },
  { icon: 'link', name: 'Dependency Readiness', weight: '20%', desc: 'Whether prerequisite tasks are already done.' },
  { icon: 'award', name: 'Business Value', weight: '15%', desc: 'How important the task is to the project goals.' },
  { icon: 'zap', name: 'Effort Efficiency', weight: '10%', desc: 'Value delivered relative to effort required.' },
];

const FEATURES = [
  { icon: 'cpu', title: 'MCO Priority Engine', desc: 'Every task is automatically scored with a Weighted Sum Model across five criteria — no more guessing what to work on first.' },
  { icon: 'users', title: 'Smart Developer Matching', desc: 'Tasks are matched to the best-fit developer using cosine similarity between required and available skills.' },
  { icon: 'link', title: 'Dependency-Aware Scheduling', desc: 'Tasks whose prerequisites aren’t finished are automatically held back, so schedules stay realistic.' },
  { icon: 'clipboard', title: 'Kanban Board', desc: 'Track tasks through To Do, In Progress, In Review, and Done with live priority scores on every card.' },
  { icon: 'barChart', title: 'Gantt & Schedule Views', desc: 'Visualize the generated project timeline and compare scheduling approaches side by side.' },
  { icon: 'lock', title: 'Role-Based Access', desc: 'JWT authentication with manager, developer, and admin roles keep the right people in the right views.' },
];

export default function Landing() {
  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <div style={styles.logo}><Icon name="logo" size={22} strokeWidth={1.9} />MCO</div>
        <div style={styles.navLinks}>
          <Link to="/login" style={styles.navLink}>Sign In</Link>
          <Link to="/register" style={styles.navCta}>Get Started</Link>
        </div>
      </nav>

      <header style={styles.hero}>
        <span style={styles.badge}>Multi-Criteria Optimization for Software Teams</span>
        <h1 style={styles.heroTitle}>Stop guessing what your team should work on next.</h1>
        <p style={styles.heroSub}>
          MCO scores every task against deadline urgency, skill match, dependencies, business value,
          and effort — then recommends the order to work in and who should do it.
        </p>
        <div style={styles.heroCtas}>
          <Link to="/register" style={{ ...styles.primaryBtn, ...styles.btnInner }}>
            Create Free Account <Icon name="arrowRight" size={16} />
          </Link>
          <Link to="/login" style={styles.secondaryBtn}>Sign In</Link>
        </div>
      </header>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>How the priority score is built</h2>
        <p style={styles.sectionSub}>
          Priority = 0.30(Deadline) + 0.25(Skill Match) + 0.20(Dependency) + 0.15(Business Value) + 0.10(Effort)
        </p>
        <div style={styles.criteriaGrid}>
          {CRITERIA.map((c) => (
            <div key={c.name} style={styles.criteriaCard}>
              <div style={styles.criteriaIcon}><Icon name={c.icon} size={26} strokeWidth={1.6} /></div>
              <div style={styles.criteriaWeight}>{c.weight}</div>
              <div style={styles.criteriaName}>{c.name}</div>
              <p style={styles.criteriaDesc}>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ ...styles.section, background: '#f8faff' }}>
        <h2 style={styles.sectionTitle}>Everything a project manager needs</h2>
        <div style={styles.featureGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} style={styles.featureCard}>
              <div style={styles.featureIcon}><Icon name={f.icon} size={24} strokeWidth={1.6} /></div>
              <h3 style={styles.featureTitle}>{f.title}</h3>
              <p style={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.ctaSection}>
        <h2 style={styles.ctaTitle}>Ready to schedule smarter?</h2>
        <p style={styles.ctaSub}>Set up your first project in minutes.</p>
        <Link to="/register" style={{ ...styles.primaryBtnLight, ...styles.btnInner }}>
          Create Free Account <Icon name="arrowRight" size={16} />
        </Link>
      </section>

      <footer style={styles.footer}>
        <p style={styles.footerInner}>
          <Icon name="logo" size={15} />
          MCO — Multi-Criteria Optimization Project Scheduling System
        </p>
      </footer>
    </div>
  );
}

const styles = {
  page: { fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: '#1a1a2e' },
  nav: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 40px', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    position: 'sticky', top: 0, zIndex: 10,
  },
  logo: {
    fontSize: '20px', fontWeight: '800', color: '#2E5FA3',
    display: 'inline-flex', alignItems: 'center', gap: '8px', letterSpacing: '1px',
  },
  navLinks: { display: 'flex', alignItems: 'center', gap: '20px' },
  navLink: { color: '#1a1a2e', textDecoration: 'none', fontWeight: '600', fontSize: '14px' },
  navCta: {
    background: '#2E5FA3', color: 'white', padding: '10px 20px',
    borderRadius: '8px', textDecoration: 'none', fontWeight: '700', fontSize: '14px',
  },
  hero: {
    textAlign: 'center', padding: '90px 20px 70px',
    background: 'linear-gradient(135deg, #1A3A6B 0%, #2E5FA3 100%)', color: 'white',
  },
  badge: {
    display: 'inline-block', background: 'rgba(255,255,255,0.15)', padding: '6px 16px',
    borderRadius: '20px', fontSize: '13px', fontWeight: '600', marginBottom: '20px',
  },
  heroTitle: { fontSize: '40px', fontWeight: '800', maxWidth: '760px', margin: '0 auto 18px', lineHeight: '1.25' },
  heroSub: { fontSize: '16px', maxWidth: '620px', margin: '0 auto 32px', opacity: 0.9, lineHeight: '1.6' },
  heroCtas: { display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' },
  btnInner: { display: 'inline-flex', alignItems: 'center', gap: '8px' },
  primaryBtn: {
    background: 'white', color: '#2E5FA3', padding: '14px 28px', borderRadius: '10px',
    textDecoration: 'none', fontWeight: '700', fontSize: '15px',
  },
  secondaryBtn: {
    background: 'transparent', color: 'white', padding: '14px 28px', borderRadius: '10px',
    textDecoration: 'none', fontWeight: '700', fontSize: '15px', border: '2px solid rgba(255,255,255,0.6)',
  },
  section: { padding: '70px 20px', maxWidth: '1100px', margin: '0 auto' },
  sectionTitle: { fontSize: '28px', fontWeight: '800', textAlign: 'center', marginBottom: '10px' },
  sectionSub: {
    textAlign: 'center', color: '#6c757d', fontSize: '14px', marginBottom: '40px',
    fontFamily: 'ui-monospace, Consolas, monospace',
  },
  criteriaGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '18px' },
  criteriaCard: {
    background: 'white', borderRadius: '14px', padding: '24px 18px', textAlign: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid #eef1f6',
  },
  criteriaIcon: {
    marginBottom: '10px', color: '#2E5FA3',
    display: 'flex', justifyContent: 'center',
  },
  criteriaWeight: { fontSize: '22px', fontWeight: '800', color: '#2E5FA3', marginBottom: '4px' },
  criteriaName: { fontSize: '14px', fontWeight: '700', marginBottom: '8px' },
  criteriaDesc: { fontSize: '12.5px', color: '#6c757d', lineHeight: '1.5' },
  featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' },
  featureCard: {
    background: 'white', borderRadius: '14px', padding: '26px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid #eef1f6',
  },
  featureIcon: { marginBottom: '12px', color: '#2E5FA3', display: 'flex' },
  featureTitle: { fontSize: '16px', fontWeight: '700', marginBottom: '8px' },
  featureDesc: { fontSize: '13.5px', color: '#6c757d', lineHeight: '1.6' },
  ctaSection: { textAlign: 'center', padding: '80px 20px', background: '#1A3A6B', color: 'white' },
  ctaTitle: { fontSize: '28px', fontWeight: '800', marginBottom: '10px' },
  ctaSub: { fontSize: '15px', opacity: 0.85, marginBottom: '26px' },
  primaryBtnLight: {
    background: 'white', color: '#1A3A6B', padding: '14px 32px', borderRadius: '10px',
    textDecoration: 'none', fontWeight: '700', fontSize: '15px', display: 'inline-block',
  },
  footer: { textAlign: 'center', padding: '24px', color: '#6c757d', fontSize: '13px', background: '#f8faff' },
  footerInner: { display: 'inline-flex', alignItems: 'center', gap: '8px' },
};
