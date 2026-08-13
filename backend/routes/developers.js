const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/auth');

// GET my skill profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM developer_profiles WHERE user_id = $1', [req.user.id]
    );
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch profile.' });
  }
});

// UPDATE my skill profile
router.put('/profile', verifyToken, async (req, res) => {
  const { skill_vector } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO developer_profiles (user_id, skill_vector, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id) DO UPDATE
       SET skill_vector=$2, updated_at=NOW() RETURNING *`,
      [req.user.id, JSON.stringify(skill_vector)]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Could not update profile.' });
  }
});

// GET all developers (for managers to view)
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.email, dp.skill_vector
       FROM users u
       LEFT JOIN developer_profiles dp ON dp.user_id = u.id
       WHERE u.role = 'developer'`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch developers.' });
  }
});

// GET developer management overview (skills, workload, assigned tasks) — manager/admin only
router.get('/management', verifyToken, async (req, res) => {
  if (!['manager', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Manager or admin access required.' });
  }
  try {
    const result = await pool.query(`
      SELECT
        u.id, u.full_name, u.email, dp.skill_vector,
        (SELECT COUNT(*)::int FROM project_members pm WHERE pm.user_id = u.id) AS project_count,
        (SELECT COUNT(*)::int FROM tasks t WHERE t.assigned_developer_id = u.id) AS assigned_task_count,
        (SELECT COUNT(*)::int FROM tasks t WHERE t.assigned_developer_id = u.id AND t.status <> 'done') AS active_task_count,
        (SELECT COUNT(*)::int FROM tasks t WHERE t.assigned_developer_id = u.id AND t.status = 'done') AS completed_task_count,
        (SELECT COALESCE(AVG(t.priority_score), 0) FROM tasks t WHERE t.assigned_developer_id = u.id) AS average_priority_score,
        (
          SELECT COALESCE(json_agg(json_build_object('id', p.id, 'title', p.title)), '[]')
          FROM projects p
          JOIN project_members pm ON pm.project_id = p.id
          WHERE pm.user_id = u.id
        ) AS project_memberships,
        (
          SELECT COALESCE(
            json_agg(
              json_build_object(
                'id', t.id, 'title', t.title, 'status', t.status,
                'priority_score', t.priority_score, 'project_title', p2.title
              ) ORDER BY t.priority_score DESC
            ), '[]'
          )
          FROM tasks t
          JOIN projects p2 ON p2.id = t.project_id
          WHERE t.assigned_developer_id = u.id
        ) AS assigned_tasks
      FROM users u
      LEFT JOIN developer_profiles dp ON dp.user_id = u.id
      WHERE u.role = 'developer'
      ORDER BY u.full_name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Developer management error:', err.message);
    res.status(500).json({ error: 'Could not fetch developer management data.' });
  }
});

module.exports = router;