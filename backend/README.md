# Align Backend API

프로토타입 백엔드 API 서버 (Express.js + PostgreSQL + Prisma)

## 🚀 빠른 시작

### 필수 요구사항
- Docker Desktop 설치 및 실행

### 1단계: Docker로 전체 시스템 실행

```bash
# Docker Desktop을 먼저 실행하세요!

# 전체 시스템 시작 (DB + 백엔드)
docker compose up

# 또는 백그라운드 실행
docker compose up -d

# 로그 확인
docker compose logs -f backend
```

### 2단계: 접속 확인

- **API 서버**: http://localhost:8080
- **Health Check**: http://localhost:8080/health
- **Prisma Studio** (DB 관리): http://localhost:5555

### 3단계: 프론트엔드 연동

프론트엔드에서 `http://localhost:8080/api/*`로 API 호출

## 📁 프로젝트 구조

```
backend/
├── src/
│   ├── routes/          # API 라우트
│   │   ├── auth.ts      # 인증 (Phase 3에서 추가)
│   │   ├── workspace.ts # 워크스페이스
│   │   ├── member.ts    # 멤버
│   │   └── task.ts      # 태스크
│   ├── middleware/
│   │   └── auth.ts      # JWT 인증 미들웨어
│   ├── db.ts            # Prisma client
│   ├── jwt.ts           # JWT 유틸리티
│   └── index.ts         # Express 앱
├── prisma/
│   └── schema.prisma    # DB 스키마
├── Dockerfile
└── docker-compose.yml
```

## 🛠️ 개발 명령어

```bash
# 중지
docker compose down

# 완전 초기화 (DB 데이터 포함)
docker compose down -v

# 컨테이너 재빌드
docker compose up --build

# Prisma Studio만 실행 (DB가 이미 실행 중일 때)
npm run prisma:studio
```

## 📊 DB 스키마

- **User**: 사용자 정보
- **Workspace**: 워크스페이스
- **WorkspaceMember**: 워크스페이스 멤버 (다대다 관계)
- **Task**: 태스크 (할일)

## 🔐 환경변수

모든 환경변수는 `docker-compose.yml`에서 관리됩니다.

- `DATABASE_URL`: PostgreSQL 연결 URL
- `JWT_SECRET`: JWT 토큰 시크릿 키
- `PORT`: 서버 포트 (기본: 8080)
- `FRONTEND_URL`: CORS 허용 URL (프론트엔드: http://localhost:3000)

## 📝 다음 단계

Phase 2: DB Schema 확인 후 Phase 3에서 API 구현 시작!

## ❗️ 문제 해결

### Docker 데몬이 실행되지 않은 경우
```
Error: Cannot connect to the Docker daemon
```
→ Docker Desktop을 실행하세요

### 포트가 이미 사용 중인 경우
```
Error: port is already allocated
```
→ docker-compose.yml의 포트 번호 변경 (8080 → 8081 등)
