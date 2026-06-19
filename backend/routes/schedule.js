const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/auth');
const { runMCO } = require('../mco/mcoEngine');

router.post('/generate/:projectId', verifyToken, async (req, res) => {
  const { weights } = req.body;

  try {
    // Get project info
    const projectResult = await pool.query(
      'SELECT * FROM projects WHERE id = $1', [req.params.projectId]
    );
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    const project = projectResult.rows[0];

    // Get all tasks for the project
    const tasksResult = await pool.query(
      'SELECT * FROM tasks WHERE project_id = $1', [req.params.projectId]
    );

    // Get dependencies for each task
    const tasks = await Promise.all(tasksResult.rows.map(async (task) => {
      const depResult = await pool.query(
        `SELECT t.id, t.status FROM tasks t
         JOIN task_dependencies td ON td.depends_on_id = t.id
         WHERE td.task_id = $1`,
        [task.id]
      );
      return { ...task, dependencies: depResult.rows };
    }));

    // Get developers in this project
    const devResult = await pool.query(
      `SELECT u.id, u.full_name, u.email, dp.skill_vector
       FROM users u
       JOIN project_members pm ON pm.user_id = u.id
       JOIN developer_profiles dp ON dp.user_id = u.id
       WHERE pm.project_id = $1 AND u.role = 'developer'`,
      [req.params.projectId]
    );

    const schedule = runMCO(
      tasks,
      devResult.rows,
      weights || {},
      { start_date: project.start_date, end_date: project.end_date }
    );

    // Save priority scores back to the database
    await Promise.all(schedule.map(task =>
      pool.query(
        'UPDATE tasks SET priority_score=$1, assigned_developer_id=$2 WHERE id=$3',
        [
          task.priority_score,
          task.assigned_developer ? task.assigned_developer.id : null,
          task.id
        ]
      )
    ));

    res.json({ schedule, weights_used: weights || { w1:0.30, w2:0.25, w3:0.20, w4:0.15, w5:0.10 } });

  } catch (err) {
    console.error('Schedule error:', err.message);
    res.status(500).json({ error: 'Could not generate schedule.' });
  }
});

module.exports = router;