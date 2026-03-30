import { BaseIntegration } from "../core/BaseIntegration";
import { EVENT_KIND, EVENT_TYPE } from "../core/types";
import type { TrackerInstance } from "../core/types";

export interface ReactErrorInfoLike {
  componentStack?: string;
  digest?: string;
  [key: string]: unknown;
}

export interface ReactIntegrationOptions {
  defaultExtra?: Record<string, unknown>;
  includeComponentStack?: boolean;
}

type ResolvedReactIntegrationOptions = {
  defaultExtra: Record<string, unknown>;
  includeComponentStack: boolean;
};

const resolveReactIntegrationOptions = (
  options: ReactIntegrationOptions = {},
): ResolvedReactIntegrationOptions => {
  return {
    defaultExtra: options.defaultExtra ?? {},
    includeComponentStack: options.includeComponentStack ?? true,
  };
};

export class ReactIntegration extends BaseIntegration {
  public readonly name = "ReactIntegration";

  private readonly options: ResolvedReactIntegrationOptions;
  private tracker: TrackerInstance | null = null;

  constructor(options: ReactIntegrationOptions = {}) {
    super();
    this.options = resolveReactIntegrationOptions(options);
  }

  protected setupCore(tracker: TrackerInstance): void {
    this.tracker = tracker;
  }

  protected teardownCore(): void {
    this.tracker = null;
  }

  public captureError(
    error: unknown,
    errorInfo?: ReactErrorInfoLike,
    extraInfo?: Record<string, unknown>,
  ): void {
    if (!this.tracker) {
      return;
    }

    const normalizedError = normalizeReactError(error);

    this.tracker.captureEvent({
      kind: EVENT_KIND.ERROR,
      type: EVENT_TYPE.REACT_ERROR,
      level: "error",
      message: normalizedError.message,
      stack: normalizedError.stack,
      extra: {
        source: "react_error_boundary",
        digest: errorInfo?.digest,
        componentStack: this.options.includeComponentStack
          ? errorInfo?.componentStack
          : undefined,
        ...this.options.defaultExtra,
        ...(extraInfo ?? {}),
      },
    });
  }

  public createErrorHandler(extraInfo?: Record<string, unknown>) {
    return (error: unknown, errorInfo?: ReactErrorInfoLike): void => {
      this.captureError(error, errorInfo, extraInfo);
    };
  }
}

const normalizeReactError = (
  error: unknown,
): {
  message: string;
  stack: string | null;
} => {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack || null,
    };
  }

  if (typeof error === "string") {
    return {
      message: error,
      stack: null,
    };
  }

  try {
    return {
      message: JSON.stringify(error),
      stack: null,
    };
  } catch {
    return {
      message: "Unknown React error",
      stack: null,
    };
  }
};
