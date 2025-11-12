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
      workflow: [], // Always empty (workflow feature excluded)
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
      workflow: [], // Always empty
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
      workflow: [],
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
      workflow: [],
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

export default router;
