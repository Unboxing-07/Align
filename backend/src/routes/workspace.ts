import { Router, Response } from 'express';
import prisma from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

type WorkspaceMemberWithUser = {
  userId: string;
  role: string;
  user: {
    name: string;
    email: string;
  };
};

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Helper function to calculate node counts
function calculateNodeCounts(workflow: any) {
  try {
    const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : [];
    const edges = Array.isArray(workflow.edges) ? workflow.edges : [];

    const totalNodeCount = nodes.length;
    const doneNodeCount = nodes.filter((node: any) => node?.data?.status === 'done').length;

    return {
      totalNodeCount,
      doneNodeCount,
      nodes,
      edges,
    };
  } catch (error) {
    console.error('Error calculating node counts:', error);
    return {
      totalNodeCount: 0,
      doneNodeCount: 0,
      nodes: [],
      edges: [],
    };
  }
}

// POST /api/workspaces - Create workspace
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Workspace name is required' });
    }

    // Create workspace and add creator as owner member
    const workspace = await prisma.workspace.create({
      data: {
        name,
        ownerId: req.userId!,
        members: {
          create: {
            userId: req.userId!,
            role: 'owner',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        workflows: true,
      },
    });

    // Format response to match frontend type
    const response = {
      id: workspace.id,
      name: workspace.name,
      assigneeList: workspace.members.map((m: WorkspaceMemberWithUser) => ({
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
      })),
      workflow: workspace.workflows.map((w) => {
        const counts = calculateNodeCounts(w);
        return {
          id: w.id,
          name: w.name,
          doneNodeCount: counts.doneNodeCount,
          totalNodeCount: counts.totalNodeCount,
          nodes: counts.nodes,
          edges: counts.edges,
        };
      }),
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Create workspace error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/workspaces - List workspaces I'm a member of
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId: req.userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        workflows: true,
      },
    });

    // Format response to match frontend type
    const response = workspaces.map((workspace: typeof workspaces[0]) => ({
      id: workspace.id,
      name: workspace.name,
      assigneeList: workspace.members.map((m: WorkspaceMemberWithUser) => ({
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
      })),
      workflow: workspace.workflows.map((w) => {
        const counts = calculateNodeCounts(w);
        return {
          id: w.id,
          name: w.name,
          doneNodeCount: counts.doneNodeCount,
          totalNodeCount: counts.totalNodeCount,
          nodes: counts.nodes,
          edges: counts.edges,
        };
      }),
    }));

    res.json(response);
  } catch (error) {
    console.error('Get workspaces error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/workspaces/:id - Get workspace detail
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        workflows: true,
      },
    });

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Check if user is a member
    const isMember = workspace.members.some((m: WorkspaceMemberWithUser) => m.userId === req.userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Format response
    const response = {
      id: workspace.id,
      name: workspace.name,
      assigneeList: workspace.members.map((m: WorkspaceMemberWithUser) => ({
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
      })),
      workflow: workspace.workflows.map((w) => {
        const counts = calculateNodeCounts(w);
        return {
          id: w.id,
          name: w.name,
          doneNodeCount: counts.doneNodeCount,
          totalNodeCount: counts.totalNodeCount,
          nodes: counts.nodes,
          edges: counts.edges,
        };
      }),
    };

    res.json(response);
  } catch (error) {
    console.error('Get workspace error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/workspaces/:id - Update workspace (owner only)
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Workspace name is required' });
    }

    // Check if user is owner
    const workspace = await prisma.workspace.findUnique({
      where: { id },
    });

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (workspace.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Only owner can update workspace' });
    }

    // Update workspace
    const updatedWorkspace = await prisma.workspace.update({
      where: { id },
      data: { name },
      include: {
        members: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        workflows: true,
      },
    });

    // Format response
    const response = {
      id: updatedWorkspace.id,
      name: updatedWorkspace.name,
      assigneeList: updatedWorkspace.members.map((m: WorkspaceMemberWithUser) => ({
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
      })),
      workflow: updatedWorkspace.workflows.map((w) => {
        const counts = calculateNodeCounts(w);
        return {
          id: w.id,
          name: w.name,
          doneNodeCount: counts.doneNodeCount,
          totalNodeCount: counts.totalNodeCount,
          nodes: counts.nodes,
          edges: counts.edges,
        };
      }),
    };

    res.json(response);
  } catch (error) {
    console.error('Update workspace error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/workspaces/:id - Delete workspace (owner only)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user is owner
    const workspace = await prisma.workspace.findUnique({
      where: { id },
    });

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (workspace.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Only owner can delete workspace' });
    }

    // Delete workspace (members and tasks will cascade delete)
    await prisma.workspace.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete workspace error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/workspaces/:id/my-tasks - Get my tasks in this workspace
router.get('/:id/my-tasks', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        workflows: true,
      },
    });

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Check if user is a member
    const member = workspace.members.find((m) => m.userId === req.userId);
    if (!member) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const currentUserEmail = member.user.email;

    // Find all tasks assigned to current user (exclude 'done' status)
    const myTasks: Array<{
      id: string;
      title: string;
      description: string;
      deadline: Date | string;
      workflowId: string;
      workflowName: string;
      nodeId: string;
      status: string;
    }> = [];

    workspace.workflows.forEach((workflow) => {
      const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : [];

      nodes.forEach((node: any) => {
        if (node.data?.assignee?.email === currentUserEmail && node.data?.status !== 'done') {
          myTasks.push({
            id: `${workflow.id}-${node.id}`,
            title: node.data.title || 'Untitled Task',
            description: node.data.description || '',
            deadline: node.data.deadline || new Date(),
            workflowId: workflow.id,
            workflowName: workflow.name,
            nodeId: node.id,
            status: node.data.status || 'pending',
          });
        }
      });
    });

    res.json({
      workspaceName: workspace.name,
      tasks: myTasks,
    });
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
