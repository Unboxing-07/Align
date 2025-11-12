🎯 Align Backend (Express.js) - 프로토타입 개발 계획

> **⚡ 프로토타입 특성**: 빠른 개발과 프론트엔드 연동을 최우선으로 합니다.
> Docker 하나로 DB + 백엔드 모두 실행 가능하도록 설계되었습니다.

📊 현재 상태 분석

프론트엔드 현황

- ✅ 완성: React 19 + TypeScript + Tailwind CSS UI
- ❌ 미구현: API 연동 (모든 데이터가 Mock/하드코딩)
- ✅ 타입 정의: src/types/ 폴더에 완벽히 정의됨
- ⚠️ 제외 기능: 워크플로우(Workflow) 관련 기능

필요한 기능

1. 인증 (Authentication) - 회원가입, 로그인
2. 워크스페이스 관리 - CRUD 작업 <- Create와 read만 되면 됨.
3. 멤버 관리 - 워크스페이스 멤버 추가/삭제/조회
4. 태스크 관리 - CRUD 작업 <- 아직 미구현

---

🏗️ 기술 스택

백엔드 프레임워크

- Express.js 4.x (TypeScript)
- Node.js 18+
- PostgreSQL (데이터베이스)
- Prisma ORM (타입 안전성)

핵심 라이브러리 (프로토타입 최소 구성)

dependencies: {
express: "^4.18.2", // 웹 프레임워크
@prisma/client: "^5.7.0", // ORM 클라이언트
bcrypt: "^5.1.1", // 비밀번호 해싱
jsonwebtoken: "^9.0.2", // JWT 인증
cors: "^2.8.5", // CORS 처리
dotenv: "^16.3.1" // 환경변수
}

// 프로토타입에서 제외된 라이브러리:
// - helmet: 기본 보안만으로 충분
// - express-validator: 간단한 검증만 사용

---

📁 프로젝트 구조 (프로토타입 간소화)

backend/
├── src/
│ ├── routes/
│ │ ├── auth.ts # 인증 API (라우트 + 로직 통합)
│ │ ├── workspace.ts # 워크스페이스 API
│ │ ├── member.ts # 멤버 API
│ │ └── task.ts # 태스크 API
│ ├── middleware/
│ │ └── auth.ts # JWT 검증만
│ ├── db.ts # Prisma client
│ ├── jwt.ts # JWT 유틸리티
│ └── index.ts # Express 앱 + 진입점
├── prisma/
│ ├── schema.prisma # DB 스키마
│ └── migrations/
├── Dockerfile # ⭐ 백엔드 컨테이너
├── docker-compose.yml # ⭐ DB + 백엔드 오케스트레이션
├── .env
├── .env.example
├── package.json
└── tsconfig.json

**프로토타입 간소화 포인트:**

- ❌ controllers, services 분리 제거 → routes에 통합
- ❌ config, utils 폴더 제거 → 개별 파일로 관리
- ❌ 복잡한 에러 미들웨어 제거 → try-catch로 충분
- ✅ Docker로 한 번에 실행 가능

---

🗄️ 데이터베이스 스키마 (Prisma)

// prisma/schema.prisma

model User {
id String @id @default(uuid())
email String @unique
name String
password String // bcrypt 해싱
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

    // Relations
    ownedWorkspaces  Workspace[]
    workspaceMembers WorkspaceMember[]
    assignedTasks    Task[]            @relation("TaskAssignee")

}

model Workspace {
id String @id @default(uuid())
name String
ownerId String
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

    // Relations
    owner   User              @relation(fields: [ownerId], references: [id], onDelete: Cascade)
    members WorkspaceMember[]
    tasks   Task[]

}

model WorkspaceMember {
workspaceId String
userId String
role String // "owner", "admin", "member" 등
addedAt DateTime @default(now())

    // Relations
    workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
    user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@id([workspaceId, userId])
    @@index([userId])

}

model Task {
id String @id @default(uuid())
workspaceId String
title String
description String @db.Text
assigneeId String
input String @db.Text
output String @db.Text
deadline DateTime
status TaskStatus @default(pending)
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

    // Relations
    workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
    assignee  User      @relation("TaskAssignee", fields: [assigneeId], references: [id])

    @@index([workspaceId])
    @@index([assigneeId])
    @@index([status])

}

enum TaskStatus {
pending
progress
completed
done
}

---

🔌 API 엔드포인트 명세

1️⃣ 인증 (Authentication)

POST /api/auth/signup

// Request (SignupReqType)
{
email: string;
name: string;
password: string;
}

// Response (SignupResType)
{
token: string;
}

// Status Codes
201 Created
400 Bad Request (validation error)
409 Conflict (email already exists)

POST /api/auth/login

// Request (LoginReqType)
{
email: string;
password: string;
}

// Response (LoginResType)
{
token: string;
}

// Status Codes
200 OK
400 Bad Request
401 Unauthorized (wrong credentials)

GET /api/auth/me

// Headers
Authorization: Bearer <token>

// Response
{
id: string;
email: string;
name: string;
}

// Status Codes
200 OK
401 Unauthorized

---

2️⃣ 워크스페이스 (Workspaces)

POST /api/workspaces

워크스페이스 생성
// Request
{
name: string;
}

// Response (WorkspaceType)
{
id: string;
name: string;
assigneeList: AssigneeType[]; // [생성자]
workflow: []; // 빈 배열 (워크플로우 제외)
}

// Status: 201 Created

GET /api/workspaces

내가 속한 워크스페이스 목록
// Response
WorkspaceType[]

// Status: 200 OK

GET /api/workspaces/:id

워크스페이스 상세 정보
// Response (WorkspaceType)
{
id: string;
name: string;
assigneeList: AssigneeType[];
workflow: []; // 항상 빈 배열
}

// Status: 200 OK | 403 Forbidden | 404 Not Found

PUT /api/workspaces/:id

워크스페이스 이름 수정 (소유자만)
// Request
{
name: string;
}

// Response: Updated WorkspaceType
// Status: 200 OK | 403 Forbidden

DELETE /api/workspaces/:id

워크스페이스 삭제 (소유자만)
// Response
{ success: true }

// Status: 200 OK | 403 Forbidden

---

3️⃣ 멤버 관리 (Workspace Members)

POST /api/workspaces/:id/members

멤버 추가 (이메일로 초대)
// Request
{
email: string; // 초대할 사용자 이메일
role: string; // "member", "admin" 등
}

// Response (AssigneeType)
{
name: string;
email: string;
role: string;
}

// Status: 201 Created | 400 Bad Request | 403 Forbidden | 404 Not Found

GET /api/workspaces/:id/members

워크스페이스 멤버 목록
// Response
AssigneeType[]

// Status: 200 OK | 403 Forbidden

PUT /api/workspaces/:id/members/:userId

멤버 역할 변경 (소유자만)
// Request
{
role: string;
}

// Response: Updated AssigneeType
// Status: 200 OK | 403 Forbidden

DELETE /api/workspaces/:id/members/:userId

멤버 제거
// Response
{ success: true }

// Status: 200 OK | 403 Forbidden | 404 Not Found

---

4️⃣ 태스크 관리 (Tasks)

POST /api/workspaces/:id/tasks

태스크 생성
// Request
{
title: string;
description: string;
assigneeId: string; // 담당자 ID
input: string;
output: string;
deadline: string; // ISO 8601 format
status: "pending" | "progress" | "completed" | "done";
}

// Response (TaskType)
{
title: string;
description: string;
assignee: AssigneeType; // 전체 객체로 반환
input: string;
output: string;
deadline: Date;
status: TaskStatusType;
}

// Status: 201 Created

GET /api/workspaces/:id/tasks

워크스페이스 태스크 목록
// Query Parameters (optional)
?status=pending|progress|completed|done

// Response
TaskType[]

// Status: 200 OK | 403 Forbidden

GET /api/tasks/:taskId

태스크 상세 정보
// Response
TaskType

// Status: 200 OK | 403 Forbidden | 404 Not Found

PUT /api/tasks/:taskId

태스크 수정
// Request (Partial TaskType)
{
title?: string;
description?: string;
assigneeId?: string;
input?: string;
output?: string;
deadline?: string;
status?: TaskStatusType;
}

// Response: Updated TaskType
// Status: 200 OK | 403 Forbidden

DELETE /api/tasks/:taskId

태스크 삭제
// Response
{ success: true }

// Status: 200 OK | 403 Forbidden

---

🐳 Docker 설정 (핵심!)

docker-compose.yml - 한 명령으로 전체 실행

version: '3.8'

services:
db:
image: postgres:15-alpine
environment:
POSTGRES_USER: align
POSTGRES_PASSWORD: align123
POSTGRES_DB: align
volumes: - postgres_data:/var/lib/postgresql/data
ports: - "5432:5432"

backend:
build: .
depends_on: - db
environment:
DATABASE_URL: postgresql://align:align123@db:5432/align
JWT_SECRET: dev-secret-key
PORT: 3000
volumes: - ./src:/app/src # Hot-reload - ./prisma:/app/prisma
ports: - "3000:3000" # API - "5555:5555" # Prisma Studio
command: npm run dev

volumes:
postgres_data:

Dockerfile - 개발 환경 최적화

FROM node:18-alpine

WORKDIR /app

# Dependencies

COPY package\*.json ./
RUN npm install

# Prisma

COPY prisma ./prisma
RUN npx prisma generate

# App

COPY . .

# 개발 모드에서 마이그레이션 자동 실행

CMD npx prisma migrate deploy && npm run dev

실행 방법

# 전체 시스템 시작 (DB + 백엔드)

docker-compose up

# 백그라운드 실행

docker-compose up -d

# 로그 확인

docker-compose logs -f backend

# Prisma Studio 접속

# 브라우저에서 http://localhost:5555

# 중지

docker-compose down

---

🔐 인증 & 보안 (프로토타입 수준)

JWT 토큰 구조

{
userId: string;
email: string;
iat: number; // issued at
exp: number; // expires in 7 days
}

보안 조치 (프로토타입 필수만)

- ✅ 비밀번호: bcrypt 해싱 (salt rounds: 10)
- ✅ JWT Secret: 환경변수에서 로드
- ✅ CORS: 프론트엔드 origin만 허용
- ✅ SQL Injection 방지: Prisma ORM 사용
- ❌ Helmet: 프로토타입에서 제외
- ❌ Rate Limiting: 프로토타입에서 제외
- ❌ 복잡한 입력 검증: 기본 체크만

권한 체크 (최소한만)

// 워크스페이스 접근: 멤버여야 함
// 워크스페이스 수정/삭제: 소유자여야 함
// 멤버 추가/삭제: 소유자만 (관리자 역할 제외)
// 태스크 CRUD: 워크스페이스 멤버면 모두 가능

---

📝 프로토타입 구현 단계 (총 4일)

Phase 1: Docker + 프로젝트 셋업 (0.5일)

# 1. 프로젝트 초기화

mkdir backend && cd backend
npm init -y

# 2. 의존성 설치 (최소 구성)

npm install express @prisma/client bcrypt jsonwebtoken cors dotenv
npm install -D typescript @types/node @types/express @types/bcrypt @types/jsonwebtoken @types/cors ts-node nodemon prisma

# 3. 설정 파일

npx tsc --init
npx prisma init

# 4. 간소화된 폴더 구조

mkdir -p src/{routes,middleware}

# 5. Docker 파일 작성

touch Dockerfile docker-compose.yml

체크리스트:

- ✅ package.json 설정
- ✅ tsconfig.json 설정
- ✅ Dockerfile 작성
- ✅ docker-compose.yml 작성
- ✅ .env.example 작성

---

Phase 2: DB Schema + 기본 구조 (0.5일)

# 1. Prisma schema 작성

# prisma/schema.prisma

# 2. Docker로 전체 시스템 시작

docker-compose up -d

# 3. Prisma 마이그레이션 (자동 실행됨)

# 4. 기본 파일 작성

- src/db.ts # Prisma client
- src/jwt.ts # JWT 헬퍼
- src/index.ts # Express 앱
- src/middleware/auth.ts # JWT 미들웨어

체크리스트:

- ✅ DB Schema 정의
- ✅ Docker로 실행 확인
- ✅ Prisma Studio 접속 확인 (localhost:5555)
- ✅ 기본 Express 앱 동작 확인

---

Phase 3: 인증 + 워크스페이스 API (1.5일)

# 통합 구현 (라우트에 로직 포함)

1. src/routes/auth.ts

   - POST /api/auth/signup
   - POST /api/auth/login
   - GET /api/auth/me

2. src/routes/workspace.ts
   - POST /api/workspaces (생성)
   - GET /api/workspaces (목록)
   - GET /api/workspaces/:id (상세)

체크리스트:

- ✅ 회원가입/로그인 구현
- ✅ JWT 토큰 발급
- ✅ 워크스페이스 생성/조회
- ✅ 생성자 자동 멤버 추가
- ✅ 간단한 에러 처리 (try-catch)
- ✅ cURL 또는 Thunder Client로 테스트

---

Phase 4: 멤버 + 태스크 API (1.5일)

1. src/routes/member.ts

   - POST /api/workspaces/:id/members (추가)
   - GET /api/workspaces/:id/members (목록)
   - DELETE /api/workspaces/:id/members/:userId (제거)

2. src/routes/task.ts
   - POST /api/workspaces/:id/tasks (생성)
   - GET /api/workspaces/:id/tasks (목록)
   - GET /api/tasks/:taskId (상세)
   - PUT /api/tasks/:taskId (수정)
   - DELETE /api/tasks/:taskId (삭제)

체크리스트:

- ✅ 멤버 초대/제거 구현
- ✅ 태스크 CRUD 구현
- ✅ status 필터링
- ✅ assignee 정보 populate
- ✅ 기본 권한 체크
- ✅ 프론트엔드 연동 테스트

프로토타입에서 제외:

- ❌ 상세한 입력 검증
- ❌ Rate limiting
- ❌ 복잡한 에러 처리
- ❌ 테스트 코드
- ❌ API 문서화 (README에 간단히만)

---

🌐 환경변수 (.env) - Docker로 자동 관리

# docker-compose.yml에서 설정됨

# 로컬 개발 시 .env 파일 불필요

DATABASE_URL="postgresql://align:align123@db:5432/align"
JWT_SECRET="dev-secret-key"
PORT=8080
FRONTEND_URL="http://localhost:3000"

# Prisma Studio는 자동으로 5555 포트에서 실행

---

🔧 package.json Scripts (간소화)

{
"scripts": {
"dev": "nodemon --exec ts-node src/index.ts",
"prisma:studio": "prisma studio"
}
}

# 프로토타입에서 제외:

# - build: Docker에서 직접 ts-node 사용

# - start: 프로덕션 빌드 불필요

# - migrate: Dockerfile CMD에서 자동 실행

---

📋 프론트엔드 연동 가이드

1. Axios 설정

// src/services/api.ts
import axios from 'axios';

const api = axios.create({
baseURL: 'http://localhost:3000/api',
});

// 토큰 자동 추가
api.interceptors.request.use((config) => {
const token = localStorage.getItem('token');
if (token) {
config.headers.Authorization = `Bearer ${token}`;
}
return config;
});

export default api;

2. 인증 서비스

// src/services/authService.ts
import api from './api';
import type { LoginReqType, SignupReqType } from '@/types/sign';

export const authService = {
async signup(data: SignupReqType) {
const response = await api.post('/auth/signup', data);
localStorage.setItem('token', response.data.token);
return response.data;
},

    async login(data: LoginReqType) {
      const response = await api.post('/auth/login', data);
      localStorage.setItem('token', response.data.token);
      return response.data;
    },

    logout() {
      localStorage.removeItem('token');
    }

};

---

🎯 예상 소요 시간 (프로토타입)

| Phase    | 작업 내용               | 소요 시간 |
| -------- | ----------------------- | --------- |
| 1        | Docker + 프로젝트 셋업  | 0.5일     |
| 2        | DB Schema + 기본 구조   | 0.5일     |
| 3        | 인증 + 워크스페이스 API | 1.5일     |
| 4        | 멤버 + 태스크 API       | 1.5일     |
| **총계** | **프로토타입 완성**     | **4일**   |

**50% 시간 단축 이유:**

- Docker로 환경 설정 자동화
- 폴더 구조 간소화 (라우트에 로직 통합)
- 복잡한 검증/에러 처리 제외
- 테스트 & 문서화 최소화

---

✅ 프로토타입 완료 기준

프로토타입 백엔드가 완료되었다고 판단할 수 있는 기준:

**필수 (Must Have):**

1. ✅ `docker-compose up` 한 명령으로 실행 가능
2. ✅ 모든 API 엔드포인트가 정상 작동
3. ✅ 프론트엔드 타입과 100% 일치
4. ✅ JWT 인증이 보호된 라우트에서 작동
5. ✅ CORS 설정으로 프론트엔드 연동 가능
6. ✅ 기본적인 권한 검증 (소유자, 멤버)
7. ✅ 워크플로우 기능 제외 확인

**선택 (Nice to Have) - 프로토타입에서 제외:**

- ❌ 상세한 API 문서
- ❌ 자동화 테스트
- ❌ 복잡한 에러 핸들링
- ❌ Rate limiting
- ❌ Logging 시스템

---

🚀 시작하기

# 1. 전체 시스템 실행 (한 줄!)

docker-compose up

# 2. 프론트엔드에서 API 연동

# localhost:3000/api/\* 로 요청

# 3. DB 확인

# localhost:5555 에서 Prisma Studio

**이 계획서를 따라 4일 안에 프론트엔드의 모든 TODO 주석을 실제 API 호출로 대체할 수 있습니다!**
