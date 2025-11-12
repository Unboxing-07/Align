import { Router, Response } from 'express';
import prisma from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/workspaces/:id/members - Add member by email
router.post('/:id/members', async (req: AuthRequest, res: Response) => {
  try {
    const { id: workspaceId } = req.params;
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    // Check if workspace exists and user is owner
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (workspace.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Only owner can add members' });
    }

    // Find user by email
    const userToAdd = await prisma.user.findUnique({
      where: { email },
    });

    if (!userToAdd) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: userToAdd.id,
        },
      },
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    // Add member
    await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: userToAdd.id,
        role,
      },
    });

    // Return the new member info
    const response = {
      name: userToAdd.name,
      email: userToAdd.email,
      role,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/workspaces/:id/members - Get workspace members
router.get('/:id/members', async (req: AuthRequest, res: Response) => {
  try {
    const { id: workspaceId } = req.params;

    // Check if workspace exists and user is a member
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
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
    const isMember = workspace.members.some(m => m.userId === req.userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Format response
    const response = workspace.members.map(m => ({
      name: m.user.name,
      email: m.user.email,
      role: m.role,
    }));

    res.json(response);
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/workspaces/:id/members/:userId - Update member role (owner only)
router.put('/:id/members/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const { id: workspaceId, userId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    // Check if workspace exists and user is owner
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (workspace.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Only owner can update member roles' });
    }

    // Can't change owner's role
    if (userId === workspace.ownerId) {
      return res.status(400).json({ error: 'Cannot change owner role' });
    }

    // Update member role
    const updatedMember = await prisma.workspaceMember.update({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      data: { role },
    });

    // Format response
    const response = {
      name: updatedMember.user.name,
      email: updatedMember.user.email,
      role: updatedMember.role,
    };

    res.json(response);
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/workspaces/:id/members/:userId - Remove member
router.delete('/:id/members/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const { id: workspaceId, userId } = req.params;

    // Check if workspace exists and user is owner
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (workspace.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Only owner can remove members' });
    }

    // Can't remove owner
    if (userId === workspace.ownerId) {
      return res.status(400).json({ error: 'Cannot remove owner' });
    }

    // Remove member
    await prisma.workspaceMember.delete({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
