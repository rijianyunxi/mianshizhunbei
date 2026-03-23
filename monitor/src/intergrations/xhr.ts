// XhrIntegration.ts
import { BaseIntegration } from "./base";
import type { TrackerInstance } from "../core/types";

export class XhrIntegration extends BaseIntegration {
  public readonly name = "XhrIntegration";

  public setupCore(tracker: TrackerInstance) {
    this.instrumentXhr(tracker);
  }

  private instrumentXhr(tracker: TrackerInstance) {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    const dsn = tracker.options.dsn;

    // 1. 重写 open：拦截 URL 和 Method
    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      ...args: any[]
    ) {
      // 将请求信息挂载到当前实例的自定义属性上（TS 需要用 any 避开检查）
      const xhr = this as any;
      xhr._metadata = {
        method: method.toUpperCase(),
        url: url.toString(),
        start: performance.now(),
      };

      return originalOpen.apply(this, [method, url, ...args] as any);
    };

    // 2. 重写 send：拦截 Body 并监听结果
    XMLHttpRequest.prototype.send = function (body: any) {
      const xhr = this as any;
      const metadata = xhr._metadata;

      // 规避死循环：如果是发往 DSN 的请求，不予理睬
      if (metadata && metadata.url.includes(dsn)) {
        return originalSend.apply(this, [body]);
      }

      // 记录入参
      if (metadata) {
        metadata.requestData = body || null;
      }

      // 监听请求完成
      this.addEventListener("loadend", () => {
        if (!metadata) return;

        const duration = performance.now() - metadata.start;
        const { status } = this;

        // 只记录异常情况 (4xx/5xx 或 网络中断导致的 status=0)
        if (status === 0 || status >= 400) {
          tracker.processPayload({
            type: "http_error",
            message: `XHR ${metadata.method} ${status || 'Failed'}`,
            extra: {
              url: metadata.url,
              method: metadata.method,
              status,
              duration: Number(duration.toFixed(2)) + "ms",
              requestData: metadata.requestData,
            },
          });
        }
      });

      return originalSend.apply(this, [body]);
    };
  }
}