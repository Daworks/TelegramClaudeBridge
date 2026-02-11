import { resolve } from "node:path";
import { homedir } from "node:os";
import dotenv from "dotenv";

dotenv.config();

export const Config = {
  botToken: process.env.BOT_TOKEN ?? "",
  authorizedUsers: (process.env.AUTHORIZED_USERS ?? "")
    .split(",")
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !isNaN(id)),
  dataDir: process.env.DATA_DIR ?? "./data",
  projectBaseDir: resolve(
    (process.env.PROJECT_BASE_DIR ?? "~/develope").replace(
      /^~/,
      homedir(),
    ),
  ),
  allowedTools: (
    process.env.ALLOWED_TOOLS ??
    "Bash,Read,Write,Edit,Glob,Grep,NotebookEdit,WebSearch,WebFetch,Task,TodoWrite"
  )
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean),
  approvalTimeoutMs: parseInt(
    process.env.APPROVAL_TIMEOUT_MS ?? "300000",
    10,
  ),

  validate(): void {
    if (!this.botToken) throw new Error("BOT_TOKEN is required");
    if (this.authorizedUsers.length === 0)
      throw new Error("AUTHORIZED_USERS is required");
  },
} as const;
