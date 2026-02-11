import {
  query,
  type SDKMessage,
  type SDKResultSuccess,
  type SDKAssistantMessage,
  type Query,
  type Options,
} from "@anthropic-ai/claude-agent-sdk";
import { SessionManager } from "./SessionManager.js";
import { autoApproveHook } from "./hooks/AutoApproveHook.js";
import { Config } from "../utils/Config.js";
import { createLogger } from "../utils/Logger.js";

const log = createLogger("Claude");

export interface QueryResult {
  text: string;
  sessionId: string;
  costUsd: number;
  numTurns: number;
  isError: boolean;
}

export class ClaudeService {
  private sessionManager: SessionManager;
  private activeQueries = new Map<number, Query>();

  constructor(sessionManager: SessionManager) {
    this.sessionManager = sessionManager;
  }

  async executeQuery(
    userId: number,
    prompt: string,
    onPartialText?: (text: string) => void,
  ): Promise<QueryResult> {
    const session = this.sessionManager.get(userId);
    if (!session) {
      return {
        text: "프로젝트가 설정되지 않았습니다. /project <path> 로 설정하세요.",
        sessionId: "",
        costUsd: 0,
        numTurns: 0,
        isError: true,
      };
    }

    const baseOptions: Options = {
      cwd: session.projectPath,
      permissionMode: "default",
      allowedTools: Config.allowedTools,
      hooks: {
        PreToolUse: [
          { hooks: [autoApproveHook] },
        ],
      },
    };

    let resultText = "";
    let sessionId = session.sessionId;
    let costUsd = 0;
    let numTurns = 0;
    let isError = false;
    const textParts: string[] = [];

    try {
      log.info(`Query started for user ${userId}: ${prompt.slice(0, 100)}...`);

      // resume 시도 후 실패 시 새 세션으로 fallback
      const result = await this.runQuery(
        prompt,
        baseOptions,
        session.sdkSessionId,
        userId,
        textParts,
        onPartialText,
      );

      resultText = result.resultText;
      sessionId = result.sessionId;
      costUsd = result.costUsd;
      numTurns = result.numTurns;
      isError = result.isError;

      this.activeQueries.delete(userId);
    } catch (err) {
      this.activeQueries.delete(userId);
      log.error("Query failed", err);
      isError = true;
      resultText = err instanceof Error ? err.message : "Unknown error";
    }

    // SDK result가 비어있으면 수집된 텍스트 사용
    if (!resultText && textParts.length > 0) {
      resultText = textParts.join("");
    }

    this.sessionManager.touch(userId);
    log.info(
      `Query completed: turns=${numTurns}, cost=$${costUsd.toFixed(4)}, error=${isError}`,
    );

    return { text: resultText, sessionId, costUsd, numTurns, isError };
  }

  private async runQuery(
    prompt: string,
    baseOptions: Options,
    sdkSessionId: string | undefined,
    userId: number,
    textParts: string[],
    onPartialText?: (text: string) => void,
  ): Promise<{
    resultText: string;
    sessionId: string;
    costUsd: number;
    numTurns: number;
    isError: boolean;
  }> {
    const options: Options = {
      ...baseOptions,
      ...(sdkSessionId ? { resume: sdkSessionId } : {}),
    };

    try {
      return await this.iterateQuery(prompt, options, userId, textParts, onPartialText);
    } catch (err) {
      // resume 실패 시 새 세션으로 fallback
      if (sdkSessionId) {
        log.warn("Resume failed, starting new session", err);
        textParts.length = 0;
        return await this.iterateQuery(prompt, baseOptions, userId, textParts, onPartialText);
      }
      throw err;
    }
  }

  private async iterateQuery(
    prompt: string,
    options: Options,
    userId: number,
    textParts: string[],
    onPartialText?: (text: string) => void,
  ): Promise<{
    resultText: string;
    sessionId: string;
    costUsd: number;
    numTurns: number;
    isError: boolean;
  }> {
    let resultText = "";
    let sessionId = "";
    let costUsd = 0;
    let numTurns = 0;
    let isError = false;

    const q = query({ prompt, options });
    this.activeQueries.set(userId, q);

    for await (const message of q) {
      this.processMessage(message, textParts, onPartialText);

      if (message.type === "system" && "subtype" in message && message.subtype === "init") {
        sessionId = message.session_id;
        this.sessionManager.updateSdkSessionId(userId, sessionId);
      }

      if (message.type === "result") {
        if (message.subtype === "success") {
          const success = message as SDKResultSuccess;
          resultText = success.result;
          costUsd = success.total_cost_usd;
          numTurns = success.num_turns;
        } else {
          isError = true;
          resultText =
            "errors" in message
              ? (message.errors as string[]).join("\n")
              : "An error occurred";
        }
      }
    }

    return { resultText, sessionId, costUsd, numTurns, isError };
  }

  private processMessage(
    message: SDKMessage,
    textParts: string[],
    onPartialText?: (text: string) => void,
  ): void {
    if (message.type === "assistant") {
      const assistantMsg = message as SDKAssistantMessage;
      for (const block of assistantMsg.message.content) {
        if (block.type === "text") {
          textParts.push(block.text);
          onPartialText?.(block.text);
        }
      }
    }
  }

  interrupt(userId: number): boolean {
    const q = this.activeQueries.get(userId);
    if (q) {
      q.close();
      this.activeQueries.delete(userId);
      return true;
    }
    return false;
  }

  isActive(userId: number): boolean {
    return this.activeQueries.has(userId);
  }
}
