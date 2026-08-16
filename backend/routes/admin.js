const express = require('express');
const router = express.Router();

// Admin routes placeholder
router.get('/', (req, res) => {
  res.json({ message: 'Get admin data' });
});

router.post('/', (req, res) => {
  res.json({ message: 'Create admin' });
});

module.exports = router;
