# Prompt System Documentation

AI 기반 워크플로우 생성 시스템입니다. 사용자의 자연어 요구사항을 구조화된 workflow로 자동 변환합니다.

## ⚡ Quick Start

### 1. Gemini API 키 설정

1. [Google AI Studio](https://aistudio.google.com/apikey)에서 API 키 발급
2. `backend/.env` 파일에 추가:
   ```
   GEMINI_API_KEY="your-api-key-here"
   ```

### 2. 백엔드 서버 시작

```bash
cd backend
npm run dev
```

### 3. API 엔드포인트

```
POST /api/prompt/workflow
```

**요청 본문:**
```json
{
  "action": "create" | "modify" | "auto_delegate",
  "user_input": "workflow 생성 요구사항",
  "inputed_workflow": { /* 기존 workflow (modify/auto_delegate용) */ },
  "assignee_list": [
    { "name": "Alice", "email": "alice@example.com", "role": "Developer" }
  ]
}
```

**응답:**
```json
{
  "success": true,
  "workflow": { /* 생성된 PromptWorkflow */ },
  "error": null
}
```

## 주요 기능

### 1. **Workflow 자동 생성** (`create`)
사용자의 자연어 입력으로부터 새로운 workflow를 생성합니다.

```typescript
import { processPromptWorkflow } from './services/promptWorkflow';

const request = {
  action: 'create',
  user_input: '마케팅 포스터를 만들어야 해. 디자인하고, 리뷰받고, 최종 승인받아야 해.',
  assignee_list: [
    { name: 'Alice', email: 'alice@example.com', role: 'Designer' },
    { name: 'Bob', email: 'bob@example.com', role: 'Marketing Manager' },
    { name: 'Charlie', email: 'charlie@example.com', role: 'Product Manager' },
  ],
};

const response = await processPromptWorkflow(request);
```

**기대 결과:**
```json
{
  "workflow_name": "마케팅 포스터 제작",
  "tasks": [
    {
      "id": "design-poster",
      "name": "포스터 디자인",
      "output": ["디자인 파일 (Figma, PNG)"],
      "deadline": null,
      "status": "PENDING",
      "assignee": {
        "name": "Alice",
        "email": "alice@example.com",
        "role": "Designer",
        "status": "assigned"
      }
    },
    {
      "id": "review-design",
      "name": "디자인 리뷰",
      "output": ["리뷰 피드백"],
      "deadline": null,
      "status": "PENDING",
      "assignee": {
        "name": "Bob",
        "email": "bob@example.com",
        "role": "Marketing Manager",
        "status": "assigned"
      }
    },
    {
      "id": "final-approval",
      "name": "최종 승인",
      "output": ["승인 문서"],
      "deadline": null,
      "status": "PENDING",
      "assignee": {
        "name": "Charlie",
        "email": "charlie@example.com",
        "role": "Product Manager",
        "status": "assigned"
      }
    }
  ],
  "flows": [
    { "from": "design-poster", "to": "review-design", "type": "depends_on" },
    { "from": "review-design", "to": "final-approval", "type": "depends_on" }
  ],
  "checks": {
    "is_dag": true,
    "has_unassigned": false,
    "messages": []
  }
}
```

### 2. **Workflow 수정** (`modify`)
기존 workflow를 최소한으로 변경합니다.

```typescript
const request = {
  action: 'modify',
  user_input: '디자인 리뷰 단계를 두 번 하도록 변경해줘',
  inputed_workflow: existingWorkflow,
  assignee_list: teamMembers,
};
```

### 3. **자동 배정** (`auto_delegate`)
미배정 task를 팀원에게 자동으로 할당합니다.

```typescript
const request = {
  action: 'auto_delegate',
  inputed_workflow: workflowWithUnassignedTasks,
  assignee_list: [
    { name: 'Alice', email: 'alice@example.com', role: 'Frontend Developer' },
    { name: 'Bob', email: 'bob@example.com', role: 'Backend Developer' },
  ],
};

const response = await processPromptWorkflow(request);
// Alice는 UI 관련 task에, Bob은 API 관련 task에 자동 배정됨
```

## 핵심 개념

### Task (Node)
- **최소 단위 업무**: 한 명이 처리 가능한 atomic task
- **Output 중심**: task의 결과물을 명확히 정의
- **Input 자동 유도**: flow를 통해 이전 task의 output이 자동으로 input이 됨

### Flow (Edge)
- **선행-후행 관계**: task 간의 의존성 정의
- **DAG 보장**: 순환 참조 방지 (Directed Acyclic Graph)

### Auto Delegation 알고리즘
1. **Skillset 추론**: Role 문자열을 자연어 분석하여 skillset 추론
2. **Task 분석**: Task 이름과 output을 분석하여 필요한 skillset 추론
3. **매칭**: 의미 유사도 계산으로 최적 assignee 선택
4. **예외 처리**: 적합한 assignee가 없으면 notes에 권장 역할 기록

## 파일 구조

### 백엔드 (AI 처리)
```
backend/src/
├── types/
│   └── prompt.ts              # Prompt 시스템 타입 정의
├── utils/
│   ├── dag.ts                 # DAG 검증 및 위상 정렬
│   └── autoDelegation.ts      # 자동 배정 로직
├── services/
│   ├── gemini.ts              # Gemini API 클라이언트
│   └── promptWorkflow.ts      # Workflow 생성/수정 서비스
└── routes/
    └── prompt.ts              # API 라우트
```

### 프론트엔드 (API 호출)
```
src/
├── types/
│   └── prompt.ts              # Prompt 시스템 타입 정의 (동일)
└── services/
    └── promptWorkflow.ts      # 백엔드 API 호출 서비스
```

## 타입 정의

### PromptWorkflow
```typescript
type PromptWorkflow = {
  workflow_name: string;
  tasks: PromptTask[];
  flows: PromptFlow[];
  checks: WorkflowChecks;
};
```

### PromptTask
```typescript
type PromptTask = {
  id: string;                    // Pattern: ^[a-z0-9][a-z0-9-]{2,62}$
  name: string;
  output: string[];
  deadline: string | null;       // Format: YYYY-MM-DD
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "DONE";
  assignee: PromptAssignee;
  notes: string | null;
};
```

### PromptFlow
```typescript
type PromptFlow = {
  from: string;  // task_id
  to: string;    // task_id
  type: "depends_on";
};
```

## 유틸리티 함수

### DAG 검증
```typescript
import { isDAG, findCycles, topologicalSort } from './utils/dag';

// DAG 여부 확인
const isDag = isDAG(flows);

// 순환 경로 찾기
const cycles = findCycles(flows);

// 위상 정렬
const sorted = topologicalSort(taskIds, flows);
```

### Task ID 생성
```typescript
import { generateTaskId, isValidTaskId } from './utils/dag';

const taskId = generateTaskId('Design Marketing Poster', existingIds);
// Result: "design-marketing-poster"

const isValid = isValidTaskId('my-task-123');
// Result: true
```

## ✅ AI 통합 완료

**Gemini API가 백엔드에 통합되었습니다!**

### 지원 기능
- ✅ **Create**: 자연어 입력으로 새 workflow 생성
- ✅ **Modify**: 기존 workflow를 최소 변경으로 수정
- ✅ **Auto Delegate**: 미배정 task를 팀원에게 자동 배정

### 백엔드 구현 (`backend/src/services/gemini.ts`)
```typescript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateWorkflowJSON(prompt: string): Promise<any> {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp",
    contents: prompt,
  });

  // JSON 추출 및 파싱
  const jsonMatch = response.text.match(/```json\n([\s\S]*?)\n```/);
  return JSON.parse(jsonMatch ? jsonMatch[1] : response.text);
}
```

### 프론트엔드 사용법
```typescript
import { processPromptWorkflow } from './services/promptWorkflow';

const response = await processPromptWorkflow({
  action: 'create',
  user_input: '마케팅 포스터를 만들어야 해',
  assignee_list: workspace.assigneeList,
});

if (response.success) {
  console.log(response.workflow);
}
```

## 예제

### 예제 1: 웹 개발 프로젝트
```typescript
const request = {
  action: 'create',
  user_input: '로그인 기능을 만들어야 해. API 개발, 프론트엔드 구현, 테스트가 필요해.',
  assignee_list: [
    { name: 'Alice', email: 'alice@example.com', role: 'Backend Engineer' },
    { name: 'Bob', email: 'bob@example.com', role: 'Frontend Developer' },
    { name: 'Charlie', email: 'charlie@example.com', role: 'QA Engineer' },
  ],
};
```

### 예제 2: 콘텐츠 제작
```typescript
const request = {
  action: 'create',
  user_input: '블로그 글을 작성하고 SEO 최적화한 다음 발행해야 해.',
  assignee_list: [
    { name: 'David', email: 'david@example.com', role: 'Content Writer' },
    { name: 'Eve', email: 'eve@example.com', role: 'SEO Specialist' },
    { name: 'Frank', email: 'frank@example.com', role: 'Marketing Manager' },
  ],
};
```

## 제약사항

1. **Task ID 형식**: `^[a-z0-9][a-z0-9-]{2,62}$` (소문자, 숫자, 하이픈만 허용)
2. **DAG 필수**: 순환 참조는 허용되지 않음
3. **Output 필수**: 모든 task는 최소 하나의 output이 있어야 함
4. **자동 배정 제한**: 적합한 assignee가 없으면 미배정 상태로 유지

## 테스트

```typescript
import { validateWorkflow } from './services/promptWorkflow';

const workflow = { /* ... */ };
const validation = validateWorkflow(workflow);

if (!validation.valid) {
  console.error('Validation errors:', validation.messages);
}
```

## 향후 개선 사항

- [ ] AI API 통합 (OpenAI, Claude, etc.)
- [ ] 더 정교한 자동 배정 알고리즘 (ML 기반)
- [ ] Task 우선순위 자동 계산
- [ ] Deadline 자동 추천
- [ ] 병렬 실행 가능한 task 그룹 식별
- [ ] 워크플로우 템플릿 라이브러리
