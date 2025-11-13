// Prompt-based workflow generation service

import type {
  PromptWorkflow,
  PromptRequest,
  PromptResponse,
} from "../types/prompt";
import { isDAG, findCycles } from "../utils/dag";
import { autoDelegateTasks, hasUnassignedTasks } from "../utils/autoDelegation";
import { generateWorkflowJSON, isGeminiAvailable } from "./gemini";

/**
 * Builds the prompt guideline for the AI
 */
function buildPromptGuideline(request: PromptRequest): string {
  const { action, user_input, inputed_workflow, assignee_list } = request;

  const assigneeListXML = assignee_list
    .map(
      (a) =>
        `    <assignee name="${a.name}" email="${a.email}" role="${a.role}" />`
    )
    .join("\n");

  const workflowJSON = inputed_workflow
    ? JSON.stringify(inputed_workflow, null, 2)
    : "";

  return `
<guideline>
  <system>
    당신은 사용자의 요구를 구조적으로 해석하여 workflow를 생성·수정·배정하는 전문가이다.
    아래 규칙을 절대적으로 준수한다.

    ## 핵심 개념 정의
    - workflow: 관계를 가진 task들의 DAG 기반 집합
    - task(node): 한 명이 처리 가능한 최소 단위 업무
    - flow(edge): 두 task 간의 선행 → 후행 관계
    - assignee: task 담당자
    - output: task 완료 시 생성되는 결과물
    - input: flow를 통해 runtime에서 자동 결정되는 값
    - deadline, status, progress, run은 기존 정의와 동일

    ## 시스템 역할
    - 사용자의 요구로부터 workflow 생성
    - task는 atomic 단위로 분해하고 output만 정의
    - flow(edge)로 input 관계를 자동 유도
    - assignee가 비어 있는 task는 auto delegate 규칙으로 채우기
    - modify는 기존 workflow 최소 변경 원칙 적용
    - 모든 workflow는 DAG 구조 유지

  </system>

  <action-list>
    <action>
      <name>create new workflow</name>
      <requires>
        - user-input: required
        - inputed-workflow-nullable: not used
      </requires>
      <process>
        - 요구를 분석하여 atomic task 분해
        - 각 task의 output 정의
        - 각 task 간 흐름(flow) 설정
        - assignee 미지정 task는 unassigned로 두기 (auto delegate는 별도 호출)
        - DAG 여부 검증
      </process>
    </action>

    <action>
      <name>modify workflow</name>
      <requires>
        - inputed-workflow-nullable: required
      </requires>
      <process>
        - 최소 수정 원칙으로 변경사항 반영
        - DAG 재검증
      </process>
    </action>
  </action-list>

  <assignee-list>
${assigneeListXML}
  </assignee-list>

  <workflow>
    <format>
      {
        "workflow_name": "string",
        "tasks": [
          {
            "id": "^[a-z0-9][a-z0-9-]{2,62}$",
            "name": "string",
            "output": ["string"],
            "deadline": "YYYY-MM-DD|null",
            "status": "PENDING|IN_PROGRESS|COMPLETED|DONE",
            "assignee": {
              "name": "string|null",
              "email": "string|null",
              "role": "string|null",
              "status": "assigned|unassigned"
            },
            "notes": "string|null"
          }
        ],
        "flows": [
          {"from": "task_id", "to": "task_id", "type": "depends_on"}
        ],
        "checks": {
          "is_dag": true,
          "has_unassigned": boolean,
          "messages": ["string"]
        }
      }
    </format>
  </workflow>

  <user-input nullable="true">${user_input || ""}</user-input>
  <inputed-workflow-nullable nullable="true">${workflowJSON}</inputed-workflow-nullable>

</guideline>

당신의 역할은 위 guideline을 기반으로 ${action} 액션을 수행하는 것입니다.
위 형식에 맞춰 JSON만 반환하세요. 다른 설명은 불필요합니다.
`;
}

/**
 * Generates a mock workflow for demo purposes
 */
function generateMockWorkflow(request: PromptRequest): PromptWorkflow {
  const { user_input, assignee_list } = request;
  const input = (user_input || "").toLowerCase();

  // Enhanced task extraction with action words
  const taskPatterns = [
    { keywords: ["design", "디자인"], name: "Design", output: ["Design file (Figma/PNG)", "Design specifications"] },
    { keywords: ["develop", "code", "개발", "코드"], name: "Development", output: ["Source code", "Implementation"] },
    { keywords: ["review", "리뷰", "검토"], name: "Review", output: ["Review feedback", "Approval notes"] },
    { keywords: ["test", "테스트"], name: "Testing", output: ["Test results", "Bug report"] },
    { keywords: ["approve", "승인"], name: "Approval", output: ["Approval document", "Sign-off"] },
    { keywords: ["plan", "계획"], name: "Planning", output: ["Project plan", "Requirements document"] },
    { keywords: ["create", "make", "만들", "생성"], name: "Creation", output: ["Created deliverable", "Documentation"] },
    { keywords: ["research", "조사", "분석"], name: "Research", output: ["Research findings", "Analysis report"] },
    { keywords: ["write", "작성"], name: "Writing", output: ["Written content", "Documentation"] },
    { keywords: ["deploy", "배포"], name: "Deployment", output: ["Deployment log", "Release notes"] },
  ];

  const foundTasks: typeof taskPatterns = [];

  // Find matching tasks
  taskPatterns.forEach(pattern => {
    if (pattern.keywords.some(keyword => input.includes(keyword))) {
      foundTasks.push(pattern);
    }
  });

  // If no specific tasks found, create generic workflow based on input context
  if (foundTasks.length === 0) {
    if (input.includes("poster") || input.includes("포스터") || input.includes("marketing") || input.includes("마케팅")) {
      foundTasks.push(
        { keywords: [], name: "Design Marketing Poster", output: ["Poster design", "Visual assets"] },
        { keywords: [], name: "Review Poster", output: ["Review feedback", "Revision notes"] },
        { keywords: [], name: "Final Approval", output: ["Approved poster", "Publication ready file"] }
      );
    } else if (input.includes("feature") || input.includes("기능")) {
      foundTasks.push(
        { keywords: [], name: "Plan Feature", output: ["Feature specification", "Requirements"] },
        { keywords: [], name: "Implement Feature", output: ["Source code", "Unit tests"] },
        { keywords: [], name: "Test Feature", output: ["Test results", "QA report"] }
      );
    } else {
      // Generic workflow
      foundTasks.push(
        { keywords: [], name: "Plan & Prepare", output: ["Planning document", "Requirements"] },
        { keywords: [], name: "Execute Work", output: ["Deliverables", "Work results"] },
        { keywords: [], name: "Review & Finalize", output: ["Final review", "Completed work"] }
      );
    }
  }

  // Assign tasks to team members based on roles
  const tasks = foundTasks.map((pattern, index) => {
    // Smart assignee matching based on task type
    let assignee = assignee_list[index % assignee_list.length];

    // Try to match role with task
    const taskLower = pattern.name.toLowerCase();
    if (taskLower.includes("design")) {
      const designer = assignee_list.find(a => a.role.toLowerCase().includes("design"));
      if (designer) assignee = designer;
    } else if (taskLower.includes("develop") || taskLower.includes("code")) {
      const developer = assignee_list.find(a =>
        a.role.toLowerCase().includes("develop") ||
        a.role.toLowerCase().includes("engineer")
      );
      if (developer) assignee = developer;
    } else if (taskLower.includes("test")) {
      const tester = assignee_list.find(a => a.role.toLowerCase().includes("qa") || a.role.toLowerCase().includes("test"));
      if (tester) assignee = tester;
    } else if (taskLower.includes("approve") || taskLower.includes("review")) {
      const manager = assignee_list.find(a =>
        a.role.toLowerCase().includes("manager") ||
        a.role.toLowerCase().includes("lead")
      );
      if (manager) assignee = manager;
    }

    // Sanitize task name for ID: only lowercase alphanumeric and hyphens
    const sanitizedName = pattern.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters except spaces and hyphens
      .replace(/\s+/g, "-")          // Replace spaces with hyphens
      .replace(/-+/g, "-")           // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, "");        // Remove leading/trailing hyphens

    return {
      id: `task-${index + 1}-${sanitizedName}`,
      name: pattern.name,
      output: pattern.output,
      deadline: null,
      status: index === 0 ? ("IN_PROGRESS" as const) : ("PENDING" as const),
      assignee: {
        name: assignee.name,
        email: assignee.email,
        role: assignee.role,
        status: "assigned" as const,
      },
      notes: `Generated from: "${user_input}"`,
    };
  });

  // Create flows (sequential by default)
  const flows = tasks.slice(0, -1).map((task, index) => ({
    from: task.id,
    to: tasks[index + 1].id,
    type: "depends_on" as const,
  }));

  // Extract workflow name from input
  let workflowName = user_input || "Generated Workflow";
  if (workflowName.length > 50) {
    workflowName = workflowName.substring(0, 47) + "...";
  }

  return {
    workflow_name: workflowName,
    tasks,
    flows,
    checks: {
      is_dag: true,
      has_unassigned: false,
      messages: ["Smart mock workflow generated (set USE_REAL_AI=true for AI-powered generation)"],
    },
  };
}

/**
 * Validates a prompt workflow
 */
export function validateWorkflow(workflow: PromptWorkflow): {
  valid: boolean;
  messages: string[];
} {
  const messages: string[] = [];

  // Check if workflow name exists
  if (!workflow.workflow_name || workflow.workflow_name.trim() === "") {
    messages.push("Workflow name is required");
  }

  // Check if tasks exist
  if (!workflow.tasks || workflow.tasks.length === 0) {
    messages.push("At least one task is required");
  }

  // Validate task IDs
  const taskIds = new Set<string>();
  workflow.tasks.forEach((task, index) => {
    const idPattern = /^[a-z0-9][a-z0-9-]{2,62}$/;
    if (!idPattern.test(task.id)) {
      messages.push(
        `Task ${index + 1} has invalid ID format: ${task.id}`
      );
    }
    if (taskIds.has(task.id)) {
      messages.push(`Duplicate task ID: ${task.id}`);
    }
    taskIds.add(task.id);
  });

  // Validate flows reference valid task IDs
  workflow.flows.forEach((flow, index) => {
    if (!taskIds.has(flow.from)) {
      messages.push(
        `Flow ${index + 1} references non-existent task: ${flow.from}`
      );
    }
    if (!taskIds.has(flow.to)) {
      messages.push(
        `Flow ${index + 1} references non-existent task: ${flow.to}`
      );
    }
  });

  // Validate DAG
  const isDag = isDAG(workflow.flows);
  if (!isDag) {
    const cycles = findCycles(workflow.flows);
    messages.push(
      `Workflow contains cycles: ${cycles.map((c) => c.join(" → ")).join(", ")}`
    );
  }

  return {
    valid: messages.length === 0,
    messages,
  };
}

/**
 * Processes a prompt workflow request
 */
export async function processPromptWorkflow(
  request: PromptRequest
): Promise<PromptResponse> {
  try {
    // Handle auto_delegate action locally
    if (request.action === "auto_delegate") {
      if (!request.inputed_workflow) {
        return {
          success: false,
          error: "inputed_workflow is required for auto_delegate action",
        };
      }

      const workflow = request.inputed_workflow;

      // Perform auto delegation
      const delegatedTasks = autoDelegateTasks(
        workflow.tasks,
        request.assignee_list
      );

      // Update workflow
      const updatedWorkflow: PromptWorkflow = {
        ...workflow,
        tasks: delegatedTasks,
        checks: {
          is_dag: isDAG(workflow.flows),
          has_unassigned: hasUnassignedTasks(delegatedTasks),
          messages: [],
        },
      };

      // Validate
      const validation = validateWorkflow(updatedWorkflow);
      updatedWorkflow.checks.messages = validation.messages;

      return {
        success: validation.valid,
        workflow: updatedWorkflow,
        error: validation.valid ? undefined : validation.messages.join("; "),
      };
    }

    // Handle create and modify actions
    // Use mock workflow by default due to Gemini API free tier limitations (1 request per day)
    // To use real AI, set USE_REAL_AI=true in environment variables
    const useRealAI = process.env.USE_REAL_AI === "true";

    let generatedWorkflow;

    if (useRealAI && isGeminiAvailable()) {
      console.log("Using real Gemini AI to generate workflow");
      try {
        const prompt = buildPromptGuideline(request);
        generatedWorkflow = await generateWorkflowJSON(prompt);
      } catch (error: any) {
        console.warn("Gemini API error, falling back to mock workflow:", error.message);
        generatedWorkflow = generateMockWorkflow(request);
      }
    } else {
      console.log("Using mock workflow (set USE_REAL_AI=true to use Gemini)");
      generatedWorkflow = generateMockWorkflow(request);
    }

    // Validate generated workflow
    const validation = validateWorkflow(generatedWorkflow);
    generatedWorkflow.checks = {
      is_dag: isDAG(generatedWorkflow.flows),
      has_unassigned: hasUnassignedTasks(generatedWorkflow.tasks),
      messages: validation.messages,
    };

    return {
      success: validation.valid,
      workflow: generatedWorkflow,
      error: validation.valid ? undefined : validation.messages.join("; "),
    };
  } catch (error) {
    console.error("Process prompt workflow error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
