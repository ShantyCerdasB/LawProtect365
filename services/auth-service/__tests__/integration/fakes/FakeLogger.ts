/**
 * @fileoverview FakeLogger - Mock logger for integration tests
 * @summary In-memory logger that captures log messages for testing
 * @description Provides a mock implementation of the Logger interface that
 * captures all log messages in memory for test verification.
 */


/**
 * Log entry captured by FakeLogger
 */
export interface LogEntry {
  level: string;
  message: string;
  context?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Fake logger implementation for testing
 * 
 * Captures all log messages in memory instead of outputting them,
 * allowing tests to verify logging behavior.
 */
export class FakeLogger {
  private logs: LogEntry[] = [];

  /**
   * Logs an info message
   * @param message - Log message
   * @param metadata - Optional metadata
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.captureLog('info', message, metadata);
  }

  /**
   * Logs a warning message
   * @param message - Log message
   * @param metadata - Optional metadata
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.captureLog('warn', message, metadata);
  }

  /**
   * Logs an error message
   * @param message - Log message
   * @param metadata - Optional metadata
   */
  error(message: string, metadata?: Record<string, unknown>): void {
    this.captureLog('error', message, metadata);
  }

  /**
   * Logs a debug message
   * @param message - Log message
   * @param metadata - Optional metadata
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.captureLog('debug', message, metadata);
  }

  /**
   * Captures a log entry
   * @param level - Log level
   * @param message - Log message
   * @param metadata - Optional metadata
   */
  private captureLog(level: string, message: string, metadata?: Record<string, unknown>): void {
    this.logs.push({
      level,
      message,
      metadata,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Gets all captured log entries
   * @returns Array of all log entries
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Gets log entries by level
   * @param level - Log level to filter by
   * @returns Array of log entries of the specified level
   */
  getLogsByLevel(level: string): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Gets log entries containing a specific message
   * @param message - Message to search for
   * @returns Array of log entries containing the message
   */
  getLogsByMessage(message: string): LogEntry[] {
    return this.logs.filter(log => log.message.includes(message));
  }

  /**
   * Gets the count of log entries
   * @returns Number of log entries
   */
  getLogCount(): number {
    return this.logs.length;
  }

  /**
   * Gets the count of log entries by level
   * @param level - Log level to count
   * @returns Number of log entries of the specified level
   */
  getLogCountByLevel(level: string): number {
    return this.logs.filter(log => log.level === level).length;
  }

  /**
   * Checks if any log entries contain a specific message
   * @param message - Message to search for
   * @returns True if any log entry contains the message
   */
  hasLogWithMessage(message: string): boolean {
    return this.logs.some(log => log.message.includes(message));
  }

  /**
   * Checks if any log entries are of a specific level
   * @param level - Log level to check for
   * @returns True if any log entry is of the specified level
   */
  hasLogWithLevel(level: string): boolean {
    return this.logs.some(log => log.level === level);
  }

  /**
   * Clears all captured log entries
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Gets the last log entry
   * @returns The most recent log entry or undefined
   */
  getLastLog(): LogEntry | undefined {
    return this.logs[this.logs.length - 1];
  }

  /**
   * Gets the last log entry by level
   * @param level - Log level to filter by
   * @returns The most recent log entry of the specified level or undefined
   */
  getLastLogByLevel(level: string): LogEntry | undefined {
    const filteredLogs = this.logs.filter(log => log.level === level);
    return filteredLogs[filteredLogs.length - 1];
  }
}
