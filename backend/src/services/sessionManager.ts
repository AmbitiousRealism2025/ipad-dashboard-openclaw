interface Session {
  userId: string;
  refreshToken: string;
  createdAt: Date;
  expiresAt: Date;
  userAgent?: string;
  ip?: string;
}

class SessionManager {
  private sessions: Map<string, Session[]> = new Map();
  private revokedTokens: Set<string> = new Set();
  private maxSessionsPerUser = 5;
  private refresh_token_expiry_days = 7;

  createSession(
    userId: string,
    refreshToken: string,
    metadata?: { userAgent?: string; ip?: string }
  ): void {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + this.refresh_token_expiry_days);

    const session: Session = {
      userId,
      refreshToken,
      createdAt: now,
      expiresAt,
      ...metadata,
    };

    // Get existing sessions for user
    let userSessions = this.sessions.get(userId) || [];

    // Remove expired sessions
    userSessions = userSessions.filter((s) => s.expiresAt > now);

    // Enforce max sessions limit
    if (userSessions.length >= this.maxSessionsPerUser) {
      // Remove oldest sessions
      userSessions = userSessions
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .slice(userSessions.length - this.maxSessionsPerUser + 1);
    }

    userSessions.push(session);
    this.sessions.set(userId, userSessions);
  }

  validateSession(userId: string, refreshToken: string): boolean {
    // Check if token is revoked
    if (this.revokedTokens.has(refreshToken)) {
      return false;
    }

    const userSessions = this.sessions.get(userId) || [];
    const session = userSessions.find((s) => s.refreshToken === refreshToken);

    if (!session) {
      return false;
    }

    // Check if expired
    if (session.expiresAt < new Date()) {
      this.removeSession(userId, refreshToken);
      return false;
    }

    return true;
  }

  removeSession(userId: string, refreshToken: string): boolean {
    const userSessions = this.sessions.get(userId) || [];
    const index = userSessions.findIndex((s) => s.refreshToken === refreshToken);

    if (index >= 0) {
      userSessions.splice(index, 1);
      this.sessions.set(userId, userSessions);
      this.revokedTokens.add(refreshToken);
      return true;
    }

    return false;
  }

  revokeAllUserSessions(userId: string): number {
    const userSessions = this.sessions.get(userId) || [];
    let count = 0;

    for (const session of userSessions) {
      this.revokedTokens.add(session.refreshToken);
      count++;
    }

    this.sessions.delete(userId);
    return count;
  }

  revokeToken(refreshToken: string): boolean {
    this.revokedTokens.add(refreshToken);

    // Also remove from active sessions
    for (const [userId, sessions] of this.sessions.entries()) {
      const index = sessions.findIndex((s) => s.refreshToken === refreshToken);
      if (index >= 0) {
        sessions.splice(index, 1);
        this.sessions.set(userId, sessions);
        return true;
      }
    }

    return false;
  }

  isTokenRevoked(refreshToken: string): boolean {
    return this.revokedTokens.has(refreshToken);
  }

  getActiveSessions(userId: string): Omit<Session, 'refreshToken'>[] {
    const userSessions = this.sessions.get(userId) || [];
    const now = new Date();

    return userSessions
      .filter((s) => s.expiresAt > now)
      .map(({ refreshToken: _, ...session }) => session);
  }

  // Clean up expired sessions and old revoked tokens
  cleanup(): void {
    const now = new Date();

    // Clean expired sessions
    for (const [userId, sessions] of this.sessions.entries()) {
      const active = sessions.filter((s) => s.expiresAt > now);
      if (active.length === 0) {
        this.sessions.delete(userId);
      } else if (active.length < sessions.length) {
        this.sessions.set(userId, active);
      }
    }

    // Keep revoked tokens set manageable (in production, use Redis with TTL)
    if (this.revokedTokens.size > 10000) {
      // In a real implementation, you'd use timestamps to clean old entries
      console.warn('Revoked tokens set is large, consider using Redis');
    }
  }
}

export const sessionManager = new SessionManager();

// Run cleanup every hour
setInterval(() => {
  sessionManager.cleanup();
}, 60 * 60 * 1000);
