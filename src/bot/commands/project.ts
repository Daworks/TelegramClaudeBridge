import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";
import type { Context } from "grammy";
import type { SessionManager } from "../../claude/SessionManager.js";
import { Config } from "../../utils/Config.js";

function expandPath(p: string): string {
  if (p.startsWith("~/")) {
    return resolve(homedir(), p.slice(2));
  }
  if (p.startsWith("/")) {
    return resolve(p);
  }
  return resolve(Config.projectBaseDir, p);
}

export function createProjectCommand(sessionManager: SessionManager) {
  return async (ctx: Context): Promise<void> => {
    const userId = ctx.from?.id;
    if (!userId) return;

    const text = ctx.message?.text ?? "";
    const args = text.replace(/^\/project\s*/, "").trim();

    if (!args) {
      const session = sessionManager.get(userId);
      if (session) {
        await ctx.reply(`현재 프로젝트: ${session.projectPath}`);
      } else {
        await ctx.reply("프로젝트가 설정되지 않았습니다. /project <path>");
      }
      return;
    }

    const projectPath = expandPath(args);

    if (!existsSync(projectPath)) {
      await ctx.reply(`경로가 존재하지 않습니다: ${projectPath}`);
      return;
    }

    const session = sessionManager.setProject(userId, projectPath);
    await ctx.reply(`프로젝트 설정 완료: ${session.projectPath}`);
  };
}
