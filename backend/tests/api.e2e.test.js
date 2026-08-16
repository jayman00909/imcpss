/**
 * End-to-end API verification for the MCO system.
 *
 * Requires the backend to already be running (npm start) and reachable at
 * API_BASE_URL, default http://localhost:5050/api.
 *
 *   npm run test:api
 *
 * Every user, project and task it creates is prefixed with TAG and deleted in
 * the cleanup step, so existing data is never touched.
 */
require('dotenv').config();
const crypto = require('crypto');
const pool = require('../config/db');

const BASE = process.env.API_BASE_URL || 'http://localhost:5050/api';
const ORIGIN = process.env.TEST_ORIGIN || 'http://localhost:5173';
const TAG = 'mco_e2e_check';
const PW = 'TestPass123';

let pass = 0;
const failures = [];

function check(name, condition, detail = '') {
  if (condition) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    failures.push(`${name} ${detail}`);
    console.log(`  FAIL  ${name} ${detail}`);
  }
}

async function call(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Origin: ORIGIN,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  let data = null;
  try { data = await res.json(); } catch { /* no body */ }
  return { status: res.status, data, headers: res.headers };
}

// Manager signups need the invite code when the server has one configured.
const register = (name, role, suffix) =>
  call('POST', '/auth/register', {
    body: {
      full_name: name,
      email: `${TAG}_${suffix}@example.com`,
      password: PW,
      role,
      ...(role === 'manager' && process.env.MANAGER_SIGNUP_CODE
        ? { manager_code: process.env.MANAGER_SIGNUP_CODE }
        : {}),
    },
  });

async function run() {
  console.log('\n=== AUTHENTICATION ===');
  const mgrA = await register('E2E Manager A', 'manager', 'mgra');
  check('register manager -> 201', mgrA.status === 201, `got ${mgrA.status}`);
  const tokA = mgrA.data?.token;
  const idA = mgrA.data?.user?.id;
  check('registration stores the selected role', mgrA.data?.user?.role === 'manager', mgrA.data?.user?.role);

  const mgrB = await register('E2E Manager B', 'manager', 'mgrb');
  const tokB = mgrB.data?.token;

  const devs = {};
  for (const n of ['ada', 'bob', 'chloe']) {
    const r = await register(`E2E ${n}`, 'developer', n);
    devs[n] = { id: r.data?.user?.id, token: r.data?.token, role: r.data?.user?.role };
  }
  check('developers registered with developer role', Object.values(devs).every((d) => d.id && d.role === 'developer'));

  const outsider = await register('E2E Outsider', 'developer', 'outsider');

  check('invalid role rejected -> 400',
    (await call('POST', '/auth/register', { body: { full_name: 'X', email: `${TAG}_bad@example.com`, password: PW, role: 'superuser' } })).status === 400);
  check('short password rejected -> 400',
    (await call('POST', '/auth/register', { body: { full_name: 'X', email: `${TAG}_short@example.com`, password: 'abc', role: 'developer' } })).status === 400);
  check('duplicate email rejected -> 409',
    (await register('E2E Manager A', 'manager', 'mgra')).status === 409);

  const login = await call('POST', '/auth/login', { body: { email: `${TAG}_mgra@example.com`, password: PW } });
  check('login -> 200 with token and role', login.status === 200 && !!login.data.token && login.data.user.role === 'manager');
  check('wrong password -> 401',
    (await call('POST', '/auth/login', { body: { email: `${TAG}_mgra@example.com`, password: 'Nope12345' } })).status === 401);
  check('no token -> 401', (await call('GET', '/projects')).status === 401);
  check('malformed token -> 401', (await call('GET', '/projects', { token: 'a.b.c' })).status === 401);

  console.log('\n=== SECURITY HEADERS ===');
  const h = (await call('GET', '/projects', { token: tokA })).headers;
  check('X-Content-Type-Options', h.get('x-content-type-options') === 'nosniff');
  check('X-Frame-Options', h.get('x-frame-options') === 'DENY');
  check('Referrer-Policy', h.get('referrer-policy') === 'no-referrer');

  console.log('\n=== PROJECTS AND TEAM ===');
  const proj = await call('POST', '/projects', {
    token: tokA,
    body: { title: `${TAG} Project A`, description: 'demo', start_date: '2026-01-01', end_date: '2026-12-31' },
  });
  check('create project -> 201', proj.status === 201, JSON.stringify(proj.data));
  const pid = proj.data?.id;
  check('manager_id derived from token', proj.data?.manager_id === idA);

  for (const d of Object.values(devs)) {
    await call('POST', `/projects/${pid}/members`, { token: tokA, body: { user_id: d.id } });
  }
  check('team has 3 members', (await call('GET', `/projects/${pid}/members`, { token: tokA })).data?.length === 3);
  check('duplicate member -> 409',
    (await call('POST', `/projects/${pid}/members`, { token: tokA, body: { user_id: devs.ada.id } })).status === 409);

  console.log('\n=== OWNERSHIP SCOPING ===');
  check('owner sees own project', (await call('GET', '/projects', { token: tokA })).data?.some((p) => p.id === pid));
  check("other manager cannot see it", !(await call('GET', '/projects', { token: tokB })).data?.some((p) => p.id === pid));
  check('member developer sees it', (await call('GET', '/projects', { token: devs.ada.token })).data?.some((p) => p.id === pid));
  check('non-member cannot see it', !(await call('GET', '/projects', { token: outsider.data.token })).data?.some((p) => p.id === pid));
  check('other manager GET -> 403', (await call('GET', `/projects/${pid}`, { token: tokB })).status === 403);
  check('other manager UPDATE -> 403', (await call('PUT', `/projects/${pid}`, { token: tokB, body: { title: 'x' } })).status === 403);
  check('other manager DELETE -> 403', (await call('DELETE', `/projects/${pid}`, { token: tokB })).status === 403);
  check('other manager ADD MEMBER -> 403', (await call('POST', `/projects/${pid}/members`, { token: tokB, body: { user_id: devs.bob.id } })).status === 403);
  check('non-member GET -> 403', (await call('GET', `/projects/${pid}`, { token: outsider.data.token })).status === 403);
  check('member GET -> 200', (await call('GET', `/projects/${pid}`, { token: devs.ada.token })).status === 200);
  check('missing project -> 404', (await call('GET', '/projects/99999999', { token: tokA })).status === 404);

  console.log('\n=== TASKS ===');
  const tA = await call('POST', '/tasks', {
    token: tokA,
    body: { project_id: pid, title: 'Build Login Page', deadline: '2026-03-01', effort_hours: 8, business_value: 8, required_skills: { React: 3, CSS: 3 } },
  });
  check('create task -> 201', tA.status === 201, JSON.stringify(tA.data));
  const taskA = tA.data?.id;
  check('required_skills persisted', tA.data?.required_skills?.React === 3 && tA.data?.required_skills?.CSS === 3);

  const tB = await call('POST', '/tasks', {
    token: tokA,
    body: { project_id: pid, title: 'Design Database', deadline: '2026-02-01', effort_hours: 12, business_value: 9, required_skills: { PostgreSQL: 3 } },
  });
  const taskB = tB.data?.id;

  check('tasks listed', (await call('GET', `/tasks/project/${pid}`, { token: tokA })).data?.length === 2);
  check('other manager cannot list -> 403', (await call('GET', `/tasks/project/${pid}`, { token: tokB })).status === 403);
  check('non-member cannot list -> 403', (await call('GET', `/tasks/project/${pid}`, { token: outsider.data.token })).status === 403);
  check('other manager cannot create -> 403',
    (await call('POST', '/tasks', { token: tokB, body: { project_id: pid, title: 'x', deadline: '2026-04-01', effort_hours: 2 } })).status === 403);
  check('other manager cannot edit -> 403', (await call('PUT', `/tasks/${taskA}`, { token: tokB, body: { title: 'x' } })).status === 403);
  check('other manager cannot delete -> 403', (await call('DELETE', `/tasks/${taskA}`, { token: tokB })).status === 403);

  const st = await call('PATCH', `/tasks/${taskA}/status`, { token: devs.ada.token, body: { status: 'in_progress' } });
  check('member developer can change status', st.status === 200 && st.data?.status === 'in_progress');
  check('non-member cannot change status -> 403',
    (await call('PATCH', `/tasks/${taskA}/status`, { token: outsider.data.token, body: { status: 'done' } })).status === 403);
  check('invalid status -> 400', (await call('PATCH', `/tasks/${taskA}/status`, { token: tokA, body: { status: 'bogus' } })).status === 400);

  console.log('\n=== DEVELOPER ASSIGNMENT (PUT /api/tasks/:id) ===');
  const a1 = await call('PUT', `/tasks/${taskA}`, { token: tokA, body: { assigned_developer_id: devs.ada.id } });
  check('assign unassigned task -> Ada', a1.data?.assigned_developer_id === devs.ada.id);
  check('response carries developer name for the UI', a1.data?.assigned_developer_name === 'E2E ada', a1.data?.assigned_developer_name);
  check('change Ada -> Bob', (await call('PUT', `/tasks/${taskA}`, { token: tokA, body: { assigned_developer_id: devs.bob.id } })).data?.assigned_developer_id === devs.bob.id);
  check('change Bob -> Chloe', (await call('PUT', `/tasks/${taskA}`, { token: tokA, body: { assigned_developer_id: devs.chloe.id } })).data?.assigned_developer_id === devs.chloe.id);
  check('unassign with null', (await call('PUT', `/tasks/${taskA}`, { token: tokA, body: { assigned_developer_id: null } })).data?.assigned_developer_id === null);
  await call('PUT', `/tasks/${taskA}`, { token: tokA, body: { assigned_developer_id: devs.ada.id } });
  check('unassign with empty string', (await call('PUT', `/tasks/${taskA}`, { token: tokA, body: { assigned_developer_id: '' } })).data?.assigned_developer_id === null);

  await call('PUT', `/tasks/${taskA}`, { token: tokA, body: { assigned_developer_id: devs.bob.id } });
  const reread = (await call('GET', `/tasks/project/${pid}`, { token: tokA })).data.find((t) => t.id === taskA);
  check('assignment survives a page refresh (persisted)', reread?.assigned_developer_id === devs.bob.id);
  check('refetch also returns the developer name', reread?.assigned_developer_name === 'E2E bob', reread?.assigned_developer_name);

  const partial = await call('PUT', `/tasks/${taskA}`, { token: tokA, body: { title: 'Build Login Page v2' } });
  check('editing only the title keeps the assignment', partial.data?.assigned_developer_id === devs.bob.id && partial.data?.title === 'Build Login Page v2');
  check('unknown developer -> 400', (await call('PUT', `/tasks/${taskA}`, { token: tokA, body: { assigned_developer_id: 99999999 } })).status === 400);
  check('developer cannot assign -> 403', (await call('PUT', `/tasks/${taskA}`, { token: devs.ada.token, body: { assigned_developer_id: devs.ada.id } })).status === 403);

  console.log('\n=== DEPENDENCIES ===');
  check('add dependency -> 201', (await call('POST', `/tasks/${taskA}/dependencies`, { token: tokA, body: { depends_on_id: taskB } })).status === 201);
  check('duplicate -> 409', (await call('POST', `/tasks/${taskA}/dependencies`, { token: tokA, body: { depends_on_id: taskB } })).status === 409);
  check('self dependency -> 400', (await call('POST', `/tasks/${taskA}/dependencies`, { token: tokA, body: { depends_on_id: taskA } })).status === 400);

  const projB = await call('POST', '/projects', { token: tokB, body: { title: `${TAG} Project B`, start_date: '2026-01-01', end_date: '2026-12-31' } });
  const taskInB = await call('POST', '/tasks', { token: tokB, body: { project_id: projB.data.id, title: 'Other', deadline: '2026-06-01', effort_hours: 3 } });
  check('cross-project dependency -> 400',
    (await call('POST', `/tasks/${taskA}/dependencies`, { token: tokA, body: { depends_on_id: taskInB.data.id } })).status === 400);

  console.log('\n=== MCO SCHEDULING ===');
  await call('PUT', '/developers/profile', { token: devs.chloe.token, body: { skill_vector: { PostgreSQL: 5 } } });

  const gen = await call('POST', `/schedule/generate/${pid}`, {
    token: tokA, body: { weights: { w1: 0.3, w2: 0.25, w3: 0.2, w4: 0.15, w5: 0.1 } },
  });
  check('generate schedule -> 200', gen.status === 200, JSON.stringify(gen.data)?.slice(0, 160));
  check('all tasks scheduled', gen.data?.schedule?.length === 2);
  check('weights normalized to 1', Math.abs(Object.values(gen.data?.weights || {}).reduce((a, b) => a + b, 0) - 1) < 1e-9);
  check('blocked task sorted last', gen.data?.schedule?.at(-1)?.is_blocked === true);
  check('score_breakdown present', !!gen.data?.schedule?.[0]?.score_breakdown);
  check('manual assignment preserved by the engine', gen.data?.schedule?.find((t) => t.id === taskA)?.assigned_developer?.id === devs.bob.id);
  check('unassigned task matched on skills', gen.data?.schedule?.find((t) => t.id === taskB)?.assigned_developer?.id === devs.chloe.id);

  const saved = await call('GET', `/schedule/${pid}`, { token: tokA });
  check('saved schedule retrievable -> 200', saved.status === 200);
  check('saved schedule_data intact', saved.data?.schedule_data?.length === 2);
  check('member developer can view schedule', (await call('GET', `/schedule/${pid}`, { token: devs.ada.token })).status === 200);
  check('other manager cannot view schedule -> 403', (await call('GET', `/schedule/${pid}`, { token: tokB })).status === 403);
  check('other manager cannot generate -> 403', (await call('POST', `/schedule/generate/${pid}`, { token: tokB })).status === 403);
  check('developer cannot generate -> 403', (await call('POST', `/schedule/generate/${pid}`, { token: devs.ada.token })).status === 403);
  check('no schedule yet -> 404', (await call('GET', '/schedule/99999999', { token: tokA })).status === 404);

  console.log('\n=== ROLE ENFORCEMENT (403, not just hidden buttons) ===');
  check('developer cannot create task', (await call('POST', '/tasks', { token: devs.ada.token, body: { project_id: pid, title: 'x', deadline: '2026-05-01', effort_hours: 4 } })).status === 403);
  check('developer cannot delete task', (await call('DELETE', `/tasks/${taskB}`, { token: devs.ada.token })).status === 403);
  check('developer cannot create project', (await call('POST', '/projects', { token: devs.ada.token, body: { title: 'x', start_date: '2026-01-01', end_date: '2026-02-01' } })).status === 403);
  check('developer cannot list developers', (await call('GET', '/developers', { token: devs.ada.token })).status === 403);
  check('developer cannot read management overview', (await call('GET', '/developers/management', { token: devs.ada.token })).status === 403);
  check('developer cannot reach admin', (await call('GET', '/admin/stats', { token: devs.ada.token })).status === 403);
  check('manager cannot reach admin', (await call('GET', '/admin/users', { token: tokA })).status === 403);
  check('manager CAN read management overview', (await call('GET', '/developers/management', { token: tokA })).status === 200);
  check('manager CAN list developers', (await call('GET', '/developers', { token: tokA })).status === 200);

  console.log('\n=== DEVELOPER PROFILE ===');
  check('developer updates own profile', (await call('PUT', '/developers/profile', { token: devs.ada.token, body: { skill_vector: { React: 5 } } })).status === 200);
  check('profile persisted', (await call('GET', '/developers/profile', { token: devs.ada.token })).data?.skill_vector?.React === 5);

  console.log('\n=== DELETE ===');
  check('manager deletes own task', (await call('DELETE', `/tasks/${taskA}`, { token: tokA })).status === 200);
  check('delete missing task -> 404', (await call('DELETE', '/tasks/99999999', { token: tokA })).status === 404);

  console.log('\n=== CORS ===');
  const pre = await fetch(`${BASE}/auth/login`, {
    method: 'OPTIONS',
    headers: { Origin: ORIGIN, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' },
  });
  check('preflight from allowed origin -> 204', pre.status === 204, `got ${pre.status}`);
  check('allow-origin echoed', pre.headers.get('access-control-allow-origin') === ORIGIN);
  const evil = await fetch(`${BASE}/auth/login`, {
    method: 'OPTIONS', headers: { Origin: 'http://evil.example.com', 'Access-Control-Request-Method': 'POST' },
  });
  check('unknown origin blocked', evil.status === 403, `got ${evil.status}`);

  console.log('\n=== MANAGER SIGNUP LOCKDOWN ===');
  if (process.env.MANAGER_SIGNUP_CODE) {
    check('manager signup without a code -> 403',
      (await call('POST', '/auth/register', { body: { full_name: 'X', email: `${TAG}_nocode@example.com`, password: PW, role: 'manager' } })).status === 403);
    check('manager signup with a wrong code -> 403',
      (await call('POST', '/auth/register', { body: { full_name: 'X', email: `${TAG}_badcode@example.com`, password: PW, role: 'manager', manager_code: 'wrong-code' } })).status === 403);
    const good = await call('POST', '/auth/register', {
      body: { full_name: 'E2E Coded Manager', email: `${TAG}_goodcode@example.com`, password: PW, role: 'manager', manager_code: process.env.MANAGER_SIGNUP_CODE },
    });
    check('manager signup with the correct code -> 201', good.status === 201, `got ${good.status}`);
    check('developer signup still needs no code -> 201',
      (await call('POST', '/auth/register', { body: { full_name: 'X', email: `${TAG}_devnocode@example.com`, password: PW, role: 'developer' } })).status === 201);
  } else {
    console.log('  SKIP  MANAGER_SIGNUP_CODE not set for this run');
  }

  console.log('\n=== PASSWORD RESET ===');
  const resetEmail = `${TAG}_ada@example.com`;

  const unknown = await call('POST', '/auth/forgot-password', { body: { email: `${TAG}_nosuchuser@example.com` } });
  check('forgot-password for unknown email -> 200 (no user enumeration)', unknown.status === 200, `got ${unknown.status}`);

  const known = await call('POST', '/auth/forgot-password', { body: { email: resetEmail } });
  check('forgot-password for known email -> 200', known.status === 200);
  check('both replies are byte-identical', JSON.stringify(known.data) === JSON.stringify(unknown.data));

  const issued = await pool.query(
    `SELECT COUNT(*)::int AS n FROM password_reset_tokens prt
     JOIN users u ON u.id = prt.user_id WHERE LOWER(u.email) = $1`,
    [resetEmail.toLowerCase()]
  );
  check('a reset token row was created', issued.rows[0].n >= 1, `${issued.rows[0].n} rows`);

  const stored = await pool.query(
    `SELECT prt.token_hash FROM password_reset_tokens prt
     JOIN users u ON u.id = prt.user_id WHERE LOWER(u.email) = $1 LIMIT 1`,
    [resetEmail.toLowerCase()]
  );
  check('only a hash is stored, never the raw token', /^[a-f0-9]{64}$/.test(stored.rows[0].token_hash));

  check('reset with a bogus token -> 400',
    (await call('POST', '/auth/reset-password', { body: { token: 'not-a-real-token', password: 'BrandNewPass1' } })).status === 400);

  // Plant a token we know the plaintext of, since the real one only goes by email.
  const raw = crypto.randomBytes(32).toString('hex');
  const userRow = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [resetEmail.toLowerCase()]);
  await pool.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
    [userRow.rows[0].id, crypto.createHash('sha256').update(raw).digest('hex')]
  );

  check('reset with a valid token but short password -> 400',
    (await call('POST', '/auth/reset-password', { body: { token: raw, password: 'abc' } })).status === 400);

  const NEW_PW = 'BrandNewPass1';
  check('reset with a valid token -> 200',
    (await call('POST', '/auth/reset-password', { body: { token: raw, password: NEW_PW } })).status === 200);
  check('the new password works',
    (await call('POST', '/auth/login', { body: { email: resetEmail, password: NEW_PW } })).status === 200);
  check('the old password no longer works',
    (await call('POST', '/auth/login', { body: { email: resetEmail, password: PW } })).status === 401);
  check('the token cannot be reused -> 400',
    (await call('POST', '/auth/reset-password', { body: { token: raw, password: 'AnotherPass99' } })).status === 400);

  const expired = crypto.randomBytes(32).toString('hex');
  await pool.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() - INTERVAL '1 minute')`,
    [userRow.rows[0].id, crypto.createHash('sha256').update(expired).digest('hex')]
  );
  check('an expired token is rejected -> 400',
    (await call('POST', '/auth/reset-password', { body: { token: expired, password: 'AnotherPass99' } })).status === 400);

  console.log('\n=== LOGIN RATE LIMIT (last: consumes the quota) ===');
  let limited = false;
  for (let i = 0; i < 14 && !limited; i++) {
    const r = await call('POST', '/auth/login', { body: { email: `${TAG}_rl@example.com`, password: 'WrongPass!!' } });
    limited = r.status === 429;
  }
  check('brute force eventually -> 429', limited);
  check('other accounts unaffected', (await call('POST', '/auth/login', { body: { email: `${TAG}_mgra@example.com`, password: PW } })).status === 200);
}

async function cleanup() {
  console.log('\n=== CLEANUP ===');
  await pool.query('DELETE FROM projects WHERE title LIKE $1', [`${TAG}%`]);
  const r = await pool.query('DELETE FROM users WHERE email LIKE $1', [`${TAG}%`]);
  console.log(`  removed ${r.rowCount} test users and their projects/tasks`);
}

run()
  .then(cleanup)
  .then(async () => {
    await pool.end();
    if (failures.length) {
      console.log('\nFAILURES:');
      failures.forEach((f) => console.log('  - ' + f));
    }
    console.log(`\n==== ${pass} passed, ${failures.length} failed ====\n`);
    process.exit(failures.length === 0 ? 0 : 1);
  })
  .catch(async (err) => {
    console.error('\nE2E ERROR:', err);
    try { await cleanup(); } catch { /* best effort */ }
    await pool.end();
    process.exit(1);
  });
