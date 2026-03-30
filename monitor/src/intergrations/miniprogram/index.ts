import { BaseIntegration } from "../../core/BaseIntegration";
import { EVENT_KIND, EVENT_TYPE } from "../../core/types";
import type { TrackerInstance } from "../../core/types";
import {
  getMiniProgramGlobal,
  type MiniProgramGlobalApi,
  type MiniProgramRequestFailResult,
  type MiniProgramRequestOptions,
  type MiniProgramRequestSuccessResult,
} from "../../utils/platform";
import { shouldSkipMonitoringRequest } from "../../utils/request";

export interface MiniProgramRequestCollectionOptions {
  enabled?: boolean;
  statusErrorThreshold?: number;
  captureRequestData?: boolean;
  ignoreUrls?: Array<string | RegExp>;
}

export interface MiniProgramIntegrationOptions {
  enabled?: boolean;
  jsError?: boolean;
  unhandledRejection?: boolean;
  request?: MiniProgramRequestCollectionOptions;
}

type ResolvedMiniProgramRequestCollectionOptions = Required<
  Omit<MiniProgramRequestCollectionOptions, "ignoreUrls">
> & {
  ignoreUrls: Array<string | RegExp>;
};

interface ResolvedMiniProgramIntegrationOptions {
  enabled: boolean;
  jsError: boolean;
  unhandledRejection: boolean;
  request: ResolvedMiniProgramRequestCollectionOptions;
}

const DEFAULT_MINI_PROGRAM_REQUEST_OPTIONS: ResolvedMiniProgramRequestCollectionOptions =
  {
    enabled: true,
    statusErrorThreshold: 400,
    captureRequestData: true,
    ignoreUrls: [],
  };

const DEFAULT_MINI_PROGRAM_OPTIONS: ResolvedMiniProgramIntegrationOptions = {
  enabled: true,
  jsError: true,
  unhandledRejection: true,
  request: DEFAULT_MINI_PROGRAM_REQUEST_OPTIONS,
};

const resolveRequestOptions = (
  options: MiniProgramRequestCollectionOptions = {},
): ResolvedMiniProgramRequestCollectionOptions => {
  return {
    ...DEFAULT_MINI_PROGRAM_REQUEST_OPTIONS,
    ...options,
    ignoreUrls: options.ignoreUrls ?? DEFAULT_MINI_PROGRAM_REQUEST_OPTIONS.ignoreUrls,
  };
};

const resolveMiniProgramIntegrationOptions = (
  options: MiniProgramIntegrationOptions = {},
): ResolvedMiniProgramIntegrationOptions => {
  return {
    enabled: options.enabled ?? DEFAULT_MINI_PROGRAM_OPTIONS.enabled,
    jsError: options.jsError ?? DEFAULT_MINI_PROGRAM_OPTIONS.jsError,
    unhandledRejection:
      options.unhandledRejection ??
      DEFAULT_MINI_PROGRAM_OPTIONS.unhandledRejection,
    request: resolveRequestOptions(options.request),
  };
};

export class MiniProgramIntegration extends BaseIntegration {
  public readonly name = "MiniProgramIntegration";

  private readonly options: ResolvedMiniProgramIntegrationOptions;
  private api: MiniProgramGlobalApi | null = null;
  private errorHandler?: (error: string) => void;
  private rejectionHandler?: (result: { reason?: unknown }) => void;
  private originalRequest?: MiniProgramGlobalApi["request"];

  constructor(options: MiniProgramIntegrationOptions = {}) {
    super();
    this.options = resolveMiniProgramIntegrationOptions(options);
  }

  protected setupCore(tracker: TrackerInstance): void {
    if (!this.options.enabled) {
      return;
    }

    this.api = getMiniProgramGlobal();
    if (!this.api) {
      return;
    }

    if (this.options.jsError && typeof this.api.onError === "function") {
      this.errorHandler = (error: string) => {
        tracker.captureEvent({
          kind: EVENT_KIND.ERROR,
          type: EVENT_TYPE.JS_ERROR,
          level: "error",
          message: error || "Mini program runtime error",
        });
      };

      this.api.onError(this.errorHandler);
    }

    if (
      this.options.unhandledRejection &&
      typeof this.api.onUnhandledRejection === "function"
    ) {
      this.rejectionHandler = (result: { reason?: unknown }) => {
        const reason = result.reason;

        tracker.captureEvent({
          kind: EVENT_KIND.ERROR,
          type: EVENT_TYPE.UNHANDLED_REJECTION,
          level: "error",
          message: extractPromiseMessage(reason),
          stack: reason instanceof Error ? reason.stack ?? null : null,
        });
      };

      this.api.onUnhandledRejection(this.rejectionHandler);
    }

    if (this.options.request.enabled) {
      this.instrumentRequest(tracker);
    }
  }

  protected teardownCore(): void {
    if (!this.api) {
      return;
    }

    if (this.errorHandler && typeof this.api.offError === "function") {
      this.api.offError(this.errorHandler);
    }

    if (
      this.rejectionHandler &&
      typeof this.api.offUnhandledRejection === "function"
    ) {
      this.api.offUnhandledRejection(this.rejectionHandler);
    }

    if (this.originalRequest && typeof this.api.request === "function") {
      this.api.request = this.originalRequest;
    }

    this.api = null;
    this.errorHandler = undefined;
    this.rejectionHandler = undefined;
    this.originalRequest = undefined;
  }

  private instrumentRequest(tracker: TrackerInstance): void {
    const api = this.api;
    if (!api?.request) {
      return;
    }

    const integration = this;
    const dsn = tracker.getDsn();
    const originalRequest = api.request;
    this.originalRequest = originalRequest;

    api.request = function (options: MiniProgramRequestOptions): unknown {
      if (!options || typeof options.url !== "string") {
        return originalRequest.call(this, options);
      }

      const url = options.url;
      const method = integration.resolveRequestMethod(options.method);
      const requestData = integration.resolveRequestData(options.data, method);

      if (
        shouldSkipMonitoringRequest({
          url,
          dsn,
          headers: options.header,
          ignoreUrls: integration.options.request.ignoreUrls,
        })
      ) {
        return originalRequest.call(this, options);
      }

      const startedAt = getNow();
      let settled = false;
      const originalSuccess = options.success;
      const originalFail = options.fail;

      const finalize = (handler: () => void): void => {
        if (settled) {
          return;
        }

        settled = true;
        handler();
      };

      const wrappedOptions: MiniProgramRequestOptions = {
        ...options,
        success(result) {
          finalize(() => {
            integration.reportRequestSuccess(
              tracker,
              {
                url,
                method,
                startedAt,
                requestData,
              },
              result,
            );
          });

          originalSuccess?.(result);
        },
        fail(error) {
          finalize(() => {
            integration.reportRequestFailure(
              tracker,
              {
                url,
                method,
                startedAt,
                requestData,
              },
              error,
            );
          });

          originalFail?.(error);
        },
      };

      const requestResult = originalRequest.call(this, wrappedOptions);
      if (isPromiseLike(requestResult)) {
        return requestResult
          .then((result) => {
            finalize(() => {
              integration.reportPromiseRequestResult(
                tracker,
                {
                  url,
                  method,
                  startedAt,
                  requestData,
                },
                result,
              );
            });

            return result;
          })
          .catch((error) => {
            finalize(() => {
              integration.reportRequestFailure(
                tracker,
                {
                  url,
                  method,
                  startedAt,
                  requestData,
                },
                error,
              );
            });

            throw error;
          });
      }

      return requestResult;
    };
  }

  private reportPromiseRequestResult(
    tracker: TrackerInstance,
    context: MiniProgramRequestContext,
    result: unknown,
  ): void {
    if (Array.isArray(result) && result.length >= 2) {
      const [error, response] = result;
      if (error) {
        this.reportRequestFailure(tracker, context, error);
        return;
      }

      this.reportRequestSuccess(
        tracker,
        context,
        response as MiniProgramRequestSuccessResult,
      );
      return;
    }

    this.reportRequestSuccess(
      tracker,
      context,
      result as MiniProgramRequestSuccessResult,
    );
  }

  private reportRequestSuccess(
    tracker: TrackerInstance,
    context: MiniProgramRequestContext,
    result: MiniProgramRequestSuccessResult,
  ): void {
    const statusCode = typeof result?.statusCode === "number" ? result.statusCode : 0;

    if (statusCode < this.options.request.statusErrorThreshold) {
      return;
    }

    tracker.captureEvent({
      kind: EVENT_KIND.HTTP,
      type: EVENT_TYPE.HTTP_ERROR,
      level: "error",
      message: buildStatusMessage(context.method, statusCode, result?.errMsg),
      extra: {
        url: context.url,
        method: context.method,
        status: statusCode,
        durationMs: getDurationMs(context.startedAt),
        requestData: context.requestData,
      },
    });
  }

  private reportRequestFailure(
    tracker: TrackerInstance,
    context: MiniProgramRequestContext,
    error: unknown,
  ): void {
    tracker.captureEvent({
      kind: EVENT_KIND.HTTP,
      type: EVENT_TYPE.HTTP_ERROR,
      level: "error",
      message: extractMiniProgramRequestErrorMessage(error),
      extra: {
        url: context.url,
        method: context.method,
        durationMs: getDurationMs(context.startedAt),
        requestData: context.requestData,
      },
    });
  }

  private resolveRequestMethod(method?: string): string {
    return (method ?? "GET").toUpperCase();
  }

  private resolveRequestData(data: unknown, method: string): unknown {
    if (!this.options.request.captureRequestData) {
      return undefined;
    }

    if (method === "GET" || method === "HEAD") {
      return null;
    }

    return data ?? null;
  }
}

interface MiniProgramRequestContext {
  url: string;
  method: string;
  startedAt: number;
  requestData: unknown;
}

const extractPromiseMessage = (reason: unknown): string => {
  if (typeof reason === "string") {
    return reason;
  }

  if (reason instanceof Error) {
    return reason.message;
  }

  try {
    return JSON.stringify(reason);
  } catch {
    return "Promise rejected with non-serializable value";
  }
};

const extractMiniProgramRequestErrorMessage = (error: unknown): string => {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object" && "errMsg" in error) {
    return String((error as MiniProgramRequestFailResult).errMsg || "Network Error");
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "Network Error";
  }
};

const buildStatusMessage = (
  method: string,
  statusCode: number,
  errMsg?: string,
): string => {
  const suffix = errMsg ? ` ${errMsg}` : "";
  return `Request ${method} ${statusCode}${suffix}`;
};

const isPromiseLike = (value: unknown): value is Promise<unknown> => {
  return !!value && typeof (value as Promise<unknown>).then === "function";
};

const getNow = (): number => {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }

  return Date.now();
};

const getDurationMs = (startedAt: number): number => {
  return Number((getNow() - startedAt).toFixed(2));
};
