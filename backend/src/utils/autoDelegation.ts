// Auto delegation logic for assigning tasks to team members

import type { PromptTask } from "../types/prompt";

type AssigneeType = {
  name: string;
  email: string;
  role: string;
};

/**
 * Simple text similarity using word overlap
 */
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Infers skillset from role name using natural language interpretation
 */
function inferSkillsetFromRole(role: string): string[] {
  const roleLower = role.toLowerCase();
  const skillsets: string[] = [];

  // Common role to skillset mappings
  const roleKeywords = {
    // Management & Planning (high priority for requirements/planning tasks)
    'manager': ['management', 'planning', 'coordination', 'leadership', 'organization', 'requirements', 'strategy'],
    'product': ['product', 'requirements', 'planning', 'strategy', 'roadmap', 'analysis', 'features'],
    'pm': ['product', 'requirements', 'planning', 'strategy', 'management', 'coordination'],
    'project': ['planning', 'coordination', 'management', 'requirements', 'organization'],
    '기획': ['planning', 'requirements', 'strategy', 'product', 'management', 'analysis'],
    'planner': ['planning', 'requirements', 'strategy', 'organization'],

    // Analysis
    'analyst': ['analysis', 'research', 'data', 'insights', 'reporting', 'requirements'],
    'ba': ['analysis', 'requirements', 'planning', 'business', 'documentation'],
    '분석가': ['analysis', 'research', 'requirements', 'insights'],

    // Development
    'developer': ['coding', 'programming', 'development', 'technical', 'implementation'],
    'engineer': ['coding', 'programming', 'development', 'technical', 'implementation', 'architecture'],
    'frontend': ['frontend', 'ui', 'web', 'javascript', 'react', 'css', 'development'],
    'backend': ['backend', 'server', 'api', 'database', 'architecture', 'development'],
    'fullstack': ['frontend', 'backend', 'web', 'development', 'full-stack'],
    '개발자': ['coding', 'programming', 'development', 'technical', 'implementation'],

    // Design
    'designer': ['design', 'ui', 'ux', 'visual', 'graphics', 'creative'],
    '디자이너': ['design', 'ui', 'ux', 'visual', 'creative'],

    // Marketing & Sales
    'marketing': ['marketing', 'promotion', 'content', 'advertising', 'communication'],
    'sales': ['sales', 'business', 'client', 'revenue', 'negotiation'],

    // QA & Testing
    'qa': ['testing', 'quality', 'validation', 'verification', 'bug'],
    'tester': ['testing', 'quality', 'qa', 'validation'],

    // DevOps
    'devops': ['deployment', 'infrastructure', 'automation', 'ci/cd', 'operations'],
    'ops': ['operations', 'deployment', 'infrastructure', 'maintenance'],

    // Data
    'data': ['data', 'analytics', 'analysis', 'statistics', 'insights'],

    // Writing
    'writer': ['writing', 'content', 'documentation', 'communication', 'creative'],
    'technical writer': ['writing', 'documentation', 'technical writing', 'communication'],
  };

  // Check for keyword matches
  Object.entries(roleKeywords).forEach(([keyword, skills]) => {
    if (roleLower.includes(keyword)) {
      skillsets.push(...skills);
    }
  });

  // If no matches, use the role itself as a skill
  if (skillsets.length === 0) {
    skillsets.push(roleLower);
  }

  return [...new Set(skillsets)]; // Remove duplicates
}

/**
 * Infers required skillset from task name, description, and output
 */
function inferRequiredSkillset(task: PromptTask): string[] {
  const combined = `${task.name} ${task.description} ${task.output.join(' ')}`.toLowerCase();
  const skillsets: string[] = [];

  // Common task keywords to skillset mappings (English + Korean)
  const taskKeywords = {
    // Design
    'design': ['design', 'ui', 'ux', 'visual', 'creative'],
    '디자인': ['design', 'ui', 'ux', 'visual', 'creative'],
    'ui': ['frontend', 'ui', 'design'],
    'ux': ['ux', 'design', 'user experience'],
    '인터페이스': ['frontend', 'ui', 'design'],
    '화면': ['frontend', 'ui', 'design'],

    // Development
    'code': ['coding', 'programming', 'development', 'technical'],
    'develop': ['coding', 'programming', 'development', 'technical'],
    '개발': ['coding', 'programming', 'development', 'technical'],
    'implement': ['coding', 'programming', 'development', 'technical', 'implementation'],
    '구현': ['coding', 'programming', 'development', 'technical', 'implementation'],
    '프로그래밍': ['coding', 'programming', 'development', 'technical'],

    // Testing
    'test': ['testing', 'quality', 'qa', 'verification'],
    '테스트': ['testing', 'quality', 'qa', 'verification'],
    '검증': ['testing', 'quality', 'qa', 'verification'],
    'qa': ['testing', 'quality', 'qa', 'verification'],

    // Documentation
    'write': ['writing', 'content', 'documentation', 'communication'],
    'document': ['writing', 'documentation', 'technical writing'],
    '문서': ['writing', 'documentation', 'technical writing'],
    '작성': ['writing', 'content', 'documentation'],

    // Analysis
    'analyze': ['analysis', 'data', 'research', 'insights'],
    '분석': ['analysis', 'data', 'research', 'insights'],
    'research': ['research', 'analysis', 'investigation'],
    '조사': ['research', 'analysis', 'investigation'],
    '연구': ['research', 'analysis', 'investigation'],

    // Planning
    'plan': ['planning', 'strategy', 'organization', 'management'],
    '계획': ['planning', 'strategy', 'organization', 'management'],
    '기획': ['planning', 'strategy', 'organization', 'management'],
    'manage': ['management', 'coordination', 'leadership'],
    '관리': ['management', 'coordination', 'leadership'],

    // Marketing
    'market': ['marketing', 'promotion', 'communication'],
    '마케팅': ['marketing', 'promotion', 'communication'],
    '홍보': ['marketing', 'promotion', 'communication'],

    // Deployment
    'deploy': ['deployment', 'devops', 'infrastructure'],
    '배포': ['deployment', 'devops', 'infrastructure'],
    '운영': ['deployment', 'devops', 'infrastructure', 'operations'],
    '유지보수': ['maintenance', 'operations', 'support'],

    // Backend/API
    'api': ['backend', 'api', 'development'],
    'backend': ['backend', 'server', 'api'],
    '백엔드': ['backend', 'server', 'api'],
    '서버': ['backend', 'server', 'api'],
    'database': ['backend', 'database', 'data'],
    '데이터베이스': ['backend', 'database', 'data'],

    // Frontend
    'frontend': ['frontend', 'ui', 'web'],
    '프론트엔드': ['frontend', 'ui', 'web'],
    '웹': ['frontend', 'web', 'development'],

    // AI/ML
    'ai': ['ai', 'machine learning', 'data', 'model'],
    'ml': ['machine learning', 'ai', 'data', 'model'],
    '인공지능': ['ai', 'machine learning', 'data', 'model'],
    '모델': ['ai', 'machine learning', 'data', 'model'],
    '학습': ['machine learning', 'ai', 'training'],
    '머신러닝': ['machine learning', 'ai', 'data'],

    // Requirements
    '요구사항': ['analysis', 'planning', 'requirements', 'management'],
    '정의': ['analysis', 'planning', 'requirements'],
    '기능': ['development', 'implementation', 'features'],

    // Integration
    '연동': ['integration', 'api', 'development', 'backend'],
  };

  // Check for keyword matches
  Object.entries(taskKeywords).forEach(([keyword, skills]) => {
    if (combined.includes(keyword)) {
      skillsets.push(...skills);
    }
  });

  // If no matches, extract meaningful words
  if (skillsets.length === 0) {
    const words = combined.split(/\s+/).filter(w => w.length > 3);
    skillsets.push(...words.slice(0, 5)); // Take first 5 meaningful words
  }

  return [...new Set(skillsets)]; // Remove duplicates
}

/**
 * Calculates match score between assignee and task
 */
function calculateMatchScore(
  assignee: AssigneeType,
  task: PromptTask
): number {
  const assigneeSkills = inferSkillsetFromRole(assignee.role);
  const requiredSkills = inferRequiredSkillset(task);

  // Calculate average similarity across all skill combinations
  let totalSimilarity = 0;
  let count = 0;

  assigneeSkills.forEach(assigneeSkill => {
    requiredSkills.forEach(requiredSkill => {
      totalSimilarity += calculateSimilarity(assigneeSkill, requiredSkill);
      count++;
    });
  });

  return count > 0 ? totalSimilarity / count : 0;
}

/**
 * Auto delegates unassigned tasks to team members
 * @param forceReassign - If true, reassign all tasks including already assigned ones
 */
export function autoDelegateTasks(
  tasks: PromptTask[],
  assigneeList: AssigneeType[],
  forceReassign: boolean = false
): PromptTask[] {
  if (assigneeList.length === 0) {
    return tasks.map(task => ({
      ...task,
      notes: task.assignee.status === 'unassigned'
        ? (task.notes || '') + '\n[Auto Delegate] No assignees available.'
        : task.notes,
    }));
  }

  return tasks.map((task, index) => {
    // Skip already assigned tasks unless forceReassign is true
    if (task.assignee.status === 'assigned' && !forceReassign) {
      return task;
    }

    // Remove previous auto-delegate notes when reassigning
    let cleanNotes = task.notes || '';
    if (forceReassign) {
      cleanNotes = cleanNotes
        .split('\n')
        .filter(line => !line.includes('[Auto Delegate]'))
        .join('\n')
        .trim();
    }

    // Debug: Log required skillset
    const requiredSkills = inferRequiredSkillset(task);
    console.log(`[Auto-Delegate] Task ${index + 1}: "${task.name}"`);
    console.log(`  Required skills:`, requiredSkills);

    // Calculate match scores for all assignees
    const scores = assigneeList.map(assignee => {
      const score = calculateMatchScore(assignee, task);
      const assigneeSkills = inferSkillsetFromRole(assignee.role);
      console.log(`  - ${assignee.name} (${assignee.role}):`, { skills: assigneeSkills, score: score.toFixed(3) });
      return { assignee, score };
    });

    // Sort by score (descending), then by name (ascending)
    // But apply role priority for planning/requirements tasks
    const isPlanningTask = requiredSkills.some(skill =>
      ['planning', 'requirements', 'analysis', 'strategy', 'management'].includes(skill)
    );

    scores.sort((a, b) => {
      // For planning/requirements tasks, prioritize PM/Manager roles
      if (isPlanningTask) {
        const aIsPM = a.assignee.role.toLowerCase().match(/manager|product|pm|기획|planner|analyst|ba/);
        const bIsPM = b.assignee.role.toLowerCase().match(/manager|product|pm|기획|planner|analyst|ba/);

        if (aIsPM && !bIsPM) return -1;
        if (!aIsPM && bIsPM) return 1;
      }

      // Otherwise sort by score
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.assignee.name.localeCompare(b.assignee.name);
    });

    console.log(`  → Best match: ${scores[0].assignee.name} (score: ${scores[0].score.toFixed(3)})`);

    const bestMatch = scores[0];

    // Always assign to best match, even with low confidence
    // This ensures all tasks get assigned when auto-delegate is triggered
    const confidence = (bestMatch.score * 100).toFixed(0);
    const confidenceLabel = bestMatch.score < 0.05 ? 'low confidence - please review' : `${confidence}% confidence`;
    const newNote = `[Auto Delegate] Assigned to ${bestMatch.assignee.name} (${confidenceLabel})`;

    return {
      ...task,
      assignee: {
        name: bestMatch.assignee.name,
        email: bestMatch.assignee.email,
        role: bestMatch.assignee.role,
        status: 'assigned' as const,
      },
      notes: cleanNotes ? `${cleanNotes}\n${newNote}` : newNote,
    };
  });
}

/**
 * Checks if there are any unassigned tasks
 */
export function hasUnassignedTasks(tasks: PromptTask[]): boolean {
  return tasks.some(task => task.assignee.status === 'unassigned');
}
