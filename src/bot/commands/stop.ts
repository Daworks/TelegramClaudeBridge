import type { Context } from "grammy";
import type { SessionManager } from "../../claude/SessionManager.js";
import type { ClaudeService } from "../../claude/ClaudeService.js";

export function createStopCommand(
  sessionManager: SessionManager,
  claudeService: ClaudeService,
) {
  return async (ctx: Context): Promise<void> => {
    const userId = ctx.from?.id;
    if (!userId) return;

    // 진행 중인 쿼리 중단
    claudeService.interrupt(userId);

    const deleted = sessionManager.delete(userId);
    if (deleted) {
      await ctx.reply("세션이 완전히 삭제되었습니다.");
    } else {
      await ctx.reply("삭제할 세션이 없습니다.");
    }
  };
}
