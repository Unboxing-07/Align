import { Router, Response } from "express";
import prisma from "../db";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { TaskStatus } from "@prisma/client";

type WorkspaceMember = {
  userId: string;
  role: string;
};

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// POST /api/workspaces/:id/tasks - Create task
router.post("/:id/tasks", async (req: AuthRequest, res: Response) => {
  try {
    const { id: workspaceId } = req.params;
    const { title, description, assigneeId, input, output, deadline, status } =
      req.body;

    // Basic validation
    if (!title || !description || !assigneeId || !deadline) {
      return res.status(400).json({
        error: "Title, description, assigneeId, and deadline are required",
      });
    }

    // Check if workspace exists and user is a member
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: true,
      },
    });

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const isMember = workspace.members.some(
      (m: WorkspaceMember) => m.userId === req.userId
    );
    if (!isMember) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Check if assignee is a member
    const assigneeIsMember = workspace.members.some(
      (m: WorkspaceMember) => m.userId === assigneeId
    );
    if (!assigneeIsMember) {
      return res
        .status(400)
        .json({ error: "Assignee must be a workspace member" });
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        workspaceId,
        title,
        description,
        assigneeId,
        input: input || "",
        output: output || "",
        deadline: new Date(deadline),
        status: status || "pending",
      },
      include: {
        assignee: {
          select: {
            name: true,
            email: true,
          },
        },
        workspace: {
          include: {
            members: {
              where: {
                userId: assigneeId,
              },
              select: {
                role: true,
              },
            },
          },
        },
      },
    });

    // Format response to match frontend type
    const response = {
      title: task.title,
      description: task.description,
      assignee: {
        name: task.assignee.name,
        email: task.assignee.email,
        role: task.workspace.members[0]?.role || "member",
      },
      input: task.input,
      output: task.output,
      deadline: task.deadline,
      status: task.status,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/workspaces/:id/tasks - Get workspace tasks
router.get("/:id/tasks", async (req: AuthRequest, res: Response) => {
  try {
    const { id: workspaceId } = req.params;
    const { status } = req.query;

    // Check if workspace exists and user is a member
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: true,
      },
    });

    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    const isMember = workspace.members.some(
      (m: WorkspaceMember) => m.userId === req.userId
    );
    if (!isMember) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Build query
    const where: { workspaceId: string; status?: TaskStatus } = { workspaceId };
    if (status && typeof status === "string") {
      where.status = status as TaskStatus;
    }

    // Get tasks
    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            name: true,
            email: true,
          },
        },
        workspace: {
          include: {
            members: {
              select: {
                userId: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format response
    const response = tasks.map((task) => {
      const assigneeMember = task.workspace.members.find(
        (m) => m.userId === task.assigneeId
      );
      return {
        title: task.title,
        description: task.description,
        assignee: {
          name: task.assignee.name,
          email: task.assignee.email,
          role: assigneeMember?.role || "member",
        },
        input: task.input,
        output: task.output,
        deadline: task.deadline,
        status: task.status,
      };
    });

    res.json(response);
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/tasks/:taskId - Get task detail
router.get("/detail/:taskId", async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: {
          select: {
            name: true,
            email: true,
          },
        },
        workspace: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check if user is a workspace member
    const isMember = task.workspace.members.some(
      (m: WorkspaceMember) => m.userId === req.userId
    );
    if (!isMember) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Format response
    const assigneeMember = task.workspace.members.find(
      (m: WorkspaceMember) => m.userId === task.assigneeId
    );
    const response = {
      title: task.title,
      description: task.description,
      assignee: {
        name: task.assignee.name,
        email: task.assignee.email,
        role: assigneeMember?.role || "member",
      },
      input: task.input,
      output: task.output,
      deadline: task.deadline,
      status: task.status,
    };

    res.json(response);
  } catch (error) {
    console.error("Get task error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/tasks/:taskId - Update task
router.put("/detail/:taskId", async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const { title, description, assigneeId, input, output, deadline, status } =
      req.body;

    // Check if task exists and user is a workspace member
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        workspace: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const isMember = task.workspace.members.some(
      (m: WorkspaceMember) => m.userId === req.userId
    );
    if (!isMember) {
      return res.status(403).json({ error: "Access denied" });
    }

    // If assigneeId is being changed, check if new assignee is a member
    if (assigneeId && assigneeId !== task.assigneeId) {
      const assigneeIsMember = task.workspace.members.some(
        (m: WorkspaceMember) => m.userId === assigneeId
      );
      if (!assigneeIsMember) {
        return res
          .status(400)
          .json({ error: "Assignee must be a workspace member" });
      }
    }

    // Build update data
    const updateData: {
      title?: string;
      description?: string;
      assigneeId?: string;
      input?: string;
      output?: string;
      deadline?: Date;
      status?: TaskStatus;
    } = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId;
    if (input !== undefined) updateData.input = input;
    if (output !== undefined) updateData.output = output;
    if (deadline !== undefined) updateData.deadline = new Date(deadline);
    if (status !== undefined) updateData.status = status as TaskStatus;

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: {
          select: {
            name: true,
            email: true,
          },
        },
        workspace: {
          include: {
            members: {
              select: {
                userId: true,
                role: true,
              },
            },
          },
        },
      },
    });

    // Format response
    const assigneeMember = updatedTask.workspace.members.find(
      (m) => m.userId === updatedTask.assigneeId
    );
    const response = {
      title: updatedTask.title,
      description: updatedTask.description,
      assignee: {
        name: updatedTask.assignee.name,
        email: updatedTask.assignee.email,
        role: assigneeMember?.role || "member",
      },
      input: updatedTask.input,
      output: updatedTask.output,
      deadline: updatedTask.deadline,
      status: updatedTask.status,
    };

    res.json(response);
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/tasks/:taskId - Delete task
router.delete("/detail/:taskId", async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;

    // Check if task exists and user is a workspace member
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        workspace: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const isMember = task.workspace.members.some(
      (m: WorkspaceMember) => m.userId === req.userId
    );
    if (!isMember) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Delete task
    await prisma.task.delete({
      where: { id: taskId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
