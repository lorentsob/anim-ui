"use client";

import React from "react";
import { AppError, errorManager } from "@/lib/errorHandling";
import { useNotificationStore } from "@/store/useNotifications";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: Error;
    retry: () => void;
    errorId?: string;
  }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

class ErrorBoundaryClass extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorId = Math.random().toString(36).slice(2, 8).toUpperCase();

    this.setState({ errorInfo, errorId });

    // Handle the error through our error management system
    const appError = new AppError(error.message, {
      category: "canvas",
      severity: "high",
      operation: "component-render",
      metadata: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        errorId
      },
      userMessage: "A component failed to render. The page will attempt to recover."
    });

    errorManager.handleError(appError);

    // Notify parent about the error
    this.props.onError?.(error, errorInfo);

    // Auto-recovery attempt after a short delay
    this.resetTimeoutId = window.setTimeout(() => {
      this.retry();
    }, 3000);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps, prevState: ErrorBoundaryState) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && !prevState.hasError) {
      return;
    }

    if (hasError) {
      if (resetOnPropsChange && prevProps.children !== this.props.children) {
        this.retry();
        return;
      }

      if (resetKeys && resetKeys.length > 0) {
        const prevResetKeys = prevProps.resetKeys || [];
        const hasResetKeyChanged = resetKeys.some(
          (key, idx) => prevResetKeys[idx] !== key
        );

        if (hasResetKeyChanged) {
          this.retry();
        }
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }
  }

  retry = () => {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined
    });
  };

  render() {
    const { hasError, error, errorId } = this.state;
    const { children, fallback: Fallback } = this.props;

    if (hasError && error) {
      if (Fallback) {
        return <Fallback error={error} retry={this.retry} errorId={errorId} />;
      }

      return <DefaultErrorFallback error={error} retry={this.retry} errorId={errorId} />;
    }

    return children;
  }
}

function DefaultErrorFallback({
  error,
  retry,
  errorId
}: {
  error: Error;
  retry: () => void;
  errorId?: string;
}) {
  const addNotification = useNotificationStore((state) => state.addNotification);

  const handleRetry = () => {
    addNotification("Attempting to recover...", "info");
    retry();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 border border-ink bg-paper p-8 text-center">
      <div className="text-lg font-semibold tracking-wider">COMPONENT ERROR</div>

      <div className="max-w-md space-y-2 text-sm">
        <p className="opacity-80">
          A component encountered an error and couldn't render properly.
        </p>
        {errorId && (
          <p className="font-mono text-xs opacity-60">
            Error ID: {errorId}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleRetry}
          className="border border-ink px-4 py-2 text-xs font-semibold hover:bg-ink hover:text-paper"
        >
          Try Again
        </button>
        <button
          type="button"
          onClick={handleRefresh}
          className="border border-ink px-4 py-2 text-xs font-semibold hover:bg-alert hover:text-paper"
        >
          Refresh Page
        </button>
      </div>

      {process.env.NODE_ENV === "development" && (
        <details className="mt-4 max-w-lg">
          <summary className="cursor-pointer text-xs opacity-60">
            Error Details (Development)
          </summary>
          <pre className="mt-2 whitespace-pre-wrap break-all text-left text-xs opacity-60">
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  );
}

// Convenience wrapper component
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorBoundaryClass {...props} />;
}

// Higher-order component for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name || "Component"
  })`;

  return WrappedComponent;
}

// Hook for error recovery in functional components
export function useErrorRecovery() {
  const addNotification = useNotificationStore((state) => state.addNotification);

  const recoverFromError = React.useCallback(
    (error: Error, context?: { operation?: string; silent?: boolean }) => {
      const appError = new AppError(error.message, {
        category: "system",
        severity: "medium",
        operation: context?.operation || "component-error",
        userMessage: "An error occurred. The system is attempting to recover."
      });

      errorManager.handleError(appError);

      if (!context?.silent) {
        addNotification("Recovering from error...", "info");
      }
    },
    [addNotification]
  );

  return { recoverFromError };
}