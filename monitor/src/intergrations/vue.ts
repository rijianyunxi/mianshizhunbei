import { BaseIntegration } from "../core/BaseIntegration";
import { sdkError } from "../core/logger";
import { EVENT_KIND, EVENT_TYPE } from "../core/types";
import type { TrackerInstance } from "../core/types";

type VueAppLike = {
  config?: {
    errorHandler?: VueErrorHandler;
  };
};

type VueErrorHandler = (
  err: unknown,
  instance: unknown,
  info: string,
) => void;

type VueComponentLike = {
  $options?: {
    name?: string;
    __name?: string;
    _componentTag?: string;
  };
  type?: {
    name?: string;
    __name?: string;
  };
};

export class VueIntegration extends BaseIntegration {
  public readonly name = "VueIntegration";

  private readonly app: VueAppLike;
  private originalErrorHandler?: VueErrorHandler;
  private installedErrorHandler?: VueErrorHandler;

  constructor(options: { app: VueAppLike }) {
    super();
    this.app = options.app;
  }

  protected setupCore(tracker: TrackerInstance): void {
    if (!this.app.config) {
      return;
    }

    this.originalErrorHandler = this.app.config.errorHandler;

    const integration = this;
    const nextErrorHandler: VueErrorHandler = (err, instance, info) => {
      try {
        const normalizedError = normalizeVueError(err);
        tracker.captureEvent({
          kind: EVENT_KIND.ERROR,
          type: EVENT_TYPE.VUE_ERROR,
          level: "error",
          message: normalizedError.message,
          stack: normalizedError.stack,
          extra: {
            source: "vue_error_handler",
            lifecycle: info,
            componentName: integration.resolveComponentName(instance),
          },
        });
      } catch (captureError) {
        sdkError("VueIntegration failed to capture error.", captureError);
      } finally {
        integration.originalErrorHandler?.(err, instance, info);
      }
    };

    this.installedErrorHandler = nextErrorHandler;
    this.app.config.errorHandler = nextErrorHandler;
  }

  protected teardownCore(): void {
    if (!this.app.config) {
      return;
    }

    if (this.app.config.errorHandler === this.installedErrorHandler) {
      this.app.config.errorHandler = this.originalErrorHandler;
    }

    this.installedErrorHandler = undefined;
    this.originalErrorHandler = undefined;
  }

  private resolveComponentName(instance: unknown): string | undefined {
    if (!instance || typeof instance !== "object") {
      return undefined;
    }

    const component = instance as VueComponentLike;

    return (
      component.type?.name ??
      component.type?.__name ??
      component.$options?.name ??
      component.$options?.__name ??
      component.$options?._componentTag
    );
  }
}

const normalizeVueError = (
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
      message: "Unknown Vue error",
      stack: null,
    };
  }
};
