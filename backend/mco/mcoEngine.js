function cosineSimilarity(vectorA, vectorB) {
  const allSkills = new Set([
    ...Object.keys(vectorA),
    ...Object.keys(vectorB)
  ]);
  let dotProduct = 0, magA = 0, magB = 0;

  allSkills.forEach(skill => {
    const a = vectorA[skill] || 0;
    const b = vectorB[skill] || 0;
    dotProduct += a * b;
    magA += a * a;
    magB += b * b;
  });

  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
}

function runMCO(tasks, developers, weights, projectMeta) {
  const {
    w1 = 0.30,
    w2 = 0.25,
    w3 = 0.20,
    w4 = 0.15,
    w5 = 0.10
  } = weights;

  const today = new Date();
  const projectEnd = new Date(projectMeta.end_date);
  const projectStart = new Date(projectMeta.start_date);
  const maxDays = Math.max(
    (projectEnd - projectStart) / (1000 * 60 * 60 * 24), 1
  );
  const maxEffort = Math.max(...tasks.map(t => t.effort_hours), 1);

  const scoredTasks = tasks.map(task => {
    // C1: Deadline Urgency
    const daysLeft = (new Date(task.deadline) - today) / (1000 * 60 * 60 * 24);
    const U = Math.max(0, Math.min(1, 1 - (daysLeft / maxDays)));

    // C3: Dependency Status
    const deps = task.dependencies || [];
    const total = deps.length;
    const completed = deps.filter(d => d.status === 'done').length;
    const D = total === 0 ? 1.0 : completed / total;

    // C4: Business Value
    const V = ((task.business_value || 5) - 1) / 9;

    // C5: Effort Efficiency
    const E = 1 - (task.effort_hours / maxEffort);

    // C2: Best Developer Skill Match
    let bestDev = null;
    let bestSkillScore = 0;

    developers.forEach(dev => {
      const skillVector = dev.skill_vector || {};
      const requiredSkills = task.required_skills || {};
      const S = cosineSimilarity(requiredSkills, skillVector);
      if (S > bestSkillScore) {
        bestSkillScore = S;
        bestDev = dev;
      }
    });

    const S = bestSkillScore;
    const P = w1 * U + w2 * S + w3 * D + w4 * V + w5 * E;

    return {
      ...task,
      priority_score: parseFloat(P.toFixed(4)),
      assigned_developer: bestDev,
      score_breakdown: {
        deadline_urgency: parseFloat(U.toFixed(4)),
        skill_match: parseFloat(S.toFixed(4)),
        dependency_status: parseFloat(D.toFixed(4)),
        business_value: parseFloat(V.toFixed(4)),
        effort_efficiency: parseFloat(E.toFixed(4))
      },
      is_blocked: D === 0 && total > 0
    };
  });

  const active = scoredTasks
    .filter(t => !t.is_blocked)
    .sort((a, b) => b.priority_score - a.priority_score);
  const blocked = scoredTasks.filter(t => t.is_blocked);

  return [...active, ...blocked];
}

module.exports = { runMCO, cosineSimilarity };