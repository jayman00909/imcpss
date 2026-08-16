 const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  checkProjectAccess,
  denyAccess,
} = require('../middleware/projectAccess');

// Every project endpoint requires a valid token.
router.use(verifyToken);

// GET projects visible to the current user.
// Admins see everything; everyone else sees projects they manage or belong to.
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.title,
        p.description,
        p.start_date,
        p.end_date,
        p.manager_id,
        p.created_at,
        u.full_name AS manager_name,
        COUNT(t.id)::int AS total_tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'done')::int AS completed_tasks
      FROM projects p
      LEFT JOIN users u ON u.id = p.manager_id
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE
        $2 = 'admin'
        OR p.manager_id = $1
        OR EXISTS (
          SELECT 1 FROM project_members pm
          WHERE pm.project_id = p.id AND pm.user_id = $1
        )
      GROUP BY p.id, u.full_name
      ORDER BY p.created_at DESC
    `, [req.user.id, req.user.role]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      error: 'Failed to fetch projects.'
    });
  }
});

// GET single project
router.get('/:id', async (req, res) => {
  try {
    const access = await checkProjectAccess(req.user, req.params.id);
    if (!access.canView) return denyAccess(res, access);

    const result = await pool.query(`
      SELECT
        p.id,
        p.title,
        p.description,
        p.start_date,
        p.end_date,
        p.manager_id,
        p.created_at,
        u.full_name AS manager_name
      FROM projects p
      LEFT JOIN users u ON u.id = p.manager_id
      WHERE p.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Project not found.'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      error: 'Failed to fetch project.'
    });
  }
});

// CREATE project
router.post('/', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const {
      title,
      description,
      start_date,
      end_date
    } = req.body;

    // The owning manager is taken from the verified token, never from the
    // request body — a client must not be able to create a project for
    // someone else.
    const manager_id = req.user.id;

    if (!title || !start_date || !end_date) {
      return res.status(400).json({
        error: 'Title, start date and end date are required.'
      });
    }

    const result = await pool.query(`
      INSERT INTO projects
        (title, description, start_date, end_date, manager_id)
      VALUES
        ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      title,
      description || null,
      start_date,
      end_date,
      manager_id
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      error: 'Failed to create project.'
    });
  }
});

// UPDATE project
router.put('/:id', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const access = await checkProjectAccess(req.user, req.params.id);
    if (!access.canManage) return denyAccess(res, access);

    const {
      title,
      description,
      start_date,
      end_date
    } = req.body;

    const result = await pool.query(`
      UPDATE projects
      SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        start_date = COALESCE($3, start_date),
        end_date = COALESCE($4, end_date)
      WHERE id = $5
      RETURNING *
    `, [
      title,
      description,
      start_date,
      end_date,
      req.params.id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Project not found.'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      error: 'Failed to update project.'
    });
  }
});

// DELETE project
router.delete('/:id', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const access = await checkProjectAccess(req.user, req.params.id);
    if (!access.canManage) return denyAccess(res, access);

    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Project not found.'
      });
    }

    res.json({
      message: 'Project deleted successfully.'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      error: 'Failed to delete project.'
    });
  }
});
// GET project members
router.get('/:id/members', async (req, res) => {
  try {
    const access = await checkProjectAccess(req.user, req.params.id);
    if (!access.canView) return denyAccess(res, access);

    const result = await pool.query(`
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.role
      FROM project_members pm
      JOIN users u ON u.id = pm.user_id
      WHERE pm.project_id = $1
      ORDER BY u.full_name
    `, [req.params.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get project members error:', error);
    res.status(500).json({
      error: 'Failed to fetch project members.'
    });
  }
});

// ADD project member
router.post('/:id/members', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const access = await checkProjectAccess(req.user, req.params.id);
    if (!access.canManage) return denyAccess(res, access);

    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        error: 'User ID is required.'
      });
    }

    const result = await pool.query(`
      INSERT INTO project_members (project_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (project_id, user_id)
      DO NOTHING
      RETURNING project_id, user_id
    `, [req.params.id, user_id]);

    if (result.rows.length === 0) {
      return res.status(409).json({
        error: 'Developer is already a member of this project.'
      });
    }

    res.status(201).json({
      message: 'Developer added successfully.',
      member: result.rows[0]
    });

  } catch (error) {
    console.error('Add project member error:', error);
    res.status(500).json({
      error: 'Failed to add project member.'
    });
  }
});

module.exports = router;