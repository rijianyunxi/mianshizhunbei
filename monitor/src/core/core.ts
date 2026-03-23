import type { SDKOptions, ErrorPayload, Integration } from "./types";
import { getPageUrl } from "../utils/context";

export class ErrorTracker {
  private options: SDKOptions;
  private userContext: Record<string, any> = {};
  private tagsContext: Record<string, string> = {};

  constructor(options: SDKOptions) {
    if (!options.dsn) throw new Error("ErrorTracker: dsn is required!");
    this.options = options;
    this.setupIntegrations();
  }

  private setupIntegrations() {
    const integrations = this.options.integrations || [];
    integrations.forEach((integration: Integration) => {
      integration.setup(this);
    });
  }

  public setUser(user: Record<string, any>) {
    this.userContext = { ...this.userContext, ...user };
  }

  public setTag(key: string, value: string) {
    this.tagsContext[key] = value;
  }

  public clearUser() {
    this.userContext = {};
  }

  // 手动处理错误，比如被try catch后的以及业务错误
  public captureException(error: Error, extraInfo?: Record<string, any>) {
    this.processPayload({
      type: "manual_error",
      message: error.message,
      stack: error.stack,
      extra: extraInfo,
    });
  }
  // 核心底座，所有错误在这里数据整合发送
  public processPayload(partialEvent: Partial<ErrorPayload>) {
    console.error(partialEvent);
    
    let finalEvent: ErrorPayload = {
      type: partialEvent.type || "unknown_error",
      message: partialEvent.message || "",
      stack: partialEvent.stack || null,
      filename: partialEvent.filename || "",
      lineno: partialEvent.lineno || 0,
      colno: partialEvent.colno || 0,
      time: new Date().getTime(),
      url: partialEvent.url || getPageUrl(),
      appVersion: this.options.appVersion,
      environment: this.options.environment,
      user: this.userContext,
      tags: this.tagsContext,
      extra: partialEvent.extra || {},
    };

    // 执行 beforeSend 钩子
    if (typeof this.options.beforeSend === "function") {
      const processedEvent = this.options.beforeSend(finalEvent);
      if (processedEvent === null) {
        console.warn("[ErrorTracker] Event dropped by beforeSend hook.");
        return;
      }
      finalEvent = processedEvent;
    }
    this.send(finalEvent);
  }

  private send(payload: ErrorPayload) {
    const data = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.options.dsn, data);
    } else {
      fetch(this.options.dsn, {
        method: "POST",
        body: data,
        keepalive: true,
        headers: { 
          "Content-Type": "application/json",
          "X-SDK-Injected": "true",
         },
      }).catch(console.error);
    }
  }
}
