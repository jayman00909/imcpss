const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const rateLimit = require('../middleware/rateLimit');
const { sendMail, passwordResetEmail } = require('../utils/mailer');

const router = express.Router();

const MIN_PASSWORD_LENGTH = 8;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

// Where the reset link should point. Falls back to the first configured CORS
// origin so a correct deployment needs no extra configuration.
function frontendBaseUrl() {
  const explicit = process.env.FRONTEND_URL || process.env.CORS_ORIGIN;
  const first = String(explicit || 'http://localhost:5173').split(',')[0];
  return first.trim().replace(/\/$/, '');
}

// Throttle credential guessing against a single account.
//
// Keyed on the email rather than the client IP: behind a load balancer the
// observed IP is not reliably the caller's, and a key that changes between
// requests means the limiter never trips at all. The email is always stable,
// so brute forcing one account is capped no matter where it comes from.
// Falls back to IP only when no email was supplied.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts for this account. Please try again later.',
  keyFactory: (req) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    return email ? `email:${email}` : `ip:${req.ip}`;
  },
});

// Registration is capped per IP to stop bulk account creation. The ceiling is
// deliberately generous: a lab or lecture theatre shares one public IP behind
// NAT, so a low limit would lock out a whole room of legitimate signups. Mass
// abuse is further limited by manager accounts requiring an invite code.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  message: 'Too many accounts created from this address. Please try again later.',
});

// REGISTER
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body;

    // Validate required fields
    if (!full_name || !email || !password || !role) {
      return res.status(400).json({
        error: 'Full name, email, password, and role are required.',
      });
    }

    if (String(password).length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      });
    }

    // Only manager and developer can register themselves
    if (!['manager', 'developer'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role. Choose manager or developer.',
      });
    }

    // Manager accounts can create projects and pull other users into them, so
    // self-service manager signup is gated behind an invite code when one is
    // configured. Leaving MANAGER_SIGNUP_CODE unset keeps signup open, which
    // is convenient locally but should not be used in production.
    const managerCode = process.env.MANAGER_SIGNUP_CODE;

    if (role === 'manager' && managerCode) {
      const supplied = String(req.body.manager_code || '');

      // Constant-time compare so the code cannot be guessed by timing.
      const expectedBuf = Buffer.from(managerCode);
      const suppliedBuf = Buffer.from(supplied);
      const matches =
        expectedBuf.length === suppliedBuf.length &&
        crypto.timingSafeEqual(expectedBuf, suppliedBuf);

      if (!matches) {
        return res.status(403).json({
          error: 'A valid manager invite code is required to register as a manager.',
        });
      }
    }

    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'An account with this email already exists.',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, role, created_at`,
      [full_name, email, passwordHash, role]
    );

    const user = result.rows[0];

    // Create JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d',
      }
    );

    return res.status(201).json({
      message: 'Registration successful.',
      token,
      user,
    });
  } catch (error) {
    console.error('Registration error:', error);

    return res.status(500).json({
      error: 'Internal server error.',
    });
  }
});

// LOGIN
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required.',
      });
    }

    // Find user
    const result = await pool.query(
      `SELECT id, full_name, email, password_hash, role
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid email or password.',
      });
    }

    const user = result.rows[0];

    // Check password
    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        error: 'Invalid email or password.',
      });
    }

    // Create JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d',
      }
    );

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      error: 'Internal server error.',
    });
  }
});

// Throttle reset requests so the endpoint cannot be used to spam someone's inbox.
const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many reset requests for this account. Please try again later.',
  keyFactory: (req) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    return email ? `forgot:${email}` : `forgot-ip:${req.ip}`;
  },
});

// REQUEST A PASSWORD RESET
router.post('/forgot-password', forgotLimiter, async (req, res) => {
  // Always answer the same way. Revealing whether an address exists would turn
  // this endpoint into a way to enumerate registered users.
  const genericResponse = {
    message:
      'If that email is registered, a password reset link has been sent to it.',
  };

  try {
    const email = String(req.body?.email || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const result = await pool.query(
      'SELECT id, full_name, email FROM users WHERE LOWER(email) = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.json(genericResponse);
    }

    const user = result.rows[0];

    // Any earlier unused token becomes invalid once a new one is issued.
    await pool.query(
      `UPDATE password_reset_tokens SET used_at = NOW()
       WHERE user_id = $1 AND used_at IS NULL`,
      [user.id]
    );

    const token = crypto.randomBytes(32).toString('hex');

    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, hashToken(token), new Date(Date.now() + RESET_TOKEN_TTL_MS)]
    );

    const resetUrl =
      `${frontendBaseUrl()}/reset-password?token=${token}` +
      `&email=${encodeURIComponent(user.email)}`;

    const { subject, html, text } = passwordResetEmail({
      fullName: user.full_name,
      resetUrl,
    });

    // Deliberately not awaited. Handing off to a mail provider can take many
    // seconds, or hang outright if the host blocks outbound SMTP, and the
    // caller must not sit waiting on it. The token is already stored, so
    // delivery succeeding or failing does not change the reply.
    sendMail({ to: user.email, subject, html, text }).catch((err) =>
      console.error('Password reset email failed:', err.message)
    );

    return res.json(genericResponse);
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// COMPLETE A PASSWORD RESET
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body || {};

    if (!token || !password) {
      return res.status(400).json({
        error: 'Reset token and new password are required.',
      });
    }

    if (String(password).length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      });
    }

    const result = await pool.query(
      `SELECT prt.id, prt.user_id, prt.expires_at, prt.used_at, u.email
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.token_hash = $1`,
      [hashToken(String(token))]
    );

    const record = result.rows[0];

    if (!record || record.used_at || new Date(record.expires_at) < new Date()) {
      return res.status(400).json({
        error: 'This reset link is invalid or has expired. Please request a new one.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
      passwordHash,
      record.user_id,
    ]);

    await pool.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
      [record.id]
    );

    return res.json({
      message: 'Your password has been reset. You can now sign in.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;