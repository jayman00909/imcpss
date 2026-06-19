const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/auth');

// Middleware — admin only
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
};

// GET system stats
router.get('/stats', verifyToken, adminOnly, async (req, res) => {
  try {
    const stats = await pool.query('SELECT * FROM system_stats');
    const recentUsers = await pool.query(
      `SELECT id, full_name, email, role, created_at 
       FROM users ORDER BY created_at DESC LIMIT 5`
    );
    const recentProjects = await pool.query(
      `SELECT p.id, p.title, p.created_at, u.full_name as manager_name
       FROM projects p JOIN users u ON u.id = p.manager_id
       ORDER BY p.created_at DESC LIMIT 5`
    );
    res.json({
      stats: stats.rows[0],
      recentUsers: recentUsers.rows,
      recentProjects: recentProjects.rows,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Could not fetch stats.' });
  }
});

// GET all users
router.get('/users', verifyToken, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, role, created_at,
        (SELECT COUNT(*) FROM projects WHERE manager_id = users.id) as project_count
       FROM users ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch users.' });
  }
});

// GET all projects
router.get('/projects', verifyToken, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.full_name as manager_name,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as done_count,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
       FROM projects p JOIN users u ON u.id = p.manager_id
       ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch projects.' });
  }
});

// UPDATE user role
router.patch('/users/:id/role', verifyToken, adminOnly, async (req, res) => {
  const { role } = req.body;
  if (!['manager', 'developer', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role.' });
  }
  try {
    const result = await pool.query(
      'UPDATE users SET role=$1 WHERE id=$2 RETURNING id, full_name, email, role',
      [role, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Could not update role.' });
  }
});

// DELETE user
router.delete('/users/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    res.json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete user.' });
  }
});

// DELETE project
router.delete('/projects/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM projects WHERE id=$1', [req.params.id]);
    res.json({ message: 'Project deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete project.' });
  }
});

module.exports = router;