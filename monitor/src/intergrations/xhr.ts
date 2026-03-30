import { BaseIntegration } from "../core/BaseIntegration";
import { EVENT_KIND, EVENT_TYPE } from "../core/types";
import type { TrackerInstance } from "../core/types";
import {
  shouldSkipMonitoringRequest,
} from "../utils/request";

/**
 * XhrIntegration 配置项。
 */
export interface XhrIntegrationOptions {
  /** 是否启用 XMLHttpRequest 请求拦截。@default true */
  enabled?: boolean;
  /** 将状态码大于等于该阈值的响应视为错误。@default 400 */
  statusErrorThreshold?: number;
  /** 是否在 `extra.requestData` 中附带请求体。@default true */
  captureRequestBody?: boolean;
  /** 匹配该规则的 URL 将跳过采集。支持字符串或正则。 */
  ignoreUrls?: Array<string | RegExp>;
}

type ResolvedXhrIntegrationOptions = Required<
  Omit<XhrIntegrationOptions, "ignoreUrls">
> & {
  ignoreUrls: Array<string | RegExp>;
};

const resolveXhrIntegrationOptions = (
  options: XhrIntegrationOptions = {},
): ResolvedXhrIntegrationOptions => {
  return {
    enabled: options.enabled ?? true,
    statusErrorThreshold: options.statusErrorThreshold ?? 400,
    captureRequestBody: options.captureRequestBody ?? true,
    ignoreUrls: options.ignoreUrls ?? [],
  };
};

type XhrMetadata = {
  method: string;
  url: string;
  start: number;
  requestData?: unknown;
  headers: Record<string, string>;
};

export class XhrIntegration extends BaseIntegration {
  public readonly name = "XhrIntegration";
  private readonly options: ResolvedXhrIntegrationOptions;

  /**
   * @param options XMLHttpRequest 请求采集配置。
   */
  constructor(options: XhrIntegrationOptions = {}) {
    super();
    this.options = resolveXhrIntegrationOptions(options);
  }

  protected setupCore(tracker: TrackerInstance) {
    if (!this.options.enabled) {
      return;
    }

    if (typeof XMLHttpRequest === "undefined") {
      return;
    }

    this.instrumentXhr(tracker);
  }

  private instrumentXhr(tracker: TrackerInstance) {
    const integration = this;
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
    const dsn = tracker.getDsn();

    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      ...args: unknown[]
    ) {
      const xhr = this as XMLHttpRequest & {
        _monitorMetadata?: XhrMetadata;
      };

      xhr._monitorMetadata = {
        method: method.toUpperCase(),
        url: url.toString(),
        start: performance.now(),
        headers: {},
      };

      return originalOpen.apply(this, [method, url, ...args] as any);
    };

    XMLHttpRequest.prototype.setRequestHeader = function (
      name: string,
      value: string,
    ) {
      const xhr = this as XMLHttpRequest & {
        _monitorMetadata?: XhrMetadata;
      };

      if (xhr._monitorMetadata) {
        xhr._monitorMetadata.headers[name] = value;
      }

      return originalSetRequestHeader.apply(this, [name, value]);
    };

    XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
      const xhr = this as XMLHttpRequest & {
        _monitorMetadata?: XhrMetadata;
      };

      const metadata = xhr._monitorMetadata;
      if (metadata) {
        metadata.requestData = integration.options.captureRequestBody
          ? (body ?? null)
          : undefined;
      }

      if (
        metadata &&
        integration.shouldSkipRequest(metadata.url, dsn, metadata.headers)
      ) {
        return originalSend.apply(this, [body] as any);
      }

      this.addEventListener("loadend", () => {
        if (!metadata) {
          return;
        }

        const duration = performance.now() - metadata.start;
        const status = this.status;

        if (
          status === 0 ||
          status >= integration.options.statusErrorThreshold
        ) {
          tracker.captureEvent({
            kind: EVENT_KIND.HTTP,
            type: EVENT_TYPE.HTTP_ERROR,
            level: "error",
            message: `XHR ${metadata.method} ${status || "Failed"}`,
            extra: {
              url: metadata.url,
              method: metadata.method,
              status,
              durationMs: Number(duration.toFixed(2)),
              requestData: metadata.requestData,
            },
          });
        }
      });

      return originalSend.apply(this, [body] as any);
    };
  }

  private shouldSkipRequest(
    url: string,
    dsn: string,
    headers?: Record<string, string>,
  ): boolean {
    return shouldSkipMonitoringRequest({
      url,
      dsn,
      headers,
      ignoreUrls: this.options.ignoreUrls,
    });
  }
}
