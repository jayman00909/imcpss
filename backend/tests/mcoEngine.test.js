const assert = require('assert');
const { cosineSimilarity, normalizeWeights, runMCO } = require('../mco/mcoEngine');

const projectMeta = {
  start_date: '2026-01-01',
  end_date: '2026-12-31',
};

function makeTask(id, overrides = {}) {
  return {
    id,
    title: `Task ${id}`,
    status: 'todo',
    deadline: '2026-08-01',
    effort_hours: 8,
    business_value: 5,
    required_skills: { react: 1 },
    dependencies: [],
    ...overrides,
  };
}

const developers = [
  { id: 1, full_name: 'Frontend Developer', skill_vector: { react: 1, node: 0.2 } },
  { id: 2, full_name: 'Backend Developer', skill_vector: { node: 1, postgres: 0.8 } },
];

assert.strictEqual(cosineSimilarity({ react: 1 }, { react: 1 }), 1);
assert.strictEqual(cosineSimilarity('{"react":1}', '{"react":1}'), 1);

const normalized = normalizeWeights({ w1: 3, w2: 2, w3: 2, w4: 2, w5: 1 });
assert.strictEqual(
  Number(Object.values(normalized).reduce((sum, value) => sum + value, 0).toFixed(6)),
  1
);

const ordered = runMCO(
  [
    makeTask(2, { dependencies: [{ id: 1, status: 'todo' }], business_value: 10 }),
    makeTask(1, { business_value: 3 }),
  ],
  developers,
  {},
  projectMeta
);
assert.deepStrictEqual(ordered.map((task) => task.id), [1, 2]);
assert.strictEqual(ordered[1].is_blocked, true);

const cyclic = runMCO(
  [
    makeTask(1, { dependencies: [{ id: 2, status: 'todo' }] }),
    makeTask(2, { dependencies: [{ id: 1, status: 'todo' }] }),
  ],
  developers,
  {},
  projectMeta
);
assert.strictEqual(cyclic.every((task) => task.is_blocked), true);

const perfTasks = Array.from({ length: 500 }, (_, index) =>
  makeTask(index + 1, {
    effort_hours: (index % 40) + 1,
    business_value: (index % 10) + 1,
    required_skills: index % 2 === 0 ? { react: 1 } : { node: 1 },
    deadline: `2026-08-${String((index % 28) + 1).padStart(2, '0')}`,
  })
);
const startedAt = Date.now();
const perfSchedule = runMCO(perfTasks, developers, {}, projectMeta);
const elapsedMs = Date.now() - startedAt;

assert.strictEqual(perfSchedule.length, 500);
assert(elapsedMs < 2000, `Expected 500-task schedule under 2000ms, got ${elapsedMs}ms`);

console.log(`MCO tests passed. 500-task schedule completed in ${elapsedMs}ms.`);
