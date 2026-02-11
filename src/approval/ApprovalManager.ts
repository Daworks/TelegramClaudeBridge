import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import { createLogger } from "../utils/Logger.js";
import { Config } from "../utils/Config.js";

const log = createLogger("Approval");

export interface ApprovalRequest {
  requestId: string;
  userId: number;
  command: string;
  toolName: string;
  timestamp: number;
}

export interface ApprovalDecision {
  approved: boolean;
  reason?: string;
}

interface PendingApproval {
  request: ApprovalRequest;
  resolve: (decision: ApprovalDecision) => void;
  timer: ReturnType<typeof setTimeout>;
}

/**
 * SDK Hook과 Telegram 콜백 사이의 Promise 기반 승인 동기화 관리자.
 *
 * 흐름:
 * 1. Hook이 requestApproval() 호출 → Promise 대기
 * 2. 'approval-requested' 이벤트 발행 → TelegramBot이 InlineKeyboard 전송
 * 3. 사용자 버튼 클릭 → CallbackHandler가 resolveApproval() 호출
 * 4. Promise resolve → Hook에 decision 반환
 */
export class ApprovalManager extends EventEmitter {
  private pending = new Map<string, PendingApproval>();

  requestApproval(
    userId: number,
    toolName: string,
    command: string,
  ): Promise<ApprovalDecision> {
    const requestId = randomUUID().slice(0, 8);
    const request: ApprovalRequest = {
      requestId,
      userId,
      command,
      toolName,
      timestamp: Date.now(),
    };

    return new Promise<ApprovalDecision>((resolve) => {
      const timer = setTimeout(() => {
        log.warn(`Approval timed out: ${requestId}`);
        this.pending.delete(requestId);
        resolve({ approved: false, reason: "Approval timed out" });
      }, Config.approvalTimeoutMs);

      this.pending.set(requestId, { request, resolve, timer });

      log.info(`Approval requested: ${requestId} - ${toolName}: ${command}`);
      this.emit("approval-requested", request);
    });
  }

  resolveApproval(requestId: string, decision: ApprovalDecision): boolean {
    const entry = this.pending.get(requestId);
    if (!entry) {
      log.warn(`No pending approval found: ${requestId}`);
      return false;
    }

    clearTimeout(entry.timer);
    this.pending.delete(requestId);
    entry.resolve(decision);
    log.info(
      `Approval resolved: ${requestId} - ${decision.approved ? "ALLOWED" : "DENIED"}`,
    );
    return true;
  }

  getPending(requestId: string): ApprovalRequest | undefined {
    return this.pending.get(requestId)?.request;
  }

  get pendingCount(): number {
    return this.pending.size;
  }

  cleanup(): void {
    for (const [id, entry] of this.pending) {
      clearTimeout(entry.timer);
      entry.resolve({ approved: false, reason: "Shutdown" });
    }
    this.pending.clear();
  }
}
