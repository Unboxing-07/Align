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
    - description: task를 수행하기 위해 무엇을 해야 하는지, 그리고 어떤 결과물이 나와야 하는지에 대한 통합된 상세 설명 (2-3문장)
    - output: 사용자가 task 완료 시 직접 입력할 결과물 필드 (description에 명시된 산출물을 실제로 업로드하거나 작성하는 곳)
    - input: flow를 통해 runtime에서 자동 결정되는 값
    - deadline, status, progress, run은 기존 정의와 동일

    ## 시스템 역할
    - 사용자의 요구로부터 workflow 생성
    - task는 atomic 단위로 분해
    - 각 task의 name(간결한 제목)과 description(상세한 설명)을 명확히 구분
    - description은 반드시 2-3문장으로 작성하며: (2번은 선택적으로 판별해서 작성.)
      1) 무엇을 해야 하는지 구체적인 작업 내용 설명
      2) 어떤 결과물이 나와야 하는지 명시 (예: "최종적으로 디자인 파일(PSD/Figma)과 가이드라인 문서를 제출해야 합니다.")
    - output 필드는 비워두거나 간단한 placeholder만 작성 (사용자가 직접 입력할 공간)
    - 각 task에 가장 적합한 assignee를 assignee-list에서 선택하여 자동 배정
      * task 내용과 assignee의 role을 자연어 의미 분석으로 매칭
      * 예: "디자인" task → role에 "designer", "design" 포함된 사람
      * 예: "개발" task → role에 "developer", "engineer" 포함된 사람
    - flow(edge)로 input 관계를 자동 유도
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
        - 각 task의 name은 간결하게 (예: "Design Poster", "Review Content")
        - 각 task의 description은 상세하게 2-3문장으로 작성하되, 작업 내용과 기대 결과물을 모두 포함
          예: "브랜드 아이덴티티를 반영한 마케팅 포스터 디자인을 제작합니다. 핵심 메시지, 시각 요소를 포함하며 브랜드 가이드라인을 준수해야 합니다. 최종적으로 디자인 파일(PSD/Figma)과 디자인 설명서를 제출해야 합니다."
        - 각 task의 output은 빈 배열로 두거나 간단한 placeholder (예: ["결과물"])
        - 각 task에 가장 적합한 assignee를 assignee-list에서 선택하여 배정
          * task의 성격(디자인, 개발, 리뷰, 테스트 등)을 파악
          * assignee의 role과 매칭하여 가장 적합한 사람 선택
          * 적합한 사람이 없으면 status: "unassigned"로 설정하고 notes에 권장 역할 기록
        - 각 task 간 흐름(flow) 설정
        - DAG 여부 검증
      </process>
    </action>

    <action>
      <name>modify workflow</name>
      <requires>
        - user-input: required (수정 요청 내용)
        - inputed-workflow-nullable: required (기존 워크플로우)
      </requires>
      <process>
        ## 핵심 원칙: 기존 워크플로우 최대한 보존, 요청된 변경사항만 반영

        ### 1. 기존 구조 분석
        - inputed_workflow의 tasks 개수, ID, flow 구조를 먼저 파악
        - 각 task의 현재 상태(status, assignee, deadline 등) 확인

        ### 2. 사용자 요청 분석 및 적용
        user_input을 분석하여 다음 중 해당하는 변경사항만 적용:

        a) **Task 이름(name) 수정**
           - 특정 task의 이름 변경 요청 시: 해당 task의 name만 업데이트
           - 예: "Design 태스크를 'Poster Design'으로 변경" → 해당 task의 name만 수정

        b) **Task 설명(description) 수정**
           - 특정 task의 설명 변경/추가 요청 시: 해당 task의 description만 업데이트
           - 2-3문장으로 작성하며 작업 내용과 기대 결과물 포함
           - 예: "Design 태스크에 브랜드 가이드라인 준수 내용 추가" → description 보강

        c) **Deadline 수정**
           - 특정 task나 전체 workflow의 deadline 설정/변경 요청 시
           - 예: "첫 번째 태스크 마감일을 다음 주 금요일로" → deadline 업데이트
           - 예: "모든 태스크 마감일을 일주일 뒤로" → 모든 task의 deadline 조정

        d) **Task 순서(flow) 변경**
           - task 간 선후행 관계 변경 요청 시: flows 배열 재구성
           - 예: "Review를 Design 전에" → flows 순서 변경
           - 반드시 DAG 유지 (순환 참조 금지)

        e) **Task 추가**
           - 새로운 task 추가 요청 시:
             * 새 task 생성 (적절한 ID 부여)
             * 기존 tasks에 추가
             * 적절한 위치에 flow 연결
             * 가장 적합한 assignee 자동 배정

        f) **Task 삭제**
           - 특정 task 삭제 요청 시:
             * tasks 배열에서 제거
             * 관련 flows도 함께 제거 또는 재연결

        g) **Assignee 변경**
           - 특정 task의 담당자 변경 요청 시
           - assignee-list에서 적절한 사람 선택

        ### 3. 변경되지 않은 항목 보존
        - 사용자가 언급하지 않은 task는 **완전히 그대로 유지**
        - 기존 task의 ID는 **절대 변경하지 않음** (새로 추가되는 task 제외)
        - 기존 task의 status는 **그대로 유지** (특별히 요청되지 않는 한)
        - 기존 assignee는 **그대로 유지** (특별히 요청되지 않는 한)
        - output 필드는 사용자 입력 공간이므로 **절대 수정하지 않음**

        ### 4. 검증
        - 수정된 workflow가 여전히 유효한 DAG인지 확인
        - 모든 flow의 from/to가 존재하는 task ID를 참조하는지 확인
        - workflow_name은 특별히 요청되지 않으면 유지

        ### 예시
        user_input: "첫 번째 태스크의 마감일을 2025-01-15로 설정하고, Review 태스크 설명을 더 상세하게 작성해줘"
        → 첫 번째 task의 deadline만 업데이트, Review task의 description만 보강, 나머지는 모두 그대로 유지
      </process>
    </action>
  </action-list>

  <assignee-list>
    <!-- 각 task에 가장 적합한 assignee를 이 목록에서 선택하세요 -->
    <!-- task의 성격과 assignee의 role을 매칭하여 배정하세요 -->
${assigneeListXML}
  </assignee-list>

  <workflow>
    <format>
      {
        "workflow_name": "string",
        "tasks": [
          {
            "id": "^[a-z0-9][a-z0-9-]{2,62}$",
            "name": "string (간결한 제목)",
            "description": "string (2-3문장: 무엇을 해야 하는지 + 어떤 결과물이 나와야 하는지 통합 설명)",
            "output": [],
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
  const { action, user_input, inputed_workflow, assignee_list } = request;

  // Handle modify action: preserve existing workflow structure
  if (action === "modify" && inputed_workflow) {
    // For mock mode, we'll simulate basic modifications based on user input
    const modified = { ...inputed_workflow };
    const input = (user_input || "").toLowerCase();

    // Simulate deadline modifications
    if (input.includes("deadline") || input.includes("마감") || input.includes("due")) {
      modified.tasks = modified.tasks.map((task, index) => {
        // Set deadlines to 7 days from now for demonstration
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 7 + index * 2);
        return {
          ...task,
          deadline: deadline.toISOString().split("T")[0],
        };
      });
      modified.checks.messages.push("Mock: Updated deadlines based on request");
    }

    // Simulate description enhancements
    if (input.includes("description") || input.includes("설명") || input.includes("detail")) {
      modified.tasks = modified.tasks.map((task) => ({
        ...task,
        description: task.description + " (Enhanced with more details based on your request.)",
      }));
      modified.checks.messages.push("Mock: Enhanced task descriptions");
    }

    // Add note about mock mode
    if (!modified.checks.messages.includes("Mock workflow modification")) {
      modified.checks.messages.push(
        "Mock workflow modification (set USE_REAL_AI=true for AI-powered modifications)"
      );
    }

    return modified;
  }
  const input = (user_input || "").toLowerCase();

  // Enhanced task extraction with action words
  const taskPatterns = [
    {
      keywords: ["design", "디자인"],
      name: "Design",
      description:
        "요구사항을 기반으로 시각 디자인을 제작하고 개선합니다. 브랜드 가이드라인과 사용자 경험 원칙을 준수해야 합니다. 최종적으로 디자인 파일(Figma/PNG)과 디자인 명세서를 제출해야 합니다.",
      output: [],
    },
    {
      keywords: ["develop", "code", "개발", "코드"],
      name: "Development",
      description:
        "명세에 따라 기능을 구현합니다. 베스트 프랙티스를 따르는 깔끔하고 유지보수 가능한 코드를 작성해야 합니다. 최종적으로 소스 코드와 구현 문서를 제출해야 합니다.",
      output: [],
    },
    {
      keywords: ["review", "리뷰", "검토"],
      name: "Review",
      description:
        "결과물의 품질, 정확성, 완성도를 면밀히 검토합니다. 개선을 위한 건설적인 피드백을 제공해야 합니다. 최종적으로 리뷰 피드백과 승인 노트를 제출해야 합니다.",
      output: [],
    },
    {
      keywords: ["test", "테스트"],
      name: "Testing",
      description:
        "버그를 식별하고 품질을 보장하기 위한 철저한 테스트를 수행합니다. 테스트 케이스와 결과를 문서화해야 합니다. 최종적으로 테스트 결과와 버그 리포트를 제출해야 합니다.",
      output: [],
    },
    {
      keywords: ["approve", "승인"],
      name: "Approval",
      description:
        "모든 결과물을 검토하고 최종 승인을 제공합니다. 요구사항이 충족되었는지 확인하고 품질 기준이 만족되었는지 검증해야 합니다. 최종적으로 승인 문서를 제출해야 합니다.",
      output: [],
    },
    {
      keywords: ["plan", "계획"],
      name: "Planning",
      description:
        "프로젝트 범위, 목표, 요구사항을 정의합니다. 상세한 타임라인을 작성하고 필요한 리소스를 식별해야 합니다. 최종적으로 프로젝트 계획서와 요구사항 문서를 제출해야 합니다.",
      output: [],
    },
    {
      keywords: ["create", "make", "만들", "생성"],
      name: "Creation",
      description:
        "명세에 따라 필요한 결과물을 제작합니다. 제작 과정에서 품질과 세부사항에 주의를 기울여야 합니다. 최종적으로 완성된 결과물과 문서를 제출해야 합니다.",
      output: [],
    },
    {
      keywords: ["research", "조사", "분석"],
      name: "Research",
      description:
        "여러 출처에서 관련 정보를 수집하고 분석합니다. 발견한 내용을 실행 가능한 인사이트로 종합해야 합니다. 최종적으로 조사 결과와 분석 보고서를 제출해야 합니다.",
      output: [],
    },
    {
      keywords: ["write", "작성"],
      name: "Writing",
      description:
        "명확하고 효과적인 문서 콘텐츠를 작성합니다. 적절한 구조, 문법, 스타일을 보장해야 합니다. 최종적으로 작성된 콘텐츠와 문서를 제출해야 합니다.",
      output: [],
    },
    {
      keywords: ["deploy", "배포"],
      name: "Deployment",
      description:
        "애플리케이션이나 기능을 프로덕션 환경에 배포합니다. 배포 프로세스를 모니터링하고 성공적인 롤아웃을 확인해야 합니다. 최종적으로 배포 로그와 릴리스 노트를 제출해야 합니다.",
      output: [],
    },
  ];

  const foundTasks: typeof taskPatterns = [];

  // Find matching tasks
  taskPatterns.forEach((pattern) => {
    if (pattern.keywords.some((keyword) => input.includes(keyword))) {
      foundTasks.push(pattern);
    }
  });

  // If no specific tasks found, create generic workflow based on input context
  if (foundTasks.length === 0) {
    if (
      input.includes("poster") ||
      input.includes("포스터") ||
      input.includes("marketing") ||
      input.includes("마케팅")
    ) {
      foundTasks.push(
        {
          keywords: [],
          name: "Design Marketing Poster",
          description:
            "핵심 메시지를 효과적으로 전달하는 마케팅 포스터를 제작합니다. 브랜드 요소를 포함하고 타겟 고객에게 시각적 매력을 보장해야 합니다. 최종적으로 포스터 디자인과 시각 자료를 제출해야 합니다.",
          output: [],
        },
        {
          keywords: [],
          name: "Review Poster",
          description:
            "포스터 디자인의 효과성과 브랜드 정렬을 평가합니다. 시각 요소, 메시징, 전체적인 임팩트에 대한 상세한 피드백을 제공해야 합니다. 최종적으로 리뷰 피드백과 수정 노트를 제출해야 합니다.",
          output: [],
        },
        {
          keywords: [],
          name: "Final Approval",
          description:
            "수정된 포스터 디자인에 대한 최종 검토를 수행합니다. 모든 피드백이 반영되었는지 확인하고 품질 기준을 충족하는지 검증해야 합니다. 최종적으로 승인된 포스터와 배포 가능한 파일을 제출해야 합니다.",
          output: [],
        }
      );
    } else if (input.includes("feature") || input.includes("기능")) {
      foundTasks.push(
        {
          keywords: [],
          name: "Plan Feature",
          description:
            "새 기능에 대한 상세 명세를 정의합니다. 요구사항, 사용자 스토리, 수용 기준을 문서화해야 합니다. 최종적으로 기능 명세서와 요구사항 문서를 제출해야 합니다.",
          output: [],
        },
        {
          keywords: [],
          name: "Implement Feature",
          description:
            "베스트 코딩 프랙티스를 사용하여 명세에 따라 기능을 개발합니다. 코드 품질과 신뢰성을 보장하기 위한 단위 테스트를 작성해야 합니다. 최종적으로 소스 코드와 단위 테스트를 제출해야 합니다.",
          output: [],
        },
        {
          keywords: [],
          name: "Test Feature",
          description:
            "구현된 기능에 대한 포괄적인 테스트를 수행합니다. 모든 요구사항이 충족되고 엣지 케이스가 처리되는지 확인해야 합니다. 최종적으로 테스트 결과와 QA 리포트를 제출해야 합니다.",
          output: [],
        }
      );
    } else {
      // Generic workflow
      foundTasks.push(
        {
          keywords: [],
          name: "Plan & Prepare",
          description:
            "요구사항을 분석하고 종합적인 계획을 수립합니다. 핵심 목표, 필요한 리소스, 잠재적 위험을 식별해야 합니다. 최종적으로 계획 문서와 요구사항 문서를 제출해야 합니다.",
          output: [],
        },
        {
          keywords: [],
          name: "Execute Work",
          description:
            "수립된 로드맵에 따라 계획된 작업을 수행합니다. 실행 단계 전반에 걸쳐 높은 품질 기준을 유지해야 합니다. 최종적으로 결과물과 작업 결과를 제출해야 합니다.",
          output: [],
        },
        {
          keywords: [],
          name: "Review & Finalize",
          description:
            "초기 요구사항 대비 완료된 모든 작업을 철저히 검토합니다. 피드백을 기반으로 최종 조정을 수행해야 합니다. 최종적으로 완료된 결과물을 제출해야 합니다.",
          output: [],
        }
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
      const designer = assignee_list.find((a) =>
        a.role.toLowerCase().includes("design")
      );
      if (designer) assignee = designer;
    } else if (taskLower.includes("develop") || taskLower.includes("code")) {
      const developer = assignee_list.find(
        (a) =>
          a.role.toLowerCase().includes("develop") ||
          a.role.toLowerCase().includes("engineer")
      );
      if (developer) assignee = developer;
    } else if (taskLower.includes("test")) {
      const tester = assignee_list.find(
        (a) =>
          a.role.toLowerCase().includes("qa") ||
          a.role.toLowerCase().includes("test")
      );
      if (tester) assignee = tester;
    } else if (taskLower.includes("approve") || taskLower.includes("review")) {
      const manager = assignee_list.find(
        (a) =>
          a.role.toLowerCase().includes("manager") ||
          a.role.toLowerCase().includes("lead")
      );
      if (manager) assignee = manager;
    }

    // Sanitize task name for ID: only lowercase alphanumeric and hyphens
    const sanitizedName = pattern.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters except spaces and hyphens
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens

    return {
      id: `task-${index + 1}-${sanitizedName}`,
      name: pattern.name,
      description: pattern.description,
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
      messages: [
        "Smart mock workflow generated (set USE_REAL_AI=true for AI-powered generation)",
      ],
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
      messages.push(`Task ${index + 1} has invalid ID format: ${task.id}`);
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

      // Perform auto delegation (force reassign all tasks)
      const delegatedTasks = autoDelegateTasks(
        workflow.tasks,
        request.assignee_list,
        true // Force reassign all tasks
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

        // Force output to be empty array (user will fill it in)
        generatedWorkflow.tasks = generatedWorkflow.tasks.map((task: any) => ({
          ...task,
          output: [],
        }));
      } catch (error: any) {
        console.warn(
          "Gemini API error, falling back to mock workflow:",
          error.message
        );
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
