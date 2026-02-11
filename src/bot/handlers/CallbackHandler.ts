import type { Context } from "grammy";
import type { ApprovalManager } from "../../approval/ApprovalManager.js";
import { createLogger } from "../../utils/Logger.js";

const log = createLogger("Callback");

/**
 * Telegram InlineKeyboard 콜백 처리.
 * 승인 버튼 클릭 시 ApprovalManager로 결과를 전달합니다.
 *
 * callbackData 형식: "approve:<requestId>" 또는 "deny:<requestId>"
 */
export class CallbackHandler {
  constructor(private approvalManager: ApprovalManager) {}

  async handle(ctx: Context): Promise<void> {
    const data = ctx.callbackQuery?.data;
    if (!data) return;

    const [action, requestId] = data.split(":");
    if (!requestId || (action !== "approve" && action !== "deny")) {
      await ctx.answerCallbackQuery({ text: "Invalid callback data" });
      return;
    }

    const approved = action === "approve";
    const resolved = this.approvalManager.resolveApproval(requestId, {
      approved,
      reason: approved ? "User approved" : "User denied",
    });

    if (resolved) {
      const emoji = approved ? "\u2705" : "\u274C";
      const label = approved ? "허용됨" : "거부됨";

      await ctx.answerCallbackQuery({ text: `${emoji} ${label}` });
      // 원래 메시지의 버튼을 결과 텍스트로 교체
      await ctx.editMessageReplyMarkup({ reply_markup: undefined });
      await ctx.editMessageText(
        `${ctx.callbackQuery?.message?.text ?? ""}\n\n${emoji} ${label}`,
      );
    } else {
      log.warn(`Approval not found or expired: ${requestId}`);
      await ctx.answerCallbackQuery({
        text: "요청이 만료되었거나 이미 처리되었습니다.",
      });
    }
  }
}
