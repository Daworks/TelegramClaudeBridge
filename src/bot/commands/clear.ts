import type { Context } from "grammy";
import type { SessionManager } from "../../claude/SessionManager.js";

export function createClearCommand(sessionManager: SessionManager) {
  return async (ctx: Context): Promise<void> => {
    const userId = ctx.from?.id;
    if (!userId) return;

    const session = sessionManager.clear(userId);
    if (session) {
      await ctx.reply(
        `대화가 초기화되었습니다. 프로젝트(${session.projectPath})는 유지됩니다.`,
      );
    } else {
      await ctx.reply("활성 세션이 없습니다.");
    }
  };
}
