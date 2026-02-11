# Telegram Claude Bridge

Telegram Bot을 통해 Claude Code를 원격으로 제어하는 브릿지 애플리케이션.

Grammy (TypeScript) + Claude Agent SDK 기반으로, 로컬 머신에서 실행됩니다.

## 설치

```bash
git clone git@github.com:Daworks/TelegramClaudeBridge.git
cd TelegramClaudeBridge
npm install
npm run build
```

## .env 설정

`.env.example`을 복사하여 `.env` 파일을 만들고, 아래 가이드에 따라 값을 입력합니다.

```bash
cp .env.example .env
```

### BOT_TOKEN

Telegram Bot의 인증 토큰입니다.

1. Telegram에서 [@BotFather](https://t.me/BotFather)를 검색하여 대화를 시작합니다.
2. `/newbot` 명령을 보냅니다.
3. Bot 이름(표시명)을 입력합니다. (예: `My Claude Bridge`)
4. Bot username을 입력합니다. 반드시 `Bot`으로 끝나야 합니다. (예: `my_claude_bridge_bot`)
5. BotFather가 발급한 토큰을 복사합니다. 형식은 다음과 같습니다:
   ```
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

```env
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

> 토큰이 노출되면 `/revoke` 명령으로 즉시 재발급하세요.

### AUTHORIZED_USERS

이 봇을 사용할 수 있는 Telegram 사용자의 ID 목록입니다. 허가되지 않은 사용자의 메시지는 무시됩니다.

**사용자 ID 확인 방법:**

1. Telegram에서 [@userinfobot](https://t.me/userinfobot)을 검색합니다.
2. `/start`를 보내면 본인의 User ID(숫자)가 표시됩니다.

```env
# 단일 사용자
AUTHORIZED_USERS=123456789

# 여러 사용자 (쉼표로 구분, 공백 가능)
AUTHORIZED_USERS=123456789, 987654321
```

### PROJECT_BASE_DIR

`/project` 명령에서 상대 경로의 기준이 되는 디렉토리입니다. 기본값은 `~/develope`입니다.

```env
PROJECT_BASE_DIR=~/develope
```

예를 들어 `PROJECT_BASE_DIR=~/develope`로 설정하면:

| 입력 | 해석 결과 |
|------|-----------|
| `/project my-app` | `~/develope/my-app` |
| `/project ~/other/path` | `~/other/path` (`~/`는 홈 기준) |
| `/project /absolute/path` | `/absolute/path` (절대경로 그대로) |

### ALLOWED_TOOLS

Claude Code가 실행할 수 있는 도구 목록입니다. 쉼표로 구분하며, 여기에 포함된 도구만 자동 승인됩니다.

```env
ALLOWED_TOOLS=Bash,Read,Write,Edit,Glob,Grep,NotebookEdit,WebSearch,WebFetch,Task,TodoWrite
```

사용 가능한 도구:

| 도구 | 설명 |
|------|------|
| `Bash` | 터미널 명령 실행 |
| `Read` | 파일 읽기 |
| `Write` | 파일 생성/덮어쓰기 |
| `Edit` | 파일 부분 수정 |
| `Glob` | 파일 패턴 검색 |
| `Grep` | 파일 내용 검색 |
| `NotebookEdit` | Jupyter 노트북 편집 |
| `WebSearch` | 웹 검색 |
| `WebFetch` | 웹 페이지 내용 가져오기 |
| `Task` | 하위 에이전트 실행 |
| `TodoWrite` | 작업 목록 관리 |

> MCP 도구(`mcp__`로 시작)는 목록과 무관하게 항상 자동 승인됩니다.

### DATA_DIR

세션 데이터가 저장되는 디렉토리 경로입니다. 기본값은 프로젝트 루트의 `./data`입니다.

```env
DATA_DIR=./data
```

이 디렉토리에 `sessions.json` 파일이 생성되어 사용자별 프로젝트 경로와 세션 ID가 저장됩니다. 앱 재시작 시에도 세션이 유지됩니다.

### APPROVAL_TIMEOUT_MS

도구 실행 승인 요청의 타임아웃(밀리초)입니다. 기본값은 `300000` (5분)입니다.

```env
APPROVAL_TIMEOUT_MS=300000
```

> 현재 모든 도구가 자동 승인되므로 이 값은 사용되지 않지만, 추후 수동 승인 기능 활성화 시 적용됩니다.

### .env 전체 예시

```env
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
AUTHORIZED_USERS=123456789
PROJECT_BASE_DIR=~/develope
ALLOWED_TOOLS=Bash,Read,Write,Edit,Glob,Grep,NotebookEdit,WebSearch,WebFetch,Task,TodoWrite
DATA_DIR=./data
APPROVAL_TIMEOUT_MS=300000
```

## 실행

```bash
npm start
```

## 사용법

| 명령어 | 설명 |
|--------|------|
| `/start` | 환영 메시지 |
| `/project <name>` | 프로젝트 설정 (`PROJECT_BASE_DIR` 기준 상대경로) |
| `/project` | 현재 프로젝트 확인 |
| `/session` | 세션 정보 조회 |
| `/clear` | 대화 초기화 (프로젝트 유지, 새 세션) |
| `/stop` | 세션 완전 삭제 |
| `/help` | 명령어 목록 |

프로젝트 설정 후 일반 텍스트를 보내면 Claude에게 전달됩니다.
