const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const verifyToken = require('../middleware/auth');

// GET all projects for logged-in user
router.get('/', verifyToken, async (req, res) => {
  try {
    let result;
    if (req.user.role === 'manager') {
      result = await pool.query(
        'SELECT * FROM projects WHERE manager_id = $1 ORDER BY created_at DESC',
        [req.user.id]
      );
    } else {
      result = await pool.query(
        `SELECT p.* FROM projects p
         JOIN project_members pm ON pm.project_id = p.id
         WHERE pm.user_id = $1 ORDER BY p.created_at DESC`,
        [req.user.id]
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Could not fetch projects.' });
  }
});

// CREATE project
router.post('/', verifyToken, async (req, res) => {
  if (req.user.role !== 'manager') {
    return res.status(403).json({ error: 'Only managers can create projects.' });
  }
  const { title, description, start_date, end_date } = req.body;
  if (!title || !start_date || !end_date) {
    return res.status(400).json({ error: 'Title, start date and end date are required.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO projects (title, description, start_date, end_date, manager_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, description, start_date, end_date, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Could not create project.' });
  }
});

// GET single project
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM projects WHERE id = $1', [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch project.' });
  }
});

// UPDATE project
router.put('/:id', verifyToken, async (req, res) => {
  const { title, description, start_date, end_date } = req.body;
  try {
    const result = await pool.query(
      `UPDATE projects SET title=$1, description=$2, start_date=$3, end_date=$4
       WHERE id=$5 AND manager_id=$6 RETURNING *`,
      [title, description, start_date, end_date, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found or not authorised.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Could not update project.' });
  }
});

// DELETE project
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM projects WHERE id=$1 AND manager_id=$2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Project deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete project.' });
  }
});

// ADD team member to project
router.post('/:id/members', verifyToken, async (req, res) => {
  const { user_id } = req.body;
  try {
    await pool.query(
      'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.id, user_id]
    );
    res.json({ message: 'Member added.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not add member.' });
  }
});

// GET project members
router.get('/:id/members', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.role FROM users u
       JOIN project_members pm ON pm.user_id = u.id
       WHERE pm.project_id = $1`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch members.' });
  }
});

module.exports = router;