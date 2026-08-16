const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

// Every admin endpoint requires a valid token AND the admin role.
router.use(verifyToken, requireRole('admin'));

// GET system statistics + recent activity
router.get('/stats', async (req, res) => {
  try {
    const [totals, recentUsers, recentProjects] = await Promise.all([
      pool.query('SELECT * FROM system_stats'),
      pool.query(`
        SELECT id, full_name, email, role, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT 5
      `),
      pool.query(`
        SELECT p.id, p.title, p.created_at, u.full_name AS manager_name
        FROM projects p
        LEFT JOIN users u ON u.id = p.manager_id
        ORDER BY p.created_at DESC
        LIMIT 5
      `),
    ]);

    res.json({
      ...totals.rows[0],
      recentUsers: recentUsers.rows,
      recentProjects: recentProjects.rows,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch system statistics.' });
  }
});

// GET all users
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.role,
        u.created_at,
        (SELECT COUNT(*)::int FROM project_members pm WHERE pm.user_id = u.id) AS project_count
      FROM users u
      ORDER BY u.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// GET all projects with task/member counts
router.get('/projects', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.title,
        p.created_at,
        u.full_name AS manager_name,
        (SELECT COUNT(*)::int FROM tasks t WHERE t.project_id = p.id) AS task_count,
        (SELECT COUNT(*)::int FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') AS done_count,
        (SELECT COUNT(*)::int FROM project_members pm WHERE pm.project_id = p.id) AS member_count
      FROM projects p
      LEFT JOIN users u ON u.id = p.manager_id
      ORDER BY p.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Admin get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects.' });
  }
});

// UPDATE a user's role
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;

    if (!['manager', 'developer', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }

    if (Number(req.params.id) === Number(req.user.id)) {
      return res.status(400).json({ error: 'You cannot change your own role.' });
    }

    const result = await pool.query(
      `UPDATE users SET role = $1 WHERE id = $2
       RETURNING id, full_name, email, role, created_at`,
      [role, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Admin update role error:', error);
    res.status(500).json({ error: 'Failed to update user role.' });
  }
});

// DELETE a user
router.delete('/users/:id', async (req, res) => {
  try {
    if (Number(req.params.id) === Number(req.user.id)) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// DELETE a project
router.delete('/projects/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    res.json({ message: 'Project deleted successfully.' });
  } catch (error) {
    console.error('Admin delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project.' });
  }
});

module.exports = router;
