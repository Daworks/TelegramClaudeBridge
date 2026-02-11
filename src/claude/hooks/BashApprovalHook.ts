import type {
  HookCallback,
  PreToolUseHookInput,
  SyncHookJSONOutput,
} from "@anthropic-ai/claude-agent-sdk";
import type { ApprovalManager } from "../../approval/ApprovalManager.js";
import { createLogger } from "../../utils/Logger.js";

const log = createLogger("BashHook");

/**
 * Bash 명령 실행 전 Telegram 사용자 승인을 요청하는 Hook.
 *
 * 흐름:
 * 1. SDK가 Bash 도구 호출 시 이 Hook 실행
 * 2. ApprovalManager.requestApproval() → Telegram에 승인 버튼 전송
 * 3. Promise 대기 (사용자 버튼 클릭 또는 타임아웃까지)
 * 4. 결과에 따라 allow/deny 반환 → SDK가 Bash 실행 여부 결정
 */
export function createBashApprovalHook(
  approvalManager: ApprovalManager,
  getUserId: () => number,
): HookCallback {
  return async (input, _toolUseID, _options): Promise<SyncHookJSONOutput> => {
    if (input.hook_event_name !== "PreToolUse") return {};

    const { tool_name, tool_input } = input as PreToolUseHookInput;
    if (tool_name !== "Bash") return {};

    const command = (tool_input as Record<string, unknown>).command as string;
    const userId = getUserId();

    log.info(`Bash approval requested: ${command}`);

    const decision = await approvalManager.requestApproval(
      userId,
      tool_name,
      command,
    );

    if (decision.approved) {
      return {
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "allow",
          permissionDecisionReason: "Approved via Telegram",
        },
      };
    }

    return {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason:
          decision.reason ?? "Denied via Telegram",
      },
    };
  };
}
