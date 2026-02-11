import type {
  HookCallback,
  PreToolUseHookInput,
  SyncHookJSONOutput,
} from "@anthropic-ai/claude-agent-sdk";
import { Config } from "../../utils/Config.js";

const autoApproveSet = new Set(Config.allowedTools);

export const autoApproveHook: HookCallback = async (
  input,
  _toolUseID,
  _options,
): Promise<SyncHookJSONOutput> => {
  if (input.hook_event_name !== "PreToolUse") return {};

  const { tool_name } = input as PreToolUseHookInput;

  if (autoApproveSet.has(tool_name) || tool_name.startsWith("mcp__")) {
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
