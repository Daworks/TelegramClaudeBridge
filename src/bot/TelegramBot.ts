import { Bot } from "grammy";
import { Config } from "../utils/Config.js";
import type { ClaudeService } from "../claude/ClaudeService.js";
import type { SessionManager } from "../claude/SessionManager.js";
import { MessageHandler } from "./handlers/MessageHandler.js";
import {
  startCommand,
  helpCommand,
  createProjectCommand,
  createSessionCommand,
  createClearCommand,
  createStopCommand,
} from "./commands/index.js";
import { createLogger } from "../utils/Logger.js";

const log = createLogger("Bot");

export class TelegramBot {
  private bot: Bot;
  private messageHandler: MessageHandler;

  constructor(
    private sessionManager: SessionManager,
    private claudeService: ClaudeService,
  ) {
    this.bot = new Bot(Config.botToken);
    this.messageHandler = new MessageHandler(claudeService);

    this.setupMiddleware();
    this.setupCommands();
    this.setupHandlers();
  }

  private setupMiddleware(): void {
    this.bot.use(async (ctx, next) => {
      const userId = ctx.from?.id;
      if (!userId || !Config.authorizedUsers.includes(userId)) {
        log.warn(`Unauthorized access attempt: ${userId}`);
        await ctx.reply("권한이 없습니다.");
        return;
      }
      await next();
    });
  }

  private setupCommands(): void {
    this.bot.command("start", startCommand);
    this.bot.command("help", helpCommand);
    this.bot.command("project", createProjectCommand(this.sessionManager));
    this.bot.command("session", createSessionCommand(this.sessionManager));
    this.bot.command("clear", createClearCommand(this.sessionManager));
    this.bot.command(
      "stop",
      createStopCommand(this.sessionManager, this.claudeService),
    );
  }

  private setupHandlers(): void {
    this.bot.on("message:text", (ctx) => this.messageHandler.handle(ctx));
  }

  async start(): Promise<void> {
    log.info("Starting Telegram bot...");
    this.bot.start({
      onStart: (info) => {
        log.info(`Bot started: @${info.username}`);
      },
    });
  }

  async stop(): Promise<void> {
    log.info("Stopping Telegram bot...");
    this.bot.stop();
  }
}
