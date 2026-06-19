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

module.exports = router;