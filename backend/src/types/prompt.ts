// Prompt system types for AI-powered workflow generation

export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "DONE";

export type AssigneeStatus = "assigned" | "unassigned";

export type PromptAssignee = {
  name: string | null;
  email: string | null;
  role: string | null;
  status: AssigneeStatus;
};

export type PromptTask = {
  id: string; // Must match pattern: ^[a-z0-9][a-z0-9-]{2,62}$
  name: string;
  description: string; // Detailed description of what needs to be done
  output: string[];
  deadline: string | null; // Format: YYYY-MM-DD or null
  status: TaskStatus;
  assignee: PromptAssignee;
  notes: string | null;
};

export type FlowType = "depends_on";

export type PromptFlow = {
  from: string; // task_id
  to: string; // task_id
  type: FlowType;
};

export type WorkflowChecks = {
  is_dag: boolean;
  has_unassigned: boolean;
  messages: string[];
};

export type PromptWorkflow = {
  workflow_name: string;
  tasks: PromptTask[];
  flows: PromptFlow[];
  checks: WorkflowChecks;
};

export type PromptAction = "create" | "modify" | "auto_delegate";

export type PromptRequest = {
  action: PromptAction;
  user_input?: string;
  inputed_workflow?: PromptWorkflow;
  assignee_list: Array<{
    name: string;
    email: string;
    role: string;
  }>;
};

export type PromptResponse = {
  success: boolean;
  workflow?: PromptWorkflow;
  error?: string;
};
