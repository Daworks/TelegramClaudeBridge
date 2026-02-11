import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { Config } from "../utils/Config.js";
import { createLogger } from "../utils/Logger.js";

const log = createLogger("Session");

export interface Session {
  userId: number;
  sessionId: string;
  /** SDK에서 반환된 실제 세션 ID (resume에 사용) */
  sdkSessionId?: string;
  projectPath: string;
  createdAt: number;
  lastActiveAt: number;
}

type SessionStore = Record<number, Session>;

export class SessionManager {
  private sessions: SessionStore = {};
  private filePath: string;

  constructor() {
    this.filePath = join(Config.dataDir, "sessions.json");
    this.load();
  }

  private load(): void {
    try {
      if (existsSync(this.filePath)) {
        const raw = readFileSync(this.filePath, "utf-8");
        this.sessions = JSON.parse(raw);
        log.info(`Loaded ${Object.keys(this.sessions).length} sessions`);
      }
    } catch {
      log.warn("Failed to load sessions, starting fresh");
      this.sessions = {};
    }
  }

  private save(): void {
    try {
      mkdirSync(Config.dataDir, { recursive: true });
      writeFileSync(this.filePath, JSON.stringify(this.sessions, null, 2));
    } catch (err) {
      log.error("Failed to save sessions", err);
    }
  }

  get(userId: number): Session | undefined {
    return this.sessions[userId];
  }

  setProject(userId: number, projectPath: string): Session {
    const existing = this.sessions[userId];
    const session: Session = {
      userId,
      sessionId: existing?.sessionId ?? randomUUID(),
      projectPath,
      createdAt: existing?.createdAt ?? Date.now(),
      lastActiveAt: Date.now(),
    };
    this.sessions[userId] = session;
    this.save();
    log.info(`Project set for user ${userId}: ${projectPath}`);
    return session;
  }

  /** SDK에서 반환된 session_id를 업데이트 */
  updateSdkSessionId(userId: number, sdkSessionId: string): void {
    const session = this.sessions[userId];
    if (session) {
      session.sdkSessionId = sdkSessionId;
      session.lastActiveAt = Date.now();
      this.save();
    }
  }

  /** 세션 ID만 갱신 (대화 초기화) - 프로젝트는 유지 */
  clear(userId: number): Session | undefined {
    const session = this.sessions[userId];
    if (!session) return undefined;

    session.sessionId = randomUUID();
    session.sdkSessionId = undefined;
    session.lastActiveAt = Date.now();
    this.save();
    log.info(`Session cleared for user ${userId}, new ID: ${session.sessionId}`);
    return session;
  }

  /** 세션 완전 삭제 */
  delete(userId: number): boolean {
    if (!this.sessions[userId]) return false;
    delete this.sessions[userId];
    this.save();
    log.info(`Session deleted for user ${userId}`);
    return true;
  }

  touch(userId: number): void {
    const session = this.sessions[userId];
    if (session) {
      session.lastActiveAt = Date.now();
      this.save();
    }
  }
}
