// DAG (Directed Acyclic Graph) validation utilities

import type { PromptFlow } from "../types/prompt";

/**
 * Validates if the given flows form a DAG (no cycles)
 */
export function isDAG(flows: PromptFlow[]): boolean {
  if (flows.length === 0) return true;

  // Build adjacency list
  const graph = new Map<string, string[]>();
  const allNodes = new Set<string>();

  flows.forEach(({ from, to }) => {
    allNodes.add(from);
    allNodes.add(to);

    if (!graph.has(from)) {
      graph.set(from, []);
    }
    graph.get(from)!.push(to);
  });

  // DFS with visited and recursion stack
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function hasCycleDFS(node: string): boolean {
    visited.add(node);
    recStack.add(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycleDFS(neighbor)) {
          return true;
        }
      } else if (recStack.has(neighbor)) {
        // Back edge found - cycle detected
        return true;
      }
    }

    recStack.delete(node);
    return false;
  }

  // Check all nodes
  for (const node of allNodes) {
    if (!visited.has(node)) {
      if (hasCycleDFS(node)) {
        return false; // Cycle found
      }
    }
  }

  return true; // No cycles
}

/**
 * Finds cycles in the graph (for debugging)
 */
export function findCycles(flows: PromptFlow[]): string[][] {
  const cycles: string[][] = [];
  if (flows.length === 0) return cycles;

  const graph = new Map<string, string[]>();
  const allNodes = new Set<string>();

  flows.forEach(({ from, to }) => {
    allNodes.add(from);
    allNodes.add(to);

    if (!graph.has(from)) {
      graph.set(from, []);
    }
    graph.get(from)!.push(to);
  });

  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];

  function findCycleDFS(node: string): void {
    visited.add(node);
    recStack.add(node);
    path.push(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        findCycleDFS(neighbor);
      } else if (recStack.has(neighbor)) {
        // Cycle found - extract cycle path
        const cycleStartIndex = path.indexOf(neighbor);
        const cycle = path.slice(cycleStartIndex);
        cycles.push([...cycle, neighbor]);
      }
    }

    path.pop();
    recStack.delete(node);
  }

  for (const node of allNodes) {
    if (!visited.has(node)) {
      findCycleDFS(node);
    }
  }

  return cycles;
}

/**
 * Gets topological sort of tasks (if DAG)
 */
export function topologicalSort(taskIds: string[], flows: PromptFlow[]): string[] | null {
  if (!isDAG(flows)) return null;

  const graph = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  // Initialize
  taskIds.forEach(id => {
    graph.set(id, []);
    inDegree.set(id, 0);
  });

  // Build graph
  flows.forEach(({ from, to }) => {
    graph.get(from)!.push(to);
    inDegree.set(to, (inDegree.get(to) || 0) + 1);
  });

  // Kahn's algorithm
  const queue: string[] = [];
  const result: string[] = [];

  // Start with nodes that have no incoming edges
  inDegree.forEach((degree, node) => {
    if (degree === 0) {
      queue.push(node);
    }
  });

  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);

    const neighbors = graph.get(node) || [];
    neighbors.forEach(neighbor => {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    });
  }

  return result.length === taskIds.length ? result : null;
}

/**
 * Validates task ID format
 */
export function isValidTaskId(id: string): boolean {
  const pattern = /^[a-z0-9][a-z0-9-]{2,62}$/;
  return pattern.test(id);
}

/**
 * Generates a valid task ID from a task name
 */
export function generateTaskId(name: string, existingIds: Set<string>): string {
  // Convert to lowercase and replace spaces/special chars with hyphens
  let id = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

  // Ensure it starts with alphanumeric
  if (!/^[a-z0-9]/.test(id)) {
    id = 'task-' + id;
  }

  // Truncate if too long
  if (id.length > 63) {
    id = id.substring(0, 63);
  }

  // Ensure minimum length
  if (id.length < 3) {
    id = id + '-task';
  }

  // Handle duplicates
  let finalId = id;
  let counter = 1;
  while (existingIds.has(finalId)) {
    finalId = `${id}-${counter}`;
    counter++;
  }

  return finalId;
}
