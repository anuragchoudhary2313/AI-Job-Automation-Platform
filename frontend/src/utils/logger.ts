/**
 * Logger Utility
 * 
 * Centralized logging utility for development and production.
 * Replaces console.log with structured logging.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    // Only log in development
    if (this.isDevelopment) {
      const style = this.getLogStyle(level);
      const prefix = `[${level.toUpperCase()}]`;

      console.log(
        `%c${prefix} ${message}`,
        style,
        context ? context : ''
      );
    }

    // In production, you could send to a logging service
    if (!this.isDevelopment && level === 'error') {
      // Send to error tracking service (e.g., Sentry)
      this.sendToErrorTracking(entry);
    }
  }

  private getLogStyle(level: LogLevel): string {
    const styles = {
      debug: 'color: #6B7280; font-weight: normal;',
      info: 'color: #3B82F6; font-weight: bold;',
      warn: 'color: #F59E0B; font-weight: bold;',
      error: 'color: #EF4444; font-weight: bold;',
    };
    return styles[level];
  }

  private sendToErrorTracking(entry: LogEntry): void {
    // Implement error tracking service integration
    // e.g., Sentry, LogRocket, etc.
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.log('error', message, context);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience methods
export const log = {
  debug: (message: string, context?: Record<string, any>) => logger.debug(message, context),
  info: (message: string, context?: Record<string, any>) => logger.info(message, context),
  warn: (message: string, context?: Record<string, any>) => logger.warn(message, context),
  error: (message: string, context?: Record<string, any>) => logger.error(message, context),
};
