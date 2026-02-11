import type { Context } from "grammy";

export async function helpCommand(ctx: Context): Promise<void> {
  await ctx.reply(
    [
      "사용 가능한 명령어:",
      "",
      "/start - 환영 메시지",
      "/project <path> - 프로젝트 디렉토리 설정",
      "/project - 현재 프로젝트 확인",
      "/session - 세션 정보 조회",
      "/clear - 대화 초기화 (새 세션)",
      "/stop - 세션 완전 삭제",
      "/help - 이 도움말",
      "",
      "프로젝트 설정 후 일반 텍스트를 보내면 Claude에게 전달됩니다.",
      "Bash 명령은 실행 전 승인 버튼이 표시됩니다.",
    ].join("\n"),
  );
}
