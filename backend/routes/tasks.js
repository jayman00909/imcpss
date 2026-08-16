 
const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET all tasks for a project
router.get('/project/:projectId', async (req, res) => {
  try {
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
router.post('/', async (req, res) => {
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
router.put('/:id', async (req, res) => {
  try {
    const {
      title,
      description,
      deadline,
      effort_hours,
      business_value,
      required_skills,
      assigned_developer_id
    } = req.body;

    const result = await pool.query(`
      UPDATE tasks
      SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        deadline = COALESCE($3, deadline),
        effort_hours = COALESCE($4, effort_hours),
        business_value = COALESCE($5, business_value),
        required_skills = COALESCE($6, required_skills),
        assigned_developer_id = COALESCE($7, assigned_developer_id),
        updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `, [
      title,
      description,
      deadline,
      effort_hours,
      business_value,
      required_skills,
      assigned_developer_id,
      req.params.id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Task not found.'
      });
    }

    res.json(result.rows[0]);
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
router.delete('/:id', async (req, res) => {
  try {
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
router.post('/:id/dependencies', async (req, res) => {
  try {
    const { depends_on_id } = req.body;

    if (!depends_on_id) {
      return res.status(400).json({
        error: 'depends_on_id is required.'
      });
    }

    const result = await pool.query(`
      INSERT INTO task_dependencies (task_id, depends_on_id)
      VALUES ($1, $2)
      RETURNING *
    `, [req.params.id, depends_on_id]);

    res.status(201).json(result.rows[0]);
   } catch (error) {
  console.error('Add dependency error:', error);

  res.status(500).json({
    error: 'Failed to add task dependency.',
    details: error.message
  });
}
});

module.exports = router;