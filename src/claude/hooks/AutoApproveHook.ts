import type {
  HookCallback,
  PreToolUseHookInput,
  SyncHookJSONOutput,
} from "@anthropic-ai/claude-agent-sdk";

/**
 * 파일 읽기/수정, 검색, MCP 도구를 자동 승인하는 Hook.
 * Bash 이외의 안전한 도구들은 사용자 승인 없이 실행됩니다.
 */

const AUTO_APPROVE_TOOLS = new Set([
  "Bash",
  "Read",
  "Write",
  "Edit",
  "Glob",
  "Grep",
  "NotebookEdit",
  "WebSearch",
  "WebFetch",
  "Task",
  "TodoWrite",
]);

export const autoApproveHook: HookCallback = async (
  input,
  _toolUseID,
  _options,
): Promise<SyncHookJSONOutput> => {
  if (input.hook_event_name !== "PreToolUse") return {};

  const { tool_name } = input as PreToolUseHookInput;

  // 명시적으로 허용된 도구이거나 MCP 도구인 경우 자동 승인
  if (AUTO_APPROVE_TOOLS.has(tool_name) || tool_name.startsWith("mcp__")) {
    return {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "allow",
        permissionDecisionReason: "Auto-approved by Telegram bridge",
      },
    };
  }

  return {};
};
