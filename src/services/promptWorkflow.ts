// Prompt-based workflow generation service (Frontend)

import type {
  PromptWorkflow,
  PromptRequest,
  PromptResponse,
} from "../types/prompt";
import { api } from "../lib/api";

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
        - assignee 미지정 task는 auto delegate 수행
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

    <action>
      <name>auto delegate</name>
      <requires>
        - inputed-workflow-nullable: required
      </requires>
      <process>
        - assignee가 비어 있는 task만 자동 배정
        - 역할 추론 규칙(정적 dictionary 없음):
          1) assignee-list의 role 문자열 의미를 자연어로 해석하여 skillset 추론
          2) task의 이름·output을 자연어로 분석해 필요한 skillset 추론
          3) 두 skillset의 의미 유사도가 가장 높은 assignee 선택
          4) 다수 후보 시 이름 오름차순 선택
          5) 모든 assignee가 부적합하면 notes에 권장 역할 기록
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

  // Check DAG from workflow checks
  if (!workflow.checks.is_dag) {
    messages.push("Workflow contains cycles and is not a valid DAG");
  }

  return {
    valid: messages.length === 0,
    messages,
  };
}

/**
 * Processes a prompt workflow request by calling the backend API
 */
export async function processPromptWorkflow(
  request: PromptRequest
): Promise<PromptResponse> {
  try {
    const response = await api.post<PromptResponse>("/prompt/workflow", request);
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Exports the prompt guideline for external use
 */
export function getPromptGuideline(request: PromptRequest): string {
  return buildPromptGuideline(request);
}
