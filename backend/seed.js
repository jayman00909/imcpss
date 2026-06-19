const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // ─── USERS ───────────────────────────────────────────────
    console.log('Creating users...');

    const managerHash = await bcrypt.hash('password123', 10);
    const dev1Hash = await bcrypt.hash('password123', 10);
    const dev2Hash = await bcrypt.hash('password123', 10);
    const dev3Hash = await bcrypt.hash('password123', 10);

    // Clear existing seed data cleanly
    await pool.query(`DELETE FROM users WHERE email IN (
      'manager@imcpss.com','ada@imcpss.com','bob@imcpss.com','chloe@imcpss.com'
    )`);

    const managerRes = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1,$2,$3,$4) RETURNING id`,
      ['Dr. Ariyo Manager', 'manager@imcpss.com', managerHash, 'manager']
    );
    const managerId = managerRes.rows[0].id;

    const ada = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1,$2,$3,$4) RETURNING id`,
      ['Ada Frontend', 'ada@imcpss.com', dev1Hash, 'developer']
    );
    const adaId = ada.rows[0].id;

    const bob = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1,$2,$3,$4) RETURNING id`,
      ['Bob Backend', 'bob@imcpss.com', dev2Hash, 'developer']
    );
    const bobId = bob.rows[0].id;

    const chloe = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1,$2,$3,$4) RETURNING id`,
      ['Chloe Fullstack', 'chloe@imcpss.com', dev3Hash, 'developer']
    );
    const chloeId = chloe.rows[0].id;

    // ─── DEVELOPER SKILL PROFILES ────────────────────────────
    console.log('Creating skill profiles...');

    // Ada: strong frontend
    await pool.query(
      `INSERT INTO developer_profiles (user_id, skill_vector)
       VALUES ($1,$2) ON CONFLICT (user_id) DO UPDATE SET skill_vector=$2`,
      [adaId, JSON.stringify({
        React: 5, JavaScript: 5, CSS: 4,
        'UI/UX Design': 4, Testing: 2,
        'Node.js': 1, PostgreSQL: 1
      })]
    );

    // Bob: strong backend
    await pool.query(
      `INSERT INTO developer_profiles (user_id, skill_vector)
       VALUES ($1,$2) ON CONFLICT (user_id) DO UPDATE SET skill_vector=$2`,
      [bobId, JSON.stringify({
        'Node.js': 5, PostgreSQL: 5, 'API Development': 5,
        Python: 4, Testing: 3,
        React: 1, JavaScript: 3
      })]
    );

    // Chloe: balanced fullstack
    await pool.query(
      `INSERT INTO developer_profiles (user_id, skill_vector)
       VALUES ($1,$2) ON CONFLICT (user_id) DO UPDATE SET skill_vector=$2`,
      [chloeId, JSON.stringify({
        React: 3, JavaScript: 4, 'Node.js': 4,
        PostgreSQL: 3, 'API Development': 3,
        CSS: 3, Testing: 4, DevOps: 3
      })]
    );

    // ─── PROJECT ─────────────────────────────────────────────
    console.log('Creating project...');

    const projRes = await pool.query(
      `INSERT INTO projects (title, description, start_date, end_date, manager_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [
        'IMCPSS Web Platform',
        'Full development of the Intelligent Multi-Criteria Project Scheduling System as a final year research project at Osun State University.',
        '2026-01-01',
        '2026-08-31',
        managerId
      ]
    );
    const projectId = projRes.rows[0].id;

    // Add all developers to project
    for (const devId of [adaId, bobId, chloeId]) {
      await pool.query(
        `INSERT INTO project_members (project_id, user_id)
         VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [projectId, devId]
      );
    }

    // ─── TASKS ───────────────────────────────────────────────
    console.log('Creating tasks...');

    const today = new Date();
    const daysFromNow = (n) => {
      const d = new Date(today);
      d.setDate(d.getDate() + n);
      return d.toISOString().split('T')[0];
    };

    const tasks = [
      {
        title: 'Design System & UI Components',
        description: 'Create reusable Ant Design component library, colour tokens, and typography system for the entire application.',
        deadline: daysFromNow(5),
        effort_hours: 12,
        business_value: 8,
        required_skills: { React: 4, CSS: 4, 'UI/UX Design': 5, JavaScript: 3 },
        status: 'done'
      },
      {
        title: 'Database Schema Design',
        description: 'Design and implement all PostgreSQL tables, foreign key relationships, indexes, and constraints.',
        deadline: daysFromNow(3),
        effort_hours: 8,
        business_value: 10,
        required_skills: { PostgreSQL: 5, 'API Development': 3 },
        status: 'done'
      },
      {
        title: 'JWT Authentication System',
        description: 'Build user registration, login, JWT token generation, and middleware for protected routes.',
        deadline: daysFromNow(7),
        effort_hours: 10,
        business_value: 10,
        required_skills: { 'Node.js': 5, 'API Development': 4, PostgreSQL: 3, JavaScript: 3 },
        status: 'in_review'
      },
      {
        title: 'React Frontend Architecture',
        description: 'Set up React + Vite project, Redux store, React Router, Axios API service layer and folder structure.',
        deadline: daysFromNow(6),
        effort_hours: 6,
        business_value: 9,
        required_skills: { React: 5, JavaScript: 5, 'Node.js': 2 },
        status: 'done'
      },
      {
        title: 'MCO Algorithm Engine',
        description: 'Implement the Weighted Sum Method MCO engine with cosine similarity skill matching and dependency-aware scheduling.',
        deadline: daysFromNow(10),
        effort_hours: 20,
        business_value: 10,
        required_skills: { JavaScript: 5, 'Node.js': 4, 'API Development': 3 },
        status: 'in_progress'
      },
      {
        title: 'Kanban Board UI',
        description: 'Build drag-and-drop Kanban board with four status columns and real-time status update capability.',
        deadline: daysFromNow(14),
        effort_hours: 14,
        business_value: 7,
        required_skills: { React: 5, JavaScript: 4, CSS: 3, 'UI/UX Design': 3 },
        status: 'in_progress'
      },
      {
        title: 'Gantt Chart Visualisation',
        description: 'Implement horizontal bar chart schedule view using Chart.js showing tasks ranked by MCO priority score.',
        deadline: daysFromNow(18),
        effort_hours: 10,
        business_value: 8,
        required_skills: { React: 4, JavaScript: 4, CSS: 2, 'UI/UX Design': 3 },
        status: 'todo'
      },
      {
        title: 'REST API — Projects & Tasks',
        description: 'Build complete CRUD REST API endpoints for projects, tasks, dependencies, and team membership management.',
        deadline: daysFromNow(8),
        effort_hours: 16,
        business_value: 10,
        required_skills: { 'Node.js': 5, 'API Development': 5, PostgreSQL: 4 },
        status: 'in_review'
      },
      {
        title: 'Performance Reports Module',
        description: 'Build analytics dashboard showing deadline compliance rate, developer load distribution, and MCO score histograms.',
        deadline: daysFromNow(25),
        effort_hours: 12,
        business_value: 6,
        required_skills: { React: 3, JavaScript: 4, 'API Development': 3, PostgreSQL: 3 },
        status: 'todo'
      },
      {
        title: 'System Testing & Evaluation',
        description: 'Conduct usability testing with 5 participants, compare MCO vs FCFS vs Greedy algorithms, document results for Chapter 4.',
        deadline: daysFromNow(30),
        effort_hours: 24,
        business_value: 9,
        required_skills: { Testing: 5, JavaScript: 3, 'API Development': 2 },
        status: 'todo'
      },
    ];

    const taskIds = [];
    for (const task of tasks) {
      const res = await pool.query(
        `INSERT INTO tasks
           (project_id, title, description, deadline, effort_hours,
            business_value, required_skills, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [
          projectId, task.title, task.description, task.deadline,
          task.effort_hours, task.business_value,
          JSON.stringify(task.required_skills), task.status
        ]
      );
      taskIds.push(res.rows[0].id);
    }

    // ─── TASK DEPENDENCIES ───────────────────────────────────
    console.log('Creating dependencies...');

    // Kanban UI depends on React Frontend Architecture
    await pool.query(
      `INSERT INTO task_dependencies (task_id, depends_on_id)
       VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [taskIds[5], taskIds[3]]
    );

    // Gantt Chart depends on MCO Algorithm Engine
    await pool.query(
      `INSERT INTO task_dependencies (task_id, depends_on_id)
       VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [taskIds[6], taskIds[4]]
    );

    // Performance Reports depends on REST API
    await pool.query(
      `INSERT INTO task_dependencies (task_id, depends_on_id)
       VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [taskIds[8], taskIds[7]]
    );

    // System Testing depends on MCO Engine
    await pool.query(
      `INSERT INTO task_dependencies (task_id, depends_on_id)
       VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [taskIds[9], taskIds[4]]
    );

    console.log('');
    console.log('✅ Seed complete! Here are your test login credentials:');
    console.log('');
    console.log('  Manager  →  manager@imcpss.com  /  password123');
    console.log('  Developer 1 (Ada, Frontend)   →  ada@imcpss.com  /  password123');
    console.log('  Developer 2 (Bob, Backend)    →  bob@imcpss.com  /  password123');
    console.log('  Developer 3 (Chloe, Fullstack) →  chloe@imcpss.com  /  password123');
    console.log('');
    console.log('  Project: IMCPSS Web Platform');
    console.log('  Tasks: 10 tasks with realistic deadlines and skill requirements');
    console.log('  Dependencies: 4 task dependencies set up');
    console.log('');

  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await pool.end();
  }
}

seed();