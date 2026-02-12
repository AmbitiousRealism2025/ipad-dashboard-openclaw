import fs from 'fs';
import path from 'path';

export interface AuditLogEntry {
  timestamp: string;
  userId: string;
  email: string;
  action: AuditAction;
  target?: string;
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

export type AuditAction =
  | 'login'
  | 'logout'
  | 'token_refresh'
  | 'token_revoked'
  | 'command_sent'
  | 'agent_status_changed'
  | 'task_created'
  | 'task_updated'
  | 'config_changed'
  | 'access_denied';

class AuditLogger {
  private logPath: string;
  private entries: AuditLogEntry[] = [];
  private maxEntries = 1000;

  constructor() {
    this.logPath = path.join(process.cwd(), 'logs', 'audit.log');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    const dir = path.dirname(this.logPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  log(entry: Omit<AuditLogEntry, 'timestamp'>): void {
    const fullEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    // Add to in-memory store
    this.entries.push(fullEntry);
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }

    // Append to file
    this.writeToFile(fullEntry);
  }

  private writeToFile(entry: AuditLogEntry): void {
    const line = JSON.stringify(entry) + '\n';
    fs.appendFile(this.logPath, line, (err) => {
      if (err) console.error('Failed to write audit log:', err);
    });
  }

  getEntries(options?: {
    userId?: string;
    action?: AuditAction;
    limit?: number;
    since?: Date;
  }): AuditLogEntry[] {
    let filtered = [...this.entries];

    if (options?.userId) {
      filtered = filtered.filter((e) => e.userId === options.userId);
    }

    if (options?.action) {
      filtered = filtered.filter((e) => e.action === options.action);
    }

    if (options?.since) {
      filtered = filtered.filter((e) => new Date(e.timestamp) >= options.since!);
    }

    const limit = options?.limit || 100;
    return filtered.slice(-limit);
  }

  // Read entries from file for persistence across restarts
  loadFromFile(): void {
    try {
      if (fs.existsSync(this.logPath)) {
        const content = fs.readFileSync(this.logPath, 'utf-8');
        const lines = content.trim().split('\n').filter(Boolean);
        this.entries = lines
          .slice(-this.maxEntries)
          .map((line) => JSON.parse(line) as AuditLogEntry);
      }
    } catch (err) {
      console.error('Failed to load audit log:', err);
    }
  }
}

export const auditLogger = new AuditLogger();
auditLogger.loadFromFile();
