 const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/auth');
const { runMCO, normalizeWeights } = require('../mco/mcoEngine'); 

// Generate MCO schedule for a project
router.post('/generate/:projectId', verifyToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { weights } = req.body || {};

    // Get project
    const projectResult = await pool.query(
      `
      SELECT id, title, description, start_date, end_date, manager_id
      FROM projects
      WHERE id = $1
      `,
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Project not found.'
      });
    }

    const project = projectResult.rows[0];

    // Get tasks and their dependencies
    const tasksResult = await pool.query(
      `
      SELECT
        t.*,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', td.depends_on_id,
                'status', dep.status
              )
            )
            FROM task_dependencies td
            JOIN tasks dep ON dep.id = td.depends_on_id
            WHERE td.task_id = t.id
          ),
          '[]'::json
        ) AS dependencies
      FROM tasks t
      WHERE t.project_id = $1
      ORDER BY t.deadline ASC, t.id ASC
      `,
      [projectId]
    );

    // Get developers belonging to this project
    const developersResult = await pool.query(
      `
      SELECT
        u.id,
        u.full_name,
        u.email,
        COALESCE(dp.skill_vector, '{}'::jsonb) AS skill_vector
      FROM project_members pm
      JOIN users u ON u.id = pm.user_id
      LEFT JOIN developer_profiles dp ON dp.user_id = u.id
      WHERE pm.project_id = $1
        AND u.role = 'developer'
      ORDER BY u.full_name
      `,
      [projectId]
    );

    const tasks = tasksResult.rows;
    const developers = developersResult.rows;

    if (tasks.length === 0) {
      return res.status(400).json({
        error: 'This project has no tasks to schedule.'
      });
    }

    if (developers.length === 0) {
      return res.status(400).json({
        error: 'This project has no developers assigned to it.'
      });
    }

    // Normalize MCO weights
const normalizedWeights = normalizeWeights(weights || {});

// Run the MCO engine
const startTime = Date.now();

const schedule = runMCO(
  tasks,
  developers,
  normalizedWeights,
  project
); 

    const elapsedMs = Date.now() - startTime;

    // Save generated priority scores and developer assignments
    for (const task of schedule) {
      const developerId = task.assigned_developer?.id || null;

      await pool.query(
        `
        UPDATE tasks
        SET
          priority_score = $1,
          assigned_developer_id = $2,
          updated_at = NOW()
        WHERE id = $3
        `,
        [
          task.priority_score,
          developerId,
          task.id
        ]
      );
    }

    // Save schedule history
    const scheduleResult = await pool.query(
      `
      INSERT INTO schedules (
        project_id,
        weights,
        schedule_data,
        elapsed_ms
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id, project_id, weights, schedule_data, elapsed_ms, created_at
      `,
      [
        projectId,
    JSON.stringify(normalizedWeights),
        JSON.stringify(schedule),
        elapsedMs
      ]
    );

    res.json({
      message: 'MCO schedule generated successfully.',
      project,
     weights: normalizedWeights,
      elapsed_ms: elapsedMs,
      developers,
      schedule,
      saved_schedule: scheduleResult.rows[0]
    });

  } catch (error) {
    console.error('MCO schedule generation error:', error);

    res.status(500).json({
      error: 'Failed to generate MCO schedule.',
      details: error.message
    });
  }
});

// Get latest saved schedule for a project
router.get('/:projectId', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        project_id,
        weights,
        schedule_data,
        elapsed_ms,
        created_at
      FROM schedules
      WHERE project_id = $1
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [req.params.projectId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'No schedule has been generated for this project yet.'
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Get schedule error:', error);

    res.status(500).json({
      error: 'Failed to fetch schedule.'
    });
  }
});

module.exports = router;
