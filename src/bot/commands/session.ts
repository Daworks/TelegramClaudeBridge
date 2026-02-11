import type { Context } from "grammy";
import type { SessionManager } from "../../claude/SessionManager.js";

export function createSessionCommand(sessionManager: SessionManager) {
  return async (ctx: Context): Promise<void> => {
    const userId = ctx.from?.id;
    if (!userId) return;

    const session = sessionManager.get(userId);
    if (!session) {
      await ctx.reply("활성 세션이 없습니다. /project <path>로 시작하세요.");
      return;
    }

    const created = new Date(session.createdAt).toLocaleString("ko-KR");
    const lastActive = new Date(session.lastActiveAt).toLocaleString("ko-KR");

    await ctx.reply(
      [
        "세션 정보:",
        `  프로젝트: ${session.projectPath}`,
        `  세션 ID: ${session.sessionId.slice(0, 8)}...`,
        `  생성일: ${created}`,
        `  마지막 활동: ${lastActive}`,
      ].join("\n"),
    );
  };
}
