type LogLevel = "debug" | "info" | "warn" | "error"

interface LoggerConfig {
  enabled: boolean
  level: LogLevel
  prefix: string
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

class Logger {
  private config: LoggerConfig

  constructor() {
    const isDevelopment = process.env.NODE_ENV === "development"
    const logLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || (isDevelopment ? "debug" : "error")

    this.config = {
      enabled: process.env.NEXT_PUBLIC_ENABLE_LOGGING !== "false",
      level: logLevel,
      prefix: "[App]",
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level]
  }

  private formatMessage(level: LogLevel, message: string, ...args: unknown[]): [string, ...unknown[]] {
    const timestamp = new Date().toISOString()
    const prefix = `${this.config.prefix} [${level.toUpperCase()}] [${timestamp}]`
    return [`${prefix} ${message}`, ...args]
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog("debug")) {
      console.log(...this.formatMessage("debug", message, ...args))
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog("info")) {
      console.info(...this.formatMessage("info", message, ...args))
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog("warn")) {
      console.warn(...this.formatMessage("warn", message, ...args))
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog("error")) {
      console.error(...this.formatMessage("error", message, ...args))
    }
  }

  group(label: string): void {
    if (this.shouldLog("debug")) {
      console.group(label)
    }
  }

  groupEnd(): void {
    if (this.shouldLog("debug")) {
      console.groupEnd()
    }
  }

  table(data: unknown): void {
    if (this.shouldLog("debug")) {
      console.table(data)
    }
  }
}

export const logger = new Logger()

// 特定のモジュール用のロガーを作成するヘルパー
export function createModuleLogger(moduleName: string) {
  return {
    debug: (message: string, ...args: unknown[]) => logger.debug(`[${moduleName}] ${message}`, ...args),
    info: (message: string, ...args: unknown[]) => logger.info(`[${moduleName}] ${message}`, ...args),
    warn: (message: string, ...args: unknown[]) => logger.warn(`[${moduleName}] ${message}`, ...args),
    error: (message: string, ...args: unknown[]) => logger.error(`[${moduleName}] ${message}`, ...args),
  }
}
