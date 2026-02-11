import type { Context } from "grammy";

export async function startCommand(ctx: Context): Promise<void> {
  await ctx.reply(
    [
      "Telegram-Claude Bridge에 오신 것을 환영합니다!",
      "",
      "이 봇은 Claude Code를 Telegram에서 원격으로 제어할 수 있게 해줍니다.",
      "",
      "시작하려면 /project <path>로 프로젝트 경로를 설정하세요.",
      "/help 로 전체 명령어를 확인할 수 있습니다.",
    ].join("\n"),
  );
}
