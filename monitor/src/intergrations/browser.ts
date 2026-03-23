import { BaseIntegration } from "./base";
import type { TrackerInstance } from "../core/types";

export class BrowserIntegration extends BaseIntegration {
  public readonly name = "BrowserIntegration";

  protected setupCore(tracker: TrackerInstance) {
    this.initGlobalListeners(tracker);
  }

  private initGlobalListeners(tracker: TrackerInstance) {
    window.addEventListener(
      "error",
      (event: ErrorEvent | Event) => {
        const target = event.target as HTMLElement | null;
        const isElementTarget = target instanceof HTMLElement;
        if (isElementTarget) {
          const resourceUrl = (target as any).src || (target as any).href;
          const tagName = target.tagName.toLowerCase();
          tracker.processPayload({
            type: "resource_error", // 明确区分为资源错误
            message: `静态资源加载失败: <${tagName}>`,
            url: resourceUrl, // 这里复用 url 字段来存挂掉的资源地址
          });
          return;
        }
        const errorEvent = event as ErrorEvent;
        tracker.processPayload({
          type: "js_error",
          message: errorEvent.message,
          stack: errorEvent.error?.stack || null,
          filename: errorEvent.filename,
          lineno: errorEvent.lineno,
          colno: errorEvent.colno,
        });
      },
      true,
    );

    window.addEventListener(
      "unhandledrejection",
      (event: PromiseRejectionEvent) => {
        const reason = event.reason;
        tracker.processPayload({
          type: "unhandled_rejection",
          message: this.extractPromiseMessage(reason),
          stack: reason instanceof Error ? reason.stack : null,
        });
      },
    );
  }


  private extractPromiseMessage(reason: any): string {
  if (typeof reason === 'string') return reason;
  if (reason instanceof Error) return reason.message;
  return JSON.stringify(reason);
}
}
