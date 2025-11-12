# Docker Credential Helper 오류 해결

## 문제
```
error getting credentials - err: exec: "docker-credential-desktop": executable file not found in $PATH
```

## 해결 방법 (3가지 중 선택)

### 방법 1: Docker Desktop 재시작 (가장 간단)
1. Docker Desktop 완전히 종료
2. Docker Desktop 다시 시작
3. `docker compose up` 다시 실행

### 방법 2: Docker config 수정
```bash
# 1. Docker config 백업
cp ~/.docker/config.json ~/.docker/config.json.backup

# 2. credsStore 제거
cat > ~/.docker/config.json << 'EOF'
{
  "auths": {},
  "currentContext": "desktop-linux"
}
EOF

# 3. Docker compose 실행
docker compose up
```

### 방법 3: Credential store 비활성화 (임시)
```bash
# Docker config에서 credsStore 항목 제거
sed -i.bak 's/"credsStore": "desktop",//g' ~/.docker/config.json

# Docker compose 실행
docker compose up
```

## 추천
**방법 1**을 먼저 시도하세요. 대부분의 경우 Docker Desktop 재시작으로 해결됩니다.
