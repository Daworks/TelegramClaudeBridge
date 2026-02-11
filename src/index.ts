import { Config } from "./utils/Config.js";
import { createLogger } from "./utils/Logger.js";
import { SessionManager } from "./claude/SessionManager.js";
import { ClaudeService } from "./claude/ClaudeService.js";
import { TelegramBot } from "./bot/TelegramBot.js";

const log = createLogger("Main");

async function main() {
  Config.validate();
  log.info("Configuration validated");

  const sessionManager = new SessionManager();
  const claudeService = new ClaudeService(sessionManager);
  const bot = new TelegramBot(sessionManager, claudeService);

  const shutdown = async (signal: string) => {
    log.info(`${signal} received, shutting down...`);
    await bot.stop();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  await bot.start();
}

main().catch((err) => {
  log.error("Fatal error", err);
  process.exit(1);
});
