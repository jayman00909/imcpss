
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  checkProjectAccess,
  checkTaskAccess,
  denyAccess,
} = require('../middleware/projectAccess');

// Every task endpoint requires a valid token.
router.use(verifyToken);

// GET all tasks for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const access = await checkProjectAccess(req.user, req.params.projectId);
    if (!access.canView) return denyAccess(res, access);

    const result = await pool.query(`
      SELECT
        t.*,
        u.full_name AS assigned_developer_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_developer_id
      WHERE t.project_id = $1
      ORDER BY t.deadline ASC, t.id ASC
    `, [req.params.projectId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get project tasks error:', error);
    res.status(500).json({
      error: 'Failed to fetch project tasks.'
    });
  }
});

// GET single task
router.get('/:id', async (req, res) => {
  try {
    const access = await checkTaskAccess(req.user, req.params.id);
    if (!access.canView) return denyAccess(res, access, 'task');

    const result = await pool.query(
      'SELECT * FROM tasks WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Task not found.'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      error: 'Failed to fetch task.'
    });
  }
});

 // CREATE task
router.post('/', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const {
      project_id,
      title,
      description,
      deadline,
      effort_hours,
      business_value,
      required_skills
    } = req.body;

    if (!project_id || !title || !deadline || !effort_hours) {
      return res.status(400).json({
        error: 'Project, title, deadline and effort hours are required.'
      });
    }

    const access = await checkProjectAccess(req.user, project_id);
    if (!access.canManage) return denyAccess(res, access);

    const result = await pool.query(`
      INSERT INTO tasks (
        project_id,
        title,
        description,
        deadline,
        effort_hours,
        business_value,
        required_skills,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'todo')
      RETURNING *
    `, [
      project_id,
      title,
      description || null,
      deadline,
      effort_hours,
      business_value || 5,
      required_skills || {}
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      error: 'Failed to create task.'
    });
  }
});

// UPDATE task
// Builds a partial update from only the fields present in the request body.
// COALESCE cannot be used here: it treats an explicit null as "leave unchanged",
// which makes clearing assigned_developer_id (unassigning) impossible.
const UPDATABLE_TASK_FIELDS = [
  'title',
  'description',
  'deadline',
  'effort_hours',
  'business_value',
  'required_skills',
  'assigned_developer_id',
];

router.put('/:id', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const access = await checkTaskAccess(req.user, req.params.id);
    if (!access.canManage) return denyAccess(res, access, 'task');

    const updates = [];
    const values = [];

    for (const field of UPDATABLE_TASK_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(req.body, field)) continue;

      let value = req.body[field];

      if (field === 'assigned_developer_id') {
        // '' from an unselected <select> and null both mean "unassign".
        value = value === '' || value === null || value === undefined
          ? null
          : Number(value);

        if (value !== null && Number.isNaN(value)) {
          return res.status(400).json({
            error: 'assigned_developer_id must be a number or null.',
          });
        }

        if (value !== null) {
          const developer = await pool.query(
            `SELECT id FROM users WHERE id = $1 AND role = 'developer'`,
            [value]
          );

          if (developer.rows.length === 0) {
            return res.status(400).json({
              error: 'Assigned user does not exist or is not a developer.',
            });
          }
        }
      }

      if (field === 'required_skills' && value && typeof value === 'object') {
        value = JSON.stringify(value);
      }

      values.push(value);
      updates.push(`${field} = $${values.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No updatable fields were provided.',
      });
    }

    values.push(req.params.id);

    const result = await pool.query(`
      UPDATE tasks
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Task not found.'
      });
    }

    // Return the developer name too so the client can render without a refetch.
    const task = result.rows[0];
    const withName = await pool.query(`
      SELECT t.*, u.full_name AS assigned_developer_name
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_developer_id
      WHERE t.id = $1
    `, [task.id]);

    res.json(withName.rows[0] || task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      error: 'Failed to update task.'
    });
  }
});

// UPDATE task status
router.patch('/:id/status', async (req, res) => {
  try {
    // Any project member may move a task on the board, not just the manager.
    const access = await checkTaskAccess(req.user, req.params.id);
    if (!access.canView) return denyAccess(res, access, 'task');

    const { status } = req.body;

    const allowedStatuses = [
      'todo',
      'in_progress',
      'in_review',
      'done'
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid task status.'
      });
    }

    const result = await pool.query(`
      UPDATE tasks
      SET
        status = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [status, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Task not found.'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      error: 'Failed to update task status.'
    });
  }
});

// DELETE task
router.delete('/:id', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const access = await checkTaskAccess(req.user, req.params.id);
    if (!access.canManage) return denyAccess(res, access, 'task');

    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Task not found.'
      });
    }

    res.json({
      message: 'Task deleted successfully.'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      error: 'Failed to delete task.'
    });
  }
});

// ADD task dependency
router.post('/:id/dependencies', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { depends_on_id } = req.body;

    if (!depends_on_id) {
      return res.status(400).json({
        error: 'depends_on_id is required.'
      });
    }

    if (Number(depends_on_id) === Number(req.params.id)) {
      return res.status(400).json({
        error: 'A task cannot depend on itself.'
      });
    }

    const access = await checkTaskAccess(req.user, req.params.id);
    if (!access.canManage) return denyAccess(res, access, 'task');

    // The prerequisite must live in the same project.
    const dependency = await checkTaskAccess(req.user, depends_on_id);
    if (!dependency.found || dependency.projectId !== access.projectId) {
      return res.status(400).json({
        error: 'The prerequisite task must belong to the same project.'
      });
    }

    const result = await pool.query(`
      INSERT INTO task_dependencies (task_id, depends_on_id)
      VALUES ($1, $2)
      ON CONFLICT (task_id, depends_on_id) DO NOTHING
      RETURNING *
    `, [req.params.id, depends_on_id]);

    if (result.rows.length === 0) {
      return res.status(409).json({
        error: 'That dependency already exists.'
      });
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add dependency error:', error);

    res.status(500).json({
      error: 'Failed to add task dependency.'
    });
  }
});

module.exports = router;