# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run

```bash
npm install       # install dependencies
npm run build     # tsc → dist/
npm start         # node dist/index.js
npm run dev       # tsc --watch (development)
```

No test framework is configured. No linter is configured.

## Environment

`.env` 파일 필수 (`.env.example` 참조). 최소 `BOT_TOKEN`과 `AUTHORIZED_USERS` 필요.

## Architecture

Telegram Bot을 통해 Claude Agent SDK를 원격 호출하는 브릿지. Grammy + TypeScript ESM (`"type": "module"`).

### Core Flow

```
User (Telegram) → TelegramBot → MessageHandler → ClaudeService → Claude Agent SDK
                                                       ↓
                                                 SessionManager (JSON file persistence)
```

### Key Components

- **`src/index.ts`** — 엔트리포인트. Config → SessionManager → ClaudeService → TelegramBot 순으로 초기화
- **`src/bot/TelegramBot.ts`** — Grammy Bot. 인증 미들웨어(AUTHORIZED_USERS 체크) → 커맨드 → 메시지 핸들러 순으로 등록
- **`src/claude/ClaudeService.ts`** — SDK `query()` 래퍼. 세션 resume 시도 → 실패 시 새 세션 fallback. `activeQueries` Map으로 사용자당 동시 쿼리 방지
- **`src/claude/SessionManager.ts`** — `data/sessions.json`에 사용자별 세션(프로젝트 경로, SDK 세션 ID) 영속화
- **`src/claude/hooks/AutoApproveHook.ts`** — PreToolUse hook. `ALLOWED_TOOLS` 목록과 `mcp__` 접두어 도구를 자동 승인
- **`src/approval/ApprovalManager.ts`** — Promise 기반 승인 동기화 (EventEmitter). Hook이 Promise 대기 → Telegram 콜백으로 resolve. 현재 미사용 (향후 수동 승인 기능용)
- **`src/utils/MessageFormatter.ts`** — Claude Markdown → Telegram MarkdownV2 변환 + 4096자 분할

### Patterns

- **커맨드 팩토리**: `createXxxCommand(dependencies)` 패턴으로 DI. `src/bot/commands/` 하위에 커맨드별 파일 분리
- **비동기 쿼리 핸들링**: `MessageHandler.handle()`에서 Claude 쿼리를 `await` 하지 않음. Grammy의 순차 업데이트 처리와 데드락 방지를 위해 fire-and-forget 후 `ctx.api.sendMessage()`로 직접 전송
- **로거**: `createLogger(prefix)` 팩토리. `LOG_LEVEL` 환경변수로 레벨 조정
- **경로 해석**: `/project` 커맨드에서 상대경로는 `PROJECT_BASE_DIR` 기준, `~/`는 홈 디렉토리, `/`는 절대경로

### TypeScript

- `strict: true`, target ES2022, module Node16
- 모든 import에 `.js` 확장자 필수 (ESM)
