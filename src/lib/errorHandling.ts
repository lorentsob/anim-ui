/**
 * Enhanced error handling and resilience system for BW Animator
 * Provides centralized error management, categorization, and recovery strategies
 */

export type ErrorCategory =
  | "animation"
  | "export"
  | "storage"
  | "canvas"
  | "p5js"
  | "browser"
  | "network"
  | "validation"
  | "system";

export type ErrorSeverity = "low" | "medium" | "high" | "critical";

export type ErrorContext = {
  category: ErrorCategory;
  severity: ErrorSeverity;
  operation: string;
  metadata?: Record<string, unknown>;
  userMessage?: string;
  recoverable?: boolean;
  retryable?: boolean;
};

export class AppError extends Error {
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly operation: string;
  public readonly metadata: Record<string, unknown>;
  public readonly userMessage: string;
  public readonly recoverable: boolean;
  public readonly retryable: boolean;
  public readonly timestamp: number;

  constructor(message: string, context: ErrorContext) {
    super(message);
    this.name = "AppError";
    this.category = context.category;
    this.severity = context.severity;
    this.operation = context.operation;
    this.metadata = context.metadata ?? {};
    this.userMessage = context.userMessage ?? this.generateUserMessage();
    this.recoverable = context.recoverable ?? this.isRecoverable();
    this.retryable = context.retryable ?? this.isRetryable();
    this.timestamp = Date.now();
  }

  private generateUserMessage(): string {
    const messages = {
      animation: "Animation rendering issue. Please try refreshing or changing settings.",
      export: "Export failed. Please try again or adjust export settings.",
      storage: "Failed to save/load data. Local storage may be full.",
      canvas: "Canvas rendering issue. Please refresh the page.",
      p5js: "Graphics engine error. Please refresh the page.",
      browser: "Browser compatibility issue. Please try a different browser.",
      network: "Network error. Please check your connection.",
      validation: "Invalid input. Please check your settings.",
      system: "System error. Please refresh and try again."
    };
    return messages[this.category] || "An unexpected error occurred.";
  }

  private isRecoverable(): boolean {
    const recoverableCategories: ErrorCategory[] = ["storage", "validation", "network"];
    return recoverableCategories.includes(this.category);
  }

  private isRetryable(): boolean {
    const retryableCategories: ErrorCategory[] = ["export", "network", "storage"];
    return retryableCategories.includes(this.category) && this.severity !== "critical";
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      operation: this.operation,
      metadata: this.metadata,
      userMessage: this.userMessage,
      recoverable: this.recoverable,
      retryable: this.retryable,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

type ErrorHandler = (error: AppError) => void;
type RecoveryStrategy = (error: AppError) => Promise<boolean> | boolean;

class ErrorManager {
  private handlers: Map<ErrorCategory, ErrorHandler[]> = new Map();
  private recoveryStrategies: Map<ErrorCategory, RecoveryStrategy[]> = new Map();
  private errorLog: AppError[] = [];
  private maxLogSize = 100;

  addHandler(category: ErrorCategory, handler: ErrorHandler): void {
    if (!this.handlers.has(category)) {
      this.handlers.set(category, []);
    }
    this.handlers.get(category)!.push(handler);
  }

  addRecoveryStrategy(category: ErrorCategory, strategy: RecoveryStrategy): void {
    if (!this.recoveryStrategies.has(category)) {
      this.recoveryStrategies.set(category, []);
    }
    this.recoveryStrategies.get(category)!.push(strategy);
  }

  async handleError(error: Error | AppError, context?: Partial<ErrorContext>): Promise<boolean> {
    const appError = error instanceof AppError
      ? error
      : this.wrapError(error, context);

    this.logError(appError);

    // Try recovery strategies first
    const recovered = await this.attemptRecovery(appError);
    if (recovered) {
      return true;
    }

    // Run category-specific handlers
    const handlers = this.handlers.get(appError.category) || [];
    handlers.forEach(handler => {
      try {
        handler(appError);
      } catch (handlerError) {
        console.error("Error handler failed:", handlerError);
      }
    });

    return false;
  }

  private wrapError(error: Error, context?: Partial<ErrorContext>): AppError {
    const defaultContext: ErrorContext = {
      category: "system",
      severity: "medium",
      operation: "unknown",
      ...context
    };

    return new AppError(error.message, defaultContext);
  }

  private async attemptRecovery(error: AppError): Promise<boolean> {
    if (!error.recoverable) return false;

    const strategies = this.recoveryStrategies.get(error.category) || [];

    for (const strategy of strategies) {
      try {
        const recovered = await strategy(error);
        if (recovered) {
          console.log(`Successfully recovered from error in ${error.operation}`);
          return true;
        }
      } catch (recoveryError) {
        console.error("Recovery strategy failed:", recoveryError);
      }
    }

    return false;
  }

  private logError(error: AppError): void {
    this.errorLog.unshift(error);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Console logging with appropriate level
    const logMethod = error.severity === "critical" || error.severity === "high"
      ? console.error
      : error.severity === "medium"
      ? console.warn
      : console.info;

    logMethod(`[${error.category.toUpperCase()}] ${error.operation}:`, error.message, error.metadata);
  }

  getErrorLog(): readonly AppError[] {
    return this.errorLog;
  }

  getErrorStats(): Record<ErrorCategory, { count: number; lastOccurrence: number }> {
    const stats: Record<string, { count: number; lastOccurrence: number }> = {};

    this.errorLog.forEach(error => {
      if (!stats[error.category]) {
        stats[error.category] = { count: 0, lastOccurrence: 0 };
      }
      stats[error.category].count++;
      stats[error.category].lastOccurrence = Math.max(
        stats[error.category].lastOccurrence,
        error.timestamp
      );
    });

    return stats as Record<ErrorCategory, { count: number; lastOccurrence: number }>;
  }

  clearErrorLog(): void {
    this.errorLog = [];
  }
}

export const errorManager = new ErrorManager();

// Utility functions for common error scenarios
export function createAnimationError(operation: string, error: Error, metadata?: Record<string, unknown>): AppError {
  return new AppError(error.message, {
    category: "animation",
    severity: "medium",
    operation,
    metadata,
    userMessage: "Animation rendering issue. Try adjusting parameters or refreshing."
  });
}

export function createExportError(operation: string, error: Error, metadata?: Record<string, unknown>): AppError {
  return new AppError(error.message, {
    category: "export",
    severity: "medium",
    operation,
    metadata,
    userMessage: "Export failed. Please try again or adjust export settings.",
    retryable: true
  });
}

export function createStorageError(operation: string, error: Error, metadata?: Record<string, unknown>): AppError {
  return new AppError(error.message, {
    category: "storage",
    severity: "low",
    operation,
    metadata,
    userMessage: "Failed to save/load data. Your browser's storage may be full.",
    recoverable: true
  });
}

export function createCanvasError(operation: string, error: Error, metadata?: Record<string, unknown>): AppError {
  return new AppError(error.message, {
    category: "canvas",
    severity: "high",
    operation,
    metadata,
    userMessage: "Canvas rendering failed. Please refresh the page."
  });
}

export function createValidationError(operation: string, message: string, metadata?: Record<string, unknown>): AppError {
  return new AppError(message, {
    category: "validation",
    severity: "low",
    operation,
    metadata,
    userMessage: "Invalid input. Please check your settings.",
    recoverable: true
  });
}

// Retry utility with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000,
  context?: Partial<ErrorContext>
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) break;

      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new AppError(`Operation failed after ${maxAttempts} attempts: ${lastError!.message}`, {
    category: "system",
    severity: "medium",
    operation: "retry",
    retryable: false,
    ...context
  });
}

// Safe operation wrapper (async)
export async function safeOperation<T>(
  operation: () => Promise<T> | T,
  fallback: T,
  context?: Partial<ErrorContext>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    await errorManager.handleError(error as Error, context);
    return fallback;
  }
}

// Safe operation wrapper (synchronous)
export function safeSyncOperation<T>(
  operation: () => T,
  fallback: T,
  context?: Partial<ErrorContext>
): T {
  try {
    return operation();
  } catch (error) {
    errorManager.handleError(error as Error, context);
    return fallback;
  }
}

// Performance monitoring wrapper
export async function withPerformanceMonitoring<T>(
  operation: () => Promise<T>,
  operationName: string,
  warnThresholdMs: number = 5000
): Promise<T> {
  const start = performance.now();

  try {
    const result = await operation();
    const duration = performance.now() - start;

    if (duration > warnThresholdMs) {
      console.warn(`Slow operation detected: ${operationName} took ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    throw new AppError((error as Error).message, {
      category: "system",
      severity: "medium",
      operation: operationName,
      metadata: { duration, operationName }
    });
  }
}