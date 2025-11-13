// Auto delegation logic for assigning tasks to team members

import type { PromptTask } from "../types/prompt";
import type { AssigneeType } from "../types/workspace";

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
    'developer': ['coding', 'programming', 'development', 'technical', 'implementation'],
    'engineer': ['coding', 'programming', 'development', 'technical', 'implementation', 'architecture'],
    'designer': ['design', 'ui', 'ux', 'visual', 'graphics', 'creative'],
    'manager': ['management', 'planning', 'coordination', 'leadership', 'organization'],
    'product': ['product', 'requirements', 'planning', 'strategy', 'roadmap'],
    'marketing': ['marketing', 'promotion', 'content', 'advertising', 'communication'],
    'sales': ['sales', 'business', 'client', 'revenue', 'negotiation'],
    'qa': ['testing', 'quality', 'validation', 'verification', 'bug'],
    'devops': ['deployment', 'infrastructure', 'automation', 'ci/cd', 'operations'],
    'data': ['data', 'analytics', 'analysis', 'statistics', 'insights'],
    'frontend': ['frontend', 'ui', 'web', 'javascript', 'react', 'css'],
    'backend': ['backend', 'server', 'api', 'database', 'architecture'],
    'fullstack': ['frontend', 'backend', 'web', 'development', 'full-stack'],
    'writer': ['writing', 'content', 'documentation', 'communication', 'creative'],
    'analyst': ['analysis', 'research', 'data', 'insights', 'reporting'],
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
 * Infers required skillset from task name and output
 */
function inferRequiredSkillset(task: PromptTask): string[] {
  const combined = `${task.name} ${task.output.join(' ')}`.toLowerCase();
  const skillsets: string[] = [];

  // Common task keywords to skillset mappings
  const taskKeywords = {
    'design': ['design', 'ui', 'ux', 'visual', 'creative'],
    'code': ['coding', 'programming', 'development', 'technical'],
    'develop': ['coding', 'programming', 'development', 'technical'],
    'implement': ['coding', 'programming', 'development', 'technical', 'implementation'],
    'test': ['testing', 'quality', 'qa', 'verification'],
    'write': ['writing', 'content', 'documentation', 'communication'],
    'document': ['writing', 'documentation', 'technical writing'],
    'analyze': ['analysis', 'data', 'research', 'insights'],
    'research': ['research', 'analysis', 'investigation'],
    'plan': ['planning', 'strategy', 'organization', 'management'],
    'manage': ['management', 'coordination', 'leadership'],
    'market': ['marketing', 'promotion', 'communication'],
    'deploy': ['deployment', 'devops', 'infrastructure'],
    'api': ['backend', 'api', 'development'],
    'database': ['backend', 'database', 'data'],
    'frontend': ['frontend', 'ui', 'web'],
    'backend': ['backend', 'server', 'api'],
    'ui': ['frontend', 'ui', 'design'],
    'ux': ['ux', 'design', 'user experience'],
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
 */
export function autoDelegateTasks(
  tasks: PromptTask[],
  assigneeList: AssigneeType[]
): PromptTask[] {
  if (assigneeList.length === 0) {
    return tasks.map(task => ({
      ...task,
      notes: task.assignee.status === 'unassigned'
        ? (task.notes || '') + '\n[Auto Delegate] No assignees available.'
        : task.notes,
    }));
  }

  return tasks.map(task => {
    // Skip already assigned tasks
    if (task.assignee.status === 'assigned') {
      return task;
    }

    // Calculate match scores for all assignees
    const scores = assigneeList.map(assignee => ({
      assignee,
      score: calculateMatchScore(assignee, task),
    }));

    // Sort by score (descending), then by name (ascending)
    scores.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.assignee.name.localeCompare(b.assignee.name);
    });

    const bestMatch = scores[0];

    // If score is too low (< 0.1), mark as unsuitable
    if (bestMatch.score < 0.1) {
      const requiredSkills = inferRequiredSkillset(task);
      return {
        ...task,
        assignee: {
          ...task.assignee,
          status: 'unassigned' as const,
        },
        notes: (task.notes || '') +
          `\n[Auto Delegate] No suitable assignee found. Recommended skills: ${requiredSkills.join(', ')}.`,
      };
    }

    // Assign to best match
    return {
      ...task,
      assignee: {
        name: bestMatch.assignee.name,
        email: bestMatch.assignee.email,
        role: bestMatch.assignee.role,
        status: 'assigned' as const,
      },
      notes: (task.notes || '') +
        `\n[Auto Delegate] Assigned to ${bestMatch.assignee.name} (confidence: ${(bestMatch.score * 100).toFixed(0)}%).`,
    };
  });
}

/**
 * Checks if there are any unassigned tasks
 */
export function hasUnassignedTasks(tasks: PromptTask[]): boolean {
  return tasks.some(task => task.assignee.status === 'unassigned');
}
