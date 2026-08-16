const pool = require('../config/db');

/**
 * Resolves what the given user may do with a project.
 *
 *   canView   — the owning manager, any project member, or an admin
 *   canManage — the owning manager or an admin
 *
 * Role alone is not enough: being "a manager" does not grant access to
 * another manager's project.
 */
async function checkProjectAccess(user, projectId) {
  if (!projectId || Number.isNaN(Number(projectId))) {
    return { found: false, canView: false, canManage: false };
  }

  const result = await pool.query(
    `SELECT
       p.manager_id,
       EXISTS (
         SELECT 1 FROM project_members pm
         WHERE pm.project_id = p.id AND pm.user_id = $2
       ) AS is_member
     FROM projects p
     WHERE p.id = $1`,
    [projectId, user.id]
  );

  if (result.rows.length === 0) {
    return { found: false, canView: false, canManage: false };
  }

  const { manager_id, is_member } = result.rows[0];
  const isAdmin = user.role === 'admin';
  const isOwner = Number(manager_id) === Number(user.id);

  return {
    found: true,
    isOwner,
    canView: isAdmin || isOwner || is_member,
    canManage: isAdmin || isOwner,
  };
}

/** Same, resolved from a task id. Also returns the owning project id. */
async function checkTaskAccess(user, taskId) {
  if (!taskId || Number.isNaN(Number(taskId))) {
    return { found: false, canView: false, canManage: false };
  }

  const task = await pool.query(
    'SELECT project_id FROM tasks WHERE id = $1',
    [taskId]
  );

  if (task.rows.length === 0) {
    return { found: false, canView: false, canManage: false };
  }

  const projectId = task.rows[0].project_id;
  const access = await checkProjectAccess(user, projectId);

  return { ...access, found: true, projectId };
}

/**
 * Sends the correct rejection for a failed access check.
 * Missing rows are 404; existing rows the user may not touch are 403.
 */
function denyAccess(res, access, subject = 'project') {
  if (!access.found) {
    return res.status(404).json({
      error: `${subject[0].toUpperCase()}${subject.slice(1)} not found.`,
    });
  }

  return res.status(403).json({
    error: `You do not have access to this ${subject}.`,
  });
}

module.exports = { checkProjectAccess, checkTaskAccess, denyAccess };
