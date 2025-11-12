import { Router, Response } from 'express';
import prisma from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/workflows - Create workflow
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { workspaceId, name } = req.body;

    if (!workspaceId || !name) {
      return res.status(400).json({ error: 'Workspace ID and name are required' });
    }

    // Check if user is a member of the workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: true,
      },
    });

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const isMember = workspace.members.some((m) => m.userId === req.userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create workflow
    const workflow = await prisma.workflow.create({
      data: {
        workspaceId,
        name,
      },
    });

    res.status(201).json(workflow);
  } catch (error) {
    console.error('Create workflow error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/workflows/:id - Get workflow detail
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: {
        workspace: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // Check if user is a member of the workspace
    const isMember = workflow.workspace.members.some((m) => m.userId === req.userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(workflow);
  } catch (error) {
    console.error('Get workflow error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to validate and update node statuses
function updateNodeStatuses(nodes: any[], edges: any[]) {
  if (!Array.isArray(nodes)) return nodes;

  // Create a map of node statuses
  const nodeStatusMap = new Map();
  nodes.forEach((node) => {
    if (node.data) {
      nodeStatusMap.set(node.id, node.data.status);
    }
  });

  // Update each node's status based on logic
  return nodes.map((node) => {
    if (!node.data) return node;

    const currentStatus = node.data.status;
    const output = node.data.output;

    // Find incoming edges (previous nodes)
    const incomingEdges = edges.filter((edge: any) => edge.target === node.id);

    // Determine if previous nodes are done
    const hasPreviousNodes = incomingEdges.length > 0;
    const allPreviousDone = incomingEdges.every((edge: any) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      return sourceNode?.data?.status === 'done';
    });

    let newStatus = currentStatus;

    // Logic: If no previous nodes or all previous nodes are done, status should be at least in_progress
    if (currentStatus === 'pending' && (!hasPreviousNodes || allPreviousDone)) {
      newStatus = 'progress';
    }

    // Logic: If output is written and status is progress, change to completed
    if (output && output.trim() && currentStatus === 'progress') {
      newStatus = 'completed';
    }

    return {
      ...node,
      data: {
        ...node.data,
        status: newStatus,
      },
    };
  });
}

// PUT /api/workflows/:id - Update workflow
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, nodes, edges } = req.body;

    console.log('Update workflow:', {
      id,
      hasName: name !== undefined,
      nodesCount: Array.isArray(nodes) ? nodes.length : 0,
      edgesCount: Array.isArray(edges) ? edges.length : 0,
      edges: edges
    });

    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: {
        workspace: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // Check if user is a member of the workspace
    const isMember = workflow.workspace.members.some((m) => m.userId === req.userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build update data
    const updateData: {
      name?: string;
      nodes?: any;
      edges?: any;
    } = {};

    if (name !== undefined) updateData.name = name;

    // Apply status validation logic if nodes are being updated
    if (nodes !== undefined) {
      const updatedEdges = edges !== undefined ? edges : (workflow.edges as any);
      updateData.nodes = updateNodeStatuses(nodes, updatedEdges);
    }

    if (edges !== undefined) {
      updateData.edges = edges;
      console.log('Saving edges:', edges);
    }

    // Update workflow
    const updatedWorkflow = await prisma.workflow.update({
      where: { id },
      data: updateData,
    });

    console.log('Workflow updated successfully with',
      Array.isArray(updatedWorkflow.edges) ? updatedWorkflow.edges.length : 0,
      'edges');

    res.json(updatedWorkflow);
  } catch (error) {
    console.error('Update workflow error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/workflows/:id - Delete workflow
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: {
        workspace: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // Check if user is a member of the workspace
    const isMember = workflow.workspace.members.some((m) => m.userId === req.userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete workflow
    await prisma.workflow.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete workflow error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
