 import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getMyProfile, updateMyProfile } from '../../utils/api';
import MainLayout from '../../components/Layout/MainLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../components/common/Toast';

const SKILL_OPTIONS = [
  { name: 'React', category: 'Frontend' },
  { name: 'JavaScript', category: 'Frontend' },
  { name: 'CSS', category: 'Frontend' },
  { name: 'Node.js', category: 'Backend' },
  { name: 'API Development', category: 'Backend' },
  { name: 'PostgreSQL', category: 'Database' },
  { name: 'Python', category: 'Backend' },
  { name: 'Testing', category: 'QA' },
  { name: 'UI/UX Design', category: 'Design' },
  { name: 'DevOps', category: 'Infrastructure' },
];

const LEVELS = [
  { value: 1, label: 'Beginner' },
  { value: 2, label: 'Basic' },
  { value: 3, label: 'Intermediate' },
  { value: 4, label: 'Advanced' },
  { value: 5, label: 'Expert' },
];

const LEVEL_COLORS = ['', '#fee2e2', '#fef3c7', '#d1fae5', '#dbeafe', '#ede9fe'];
const LEVEL_TEXT = ['', '#991b1b', '#92400e', '#065f46', '#1e40af', '#4c1d95'];

export default function DeveloperProfile() {
  const { user } = useSelector(s => s.auth);
  const showToast = useToast();
  const [skillVector, setSkillVector] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getMyProfile()
      .then(r => setSkillVector(r.data?.skill_vector || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setSkillLevel = (skill, level) => {
    if (level === 0) {
      const updated = { ...skillVector };
      delete updated[skill];
      setSkillVector(updated);
    } else {
      setSkillVector({ ...skillVector, [skill]: level });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMyProfile({ skill_vector: skillVector });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      showToast('Could not save profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const categories = [...new Set(SKILL_OPTIONS.map(s => s.category))];

  if (loading) return <MainLayout><LoadingSpinner /></MainLayout>;

  return (
    <MainLayout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🛠 My Skill Profile</h1>
          <p style={styles.sub}>
            Hello {user?.full_name} — set your skill levels so the MCO engine can
            match you to the right tasks.
          </p>
        </div>
        <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : saved ? '✅ Saved!' : '💾 Save Profile'}
        </button>
      </div>

      {/* Current Skills Summary */}
      {Object.keys(skillVector).length > 0 && (
        <div style={styles.summaryCard}>
          <h3 style={styles.summaryTitle}>Your Current Skills</h3>
          <div style={styles.summaryGrid}>
            {Object.entries(skillVector).map(([skill, level]) => (
              <div key={skill} style={{
                ...styles.summaryTag,
                background: LEVEL_COLORS[level],
                color: LEVEL_TEXT[level],
              }}>
                <span style={styles.summarySkill}>{skill}</span>
                <span style={styles.summaryLevel}>
                  {LEVELS.find(l => l.value === level)?.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skill Selector by Category */}
      {categories.map(cat => (
        <div key={cat} style={styles.categoryCard}>
          <h3 style={styles.catTitle}>{cat}</h3>
          <div style={styles.skillList}>
            {SKILL_OPTIONS.filter(s => s.category === cat).map(({ name }) => {
              const currentLevel = skillVector[name] || 0;
              return (
                <div key={name} style={styles.skillRow}>
                  <div style={styles.skillName}>
                    <span style={styles.skillNameText}>{name}</span>
                    {currentLevel > 0 && (
                      <span style={{
                        ...styles.levelBadge,
                        background: LEVEL_COLORS[currentLevel],
                        color: LEVEL_TEXT[currentLevel],
                      }}>
                        {LEVELS.find(l => l.value === currentLevel)?.label}
                      </span>
                    )}
                  </div>
                  <div style={styles.levelBtns}>
                    <button
                      style={{
                        ...styles.levelBtn,
                        background: currentLevel === 0 ? '#e0e0e0' : '#f5f5f5',
                        color: currentLevel === 0 ? '#333' : '#aaa',
                      }}
                      onClick={() => setSkillLevel(name, 0)}
                    >✕ None</button>
                    {LEVELS.map(lv => (
                      <button
                        key={lv.value}
                        onClick={() => setSkillLevel(name, lv.value)}
                        style={{
                          ...styles.levelBtn,
                          background: currentLevel === lv.value ? LEVEL_COLORS[lv.value] : '#f5f5f5',
                          color: currentLevel === lv.value ? LEVEL_TEXT[lv.value] : '#666',
                          fontWeight: currentLevel === lv.value ? '700' : '400',
                          border: currentLevel === lv.value
                            ? `2px solid ${LEVEL_TEXT[lv.value]}`
                            : '2px solid transparent',
                        }}
                      >
                        {lv.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* How it works */}
      <div style={styles.infoCard}>
        <h3 style={styles.infoTitle}>💡 How Your Skills Are Used</h3>
        <p style={styles.infoText}>
          When a project manager generates an MCO schedule, the system computes
          the <strong>cosine similarity</strong> between your skill vector and each task's
          required skills. Tasks are automatically assigned to the developer who is the
          best match. The higher and more accurate your skill ratings, the better
          the MCO engine can assign you to tasks that fit your strengths.
        </p>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : saved ? '✅ Saved!' : '💾 Save Profile'}
        </button>
      </div>
    </MainLayout>
  );
}

const styles = {
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: '24px',
  },
  title: { fontSize: '24px', fontWeight: '700', color: '#1a1a2e', marginBottom: '6px' },
  sub: { color: '#6c757d', fontSize: '14px', maxWidth: '500px', lineHeight: '1.5' },
  saveBtn: {
    background: '#2E5FA3', color: 'white', border: 'none',
    padding: '12px 28px', borderRadius: '10px', cursor: 'pointer',
    fontWeight: '700', fontSize: '14px',
  },
  summaryCard: {
    background: 'white', borderRadius: '12px', padding: '20px',
    marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
  },
  summaryTitle: { fontSize: '14px', fontWeight: '700', color: '#333', marginBottom: '12px' },
  summaryGrid: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
  summaryTag: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '8px 16px', borderRadius: '10px', minWidth: '90px',
  },
  summarySkill: { fontSize: '13px', fontWeight: '700' },
  summaryLevel: { fontSize: '11px', marginTop: '2px' },
  categoryCard: {
    background: 'white', borderRadius: '12px', padding: '20px',
    marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
  },
  catTitle: {
    fontSize: '14px', fontWeight: '700', color: '#2E5FA3',
    marginBottom: '16px', paddingBottom: '8px',
    borderBottom: '2px solid #EBF5FB',
  },
  skillList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  skillRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', gap: '16px',
  },
  skillName: { display: 'flex', alignItems: 'center', gap: '8px', minWidth: '160px' },
  skillNameText: { fontSize: '14px', fontWeight: '500', color: '#333' },
  levelBadge: { padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600' },
  levelBtns: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  levelBtn: {
    padding: '5px 12px', borderRadius: '8px', cursor: 'pointer',
    fontSize: '12px', border: '2px solid transparent',
    transition: 'all 0.15s',
  },
  infoCard: {
    background: '#f0f4ff', borderRadius: '12px', padding: '20px',
    marginBottom: '20px', border: '1px solid #dce8ff',
  },
  infoTitle: { fontSize: '14px', fontWeight: '700', color: '#2E5FA3', marginBottom: '8px' },
  infoText: { fontSize: '13px', color: '#555', lineHeight: '1.7' },
};