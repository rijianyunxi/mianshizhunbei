import { BaseIntegration } from "../core/BaseIntegration";
import { EVENT_KIND, EVENT_TYPE } from "../core/types";
import type { TrackerInstance } from "../core/types";

/**
 * FetchIntegration 配置项。
 */
export interface FetchIntegrationOptions {
  /** 是否启用 fetch 请求拦截。@default true */
  enabled?: boolean;
  /** 将状态码大于等于该阈值的响应视为错误。@default 400 */
  statusErrorThreshold?: number;
  /** 是否在 `extra.requestData` 中附带请求体（可获取时）。@default true */
  captureRequestBody?: boolean;
  /** 匹配该规则的 URL 将跳过采集。支持字符串或正则。 */
  ignoreUrls?: Array<string | RegExp>;
}

type ResolvedFetchIntegrationOptions = Required<
  Omit<FetchIntegrationOptions, "ignoreUrls">
> & {
  ignoreUrls: Array<string | RegExp>;
};

const resolveFetchIntegrationOptions = (
  options: FetchIntegrationOptions = {},
): ResolvedFetchIntegrationOptions => {
  return {
    enabled: options.enabled ?? true,
    statusErrorThreshold: options.statusErrorThreshold ?? 400,
    captureRequestBody: options.captureRequestBody ?? true,
    ignoreUrls: options.ignoreUrls ?? [],
  };
};

export class FetchIntegration extends BaseIntegration {
  public readonly name = "FetchIntegration";
  private readonly options: ResolvedFetchIntegrationOptions;

  /**
   * @param options fetch 请求采集配置。
   */
  constructor(options: FetchIntegrationOptions = {}) {
    super();
    this.options = resolveFetchIntegrationOptions(options);
  }

  protected setupCore(tracker: TrackerInstance) {
    if (!this.options.enabled) {
      return;
    }

    if (typeof window === "undefined" || typeof window.fetch !== "function") {
      return;
    }

    this.instrumentFetch(tracker);
  }

  private instrumentFetch(tracker: TrackerInstance) {
    const originalFetch = window.fetch;
    const dsn = tracker.getDsn();

    window.fetch = async (
      ...args: Parameters<typeof fetch>
    ): Promise<Response> => {
      const [input, init] = args;
      const start = performance.now();

      const url = this.resolveUrl(input);
      const method = this.resolveMethod(input, init);
      const requestBody = this.resolveRequestBody(input, init, method);

      if (this.shouldSkipRequest(url, dsn, input, init)) {
        return originalFetch(...args);
      }

      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - start;

        if (response.status >= this.options.statusErrorThreshold) {
          tracker.captureEvent({
            kind: EVENT_KIND.HTTP,
            type: EVENT_TYPE.HTTP_ERROR,
            level: "error",
            message: `Fetch ${method} ${response.status} ${response.statusText}`,
            extra: {
              url,
              method,
              status: response.status,
              statusText: response.statusText,
              durationMs: Number(duration.toFixed(2)),
              requestData: requestBody,
            },
          });
        }

        return response;
      } catch (error: unknown) {
        const duration = performance.now() - start;
        tracker.captureEvent({
          kind: EVENT_KIND.HTTP,
          type: EVENT_TYPE.HTTP_ERROR,
          level: "error",
          message: error instanceof Error ? error.message : "Network Error",
          extra: {
            url,
            method,
            durationMs: Number(duration.toFixed(2)),
            requestData: requestBody,
          },
        });
        throw error;
      }
    };
  }

  private resolveUrl(input: RequestInfo | URL): string {
    if (typeof input === "string") {
      return input;
    }

    if (input instanceof URL) {
      return input.href;
    }

    return input.url;
  }

  private resolveMethod(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): string {
    if (init?.method) {
      return init.method.toUpperCase();
    }

    if (typeof Request !== "undefined" && input instanceof Request) {
      return input.method.toUpperCase();
    }

    return "GET";
  }

  private resolveRequestBody(
    input: RequestInfo | URL,
    init: RequestInit | undefined,
    method: string,
  ): unknown {
    if (!this.options.captureRequestBody) {
      return undefined;
    }

    if (method === "GET" || method === "HEAD") {
      return null;
    }

    const body = init?.body;
    if (!body && typeof Request !== "undefined" && input instanceof Request) {
      return "[RequestBody stream]";
    }

    if (body instanceof FormData) {
      return "[FormData]";
    }

    if (body instanceof Blob) {
      return "[Blob]";
    }

    return body ?? null;
  }

  private shouldSkipRequest(
    url: string,
    dsn: string,
    input: RequestInfo | URL,
    init?: RequestInit,
  ): boolean {
    if (url.includes(dsn)) {
      return true;
    }

    if (this.options.ignoreUrls.some((rule) => this.matchesUrlRule(url, rule))) {
      return true;
    }

    const injectedHeader = this.extractHeader("X-SDK-Injected", init?.headers);
    if (injectedHeader) {
      return true;
    }

    if (typeof Request !== "undefined" && input instanceof Request) {
      const requestInjectedHeader = input.headers.get("X-SDK-Injected");
      if (requestInjectedHeader) {
        return true;
      }
    }

    return false;
  }

  private extractHeader(
    key: string,
    headers?: HeadersInit,
  ): string | null {
    if (!headers) {
      return null;
    }

    if (headers instanceof Headers) {
      return headers.get(key);
    }

    if (Array.isArray(headers)) {
      const match = headers.find(([headerKey]) =>
        headerKey.toLowerCase() === key.toLowerCase(),
      );
      return match ? match[1] : null;
    }

    const headerRecord = headers as Record<string, string>;
    const matchedKey = Object.keys(headerRecord).find(
      (headerKey) => headerKey.toLowerCase() === key.toLowerCase(),
    );

    return matchedKey ? headerRecord[matchedKey] : null;
  }

  private matchesUrlRule(url: string, rule: string | RegExp): boolean {
    if (typeof rule === "string") {
      return url.includes(rule);
    }

    return rule.test(url);
  }
}
