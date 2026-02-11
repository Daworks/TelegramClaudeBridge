import type { Context } from "grammy";
import type { ClaudeService } from "../../claude/ClaudeService.js";
import {
  formatForTelegram,
  splitMessage,
} from "../../utils/MessageFormatter.js";
import { createLogger } from "../../utils/Logger.js";

const log = createLogger("Message");

export class MessageHandler {
  constructor(private claudeService: ClaudeService) {}

  async handle(ctx: Context): Promise<void> {
    const text = ctx.message?.text;
    const userId = ctx.from?.id;
    const chatId = ctx.chat?.id;
    if (!text || !userId || !chatId) return;

    if (this.claudeService.isActive(userId)) {
      await ctx.reply("이전 요청을 처리 중입니다. 잠시 기다려주세요.");
      return;
    }

    await ctx.replyWithChatAction("typing");

    // Grammy는 업데이트를 순차 처리하므로, Claude 쿼리를 await하면
    // 승인 콜백을 처리할 수 없어 데드락이 발생합니다.
    // 핸들러를 즉시 반환하고 결과는 Bot API로 직접 전송합니다.
    this.runQuery(ctx, userId, chatId, text);
  }

  private runQuery(
    ctx: Context,
    userId: number,
    chatId: number,
    text: string,
  ): void {
    this.claudeService
      .executeQuery(userId, text)
      .then(async (result) => {
        if (!result.text) {
          await ctx.api.sendMessage(chatId, "응답이 비어있습니다.");
          return;
        }

        const formatted = formatForTelegram(result.text);
        const chunks = splitMessage(formatted);

        for (const chunk of chunks) {
          try {
            await ctx.api.sendMessage(chatId, chunk, {
              parse_mode: "MarkdownV2",
            });
          } catch {
            // MarkdownV2 파싱 실패 시 plain text 전송
            const plainChunks = splitMessage(result.text);
            for (const plain of plainChunks) {
              await ctx.api.sendMessage(chatId, plain);
            }
            break;
          }
        }

        if (result.costUsd > 0) {
          log.info(
            `Cost: $${result.costUsd.toFixed(4)}, Turns: ${result.numTurns}`,
          );
        }
      })
      .catch(async (err) => {
        log.error("Message handling failed", err);
        await ctx.api.sendMessage(
          chatId,
          "오류가 발생했습니다. 다시 시도해주세요.",
        );
      });
  }
}
