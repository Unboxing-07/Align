# Align Backend API Documentation

Base URL: `http://localhost:8080`

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## 🔐 Auth Endpoints

### POST /api/auth/signup
회원가입

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /api/auth/login
로그인

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /api/auth/me
현재 사용자 정보 (🔒 Protected)

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe"
}
```

---

## 🏢 Workspace Endpoints

### POST /api/workspaces
워크스페이스 생성 (🔒 Protected)

**Request:**
```json
{
  "name": "My Workspace"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "My Workspace",
  "assigneeList": [
    {
      "name": "John Doe",
      "email": "user@example.com",
      "role": "owner"
    }
  ],
  "workflow": []
}
```

### GET /api/workspaces
내가 속한 워크스페이스 목록 (🔒 Protected)

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "My Workspace",
    "assigneeList": [...],
    "workflow": []
  }
]
```

### GET /api/workspaces/:id
워크스페이스 상세 정보 (🔒 Protected)

**Response (200):**
```json
{
  "id": "uuid",
  "name": "My Workspace",
  "assigneeList": [...],
  "workflow": []
}
```

### PUT /api/workspaces/:id
워크스페이스 수정 (🔒 Protected, Owner only)

**Request:**
```json
{
  "name": "Updated Workspace Name"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Updated Workspace Name",
  "assigneeList": [...],
  "workflow": []
}
```

### DELETE /api/workspaces/:id
워크스페이스 삭제 (🔒 Protected, Owner only)

**Response (200):**
```json
{
  "success": true
}
```

---

## 👥 Member Endpoints

### POST /api/workspaces/:id/members
멤버 추가 (🔒 Protected, Owner only)

**Request:**
```json
{
  "email": "member@example.com",
  "role": "member"
}
```

**Response (201):**
```json
{
  "name": "Jane Doe",
  "email": "member@example.com",
  "role": "member"
}
```

### GET /api/workspaces/:id/members
워크스페이스 멤버 목록 (🔒 Protected)

**Response (200):**
```json
[
  {
    "name": "John Doe",
    "email": "owner@example.com",
    "role": "owner"
  },
  {
    "name": "Jane Doe",
    "email": "member@example.com",
    "role": "member"
  }
]
```

### PUT /api/workspaces/:id/members/:userId
멤버 역할 변경 (🔒 Protected, Owner only)

**Request:**
```json
{
  "role": "admin"
}
```

**Response (200):**
```json
{
  "name": "Jane Doe",
  "email": "member@example.com",
  "role": "admin"
}
```

### DELETE /api/workspaces/:id/members/:userId
멤버 제거 (🔒 Protected, Owner only)

**Response (200):**
```json
{
  "success": true
}
```

---

## ✅ Task Endpoints

### POST /api/workspaces/:id/tasks
태스크 생성 (🔒 Protected)

**Request:**
```json
{
  "title": "Implement feature",
  "description": "Detailed description",
  "assigneeId": "user-uuid",
  "input": "Input requirements",
  "output": "Expected output",
  "deadline": "2025-12-31T23:59:59Z",
  "status": "pending"
}
```

**Response (201):**
```json
{
  "title": "Implement feature",
  "description": "Detailed description",
  "assignee": {
    "name": "Jane Doe",
    "email": "member@example.com",
    "role": "member"
  },
  "input": "Input requirements",
  "output": "Expected output",
  "deadline": "2025-12-31T23:59:59.000Z",
  "status": "pending"
}
```

### GET /api/workspaces/:id/tasks
워크스페이스 태스크 목록 (🔒 Protected)

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `progress`, `completed`, `done`)

**Response (200):**
```json
[
  {
    "title": "Implement feature",
    "description": "Detailed description",
    "assignee": {
      "name": "Jane Doe",
      "email": "member@example.com",
      "role": "member"
    },
    "input": "Input requirements",
    "output": "Expected output",
    "deadline": "2025-12-31T23:59:59.000Z",
    "status": "pending"
  }
]
```

### GET /api/tasks/detail/:taskId
태스크 상세 정보 (🔒 Protected)

**Response (200):**
```json
{
  "title": "Implement feature",
  "description": "Detailed description",
  "assignee": {...},
  "input": "Input requirements",
  "output": "Expected output",
  "deadline": "2025-12-31T23:59:59.000Z",
  "status": "pending"
}
```

### PUT /api/tasks/detail/:taskId
태스크 수정 (🔒 Protected)

**Request (모든 필드 optional):**
```json
{
  "title": "Updated title",
  "status": "progress"
}
```

**Response (200):**
```json
{
  "title": "Updated title",
  "description": "Detailed description",
  "assignee": {...},
  "input": "Input requirements",
  "output": "Expected output",
  "deadline": "2025-12-31T23:59:59.000Z",
  "status": "progress"
}
```

### DELETE /api/tasks/detail/:taskId
태스크 삭제 (🔒 Protected)

**Response (200):**
```json
{
  "success": true
}
```

---

## Error Responses

모든 에러는 다음 형식으로 반환됩니다:

```json
{
  "error": "Error message description"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid token or credentials)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., user already exists)
- `500` - Internal Server Error

---

## Testing with cURL

### 1. Signup
```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","name":"Test User","password":"test123"}'
```

### 2. Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

### 3. Create Workspace (with token)
```bash
curl -X POST http://localhost:8080/api/workspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"name":"My First Workspace"}'
```

### 4. Get Workspaces
```bash
curl http://localhost:8080/api/workspaces \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
