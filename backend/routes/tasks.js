const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/auth');

// GET all tasks for a project
router.get('/project/:projectId', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE project_id = $1 ORDER BY priority_score DESC',
      [req.params.projectId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch tasks.' });
  }
});

// CREATE task
router.post('/', verifyToken, async (req, res) => {
  const {
    project_id, title, description, deadline,
    effort_hours, business_value, required_skills
  } = req.body;

  if (!project_id || !title || !deadline || !effort_hours) {
    return res.status(400).json({ error: 'project_id, title, deadline, and effort_hours are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tasks
         (project_id, title, description, deadline, effort_hours, business_value, required_skills)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        project_id, title, description, deadline,
        effort_hours, business_value || 5,
        JSON.stringify(required_skills || {})
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Could not create task.' });
  }
});

// UPDATE task status
router.patch('/:id/status', verifyToken, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['todo', 'in_progress', 'in_review', 'done'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value.' });
  }
  try {
    const result = await pool.query(
      'UPDATE tasks SET status=$1 WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Could not update task status.' });
  }
});

// UPDATE full task
router.put('/:id', verifyToken, async (req, res) => {
  const {
    title, description, deadline, effort_hours,
    business_value, required_skills
  } = req.body;
  try {
    const result = await pool.query(
      `UPDATE tasks SET title=$1, description=$2, deadline=$3,
        effort_hours=$4, business_value=$5, required_skills=$6
       WHERE id=$7 RETURNING *`,
      [title, description, deadline, effort_hours, business_value,
       JSON.stringify(required_skills || {}), req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Could not update task.' });
  }
});

// DELETE task
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id=$1', [req.params.id]);
    res.json({ message: 'Task deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete task.' });
  }
});

// ADD dependency
router.post('/:id/dependencies', verifyToken, async (req, res) => {
  const { depends_on_id } = req.body;
  try {
    await pool.query(
      'INSERT INTO task_dependencies (task_id, depends_on_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.params.id, depends_on_id]
    );
    res.json({ message: 'Dependency added.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not add dependency.' });
  }
});

module.exports = router;