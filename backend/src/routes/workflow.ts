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

// PUT /api/workflows/:id - Update workflow
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Workflow name is required' });
    }

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

    // Update workflow
    const updatedWorkflow = await prisma.workflow.update({
      where: { id },
      data: { name },
    });

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
