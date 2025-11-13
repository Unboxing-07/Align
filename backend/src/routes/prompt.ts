import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { processPromptWorkflow } from '../services/promptWorkflow';
import type { PromptRequest } from '../types/prompt';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/prompt/workflow - Generate or modify workflow using AI
router.post('/workflow', async (req: AuthRequest, res: Response) => {
  try {
    const { action, user_input, inputed_workflow, assignee_list }: PromptRequest = req.body;

    // Validate request
    if (!action) {
      return res.status(400).json({ error: 'action is required' });
    }

    if (!['create', 'modify', 'auto_delegate'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be create, modify, or auto_delegate' });
    }

    if (action === 'create' && !user_input) {
      return res.status(400).json({ error: 'user_input is required for create action' });
    }

    if ((action === 'modify' || action === 'auto_delegate') && !inputed_workflow) {
      return res.status(400).json({ error: 'inputed_workflow is required for modify or auto_delegate action' });
    }

    if (!assignee_list || !Array.isArray(assignee_list)) {
      return res.status(400).json({ error: 'assignee_list must be an array' });
    }

    // Process workflow
    const result = await processPromptWorkflow({
      action,
      user_input,
      inputed_workflow,
      assignee_list,
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Prompt workflow error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
