// types.ts (定义类型)
export interface SDKOptions {
  dsn: string; // 后端接收地址
  appVersion?: string; // 应用版本，方便排查是哪个版本的 Bug
  environment?: "development" | "production" | "test";
  // 拦截器
  beforeSend?: (event: ErrorPayload) => ErrorPayload | null;
}

export interface ErrorPayload {
  type: string;
  message: string;
  stack?: string | null;
  time: number;
  url: string;
  // 静态配置
  appVersion?: string;
  environment?: string;
  // 动态上下文
  user?: Record<string, any>;
  tags?: Record<string, string>;
  extra?: Record<string, any>; // 留给开发者塞任意数据的黑洞
}

export class ErrorTracker {
  private options: SDKOptions;
  private userContext: Record<string, any> = {};
  private tagsContext: Record<string, string> = {};

  constructor(options: SDKOptions) {
    if (!options.dsn) throw new Error("ErrorTracker: dsn is required!");
    this.options = options;
    this.initGlobalListeners();
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

  private initGlobalListeners() {
    window.addEventListener("error", (event) => {
      console.log("event.target", event.target);

      this.captureEvent({
        type: "js_error",
        message: event.message,
        stack: event.error?.stack,
      });
    });
  }

  public captureException(error: Error, extraInfo?: Record<string, any>) {
    this.captureEvent({
      type: "manual_error",
      message: error.message,
      stack: error.stack,
      extra: extraInfo,
    });
  }

  private captureEvent(partialEvent: Partial<ErrorPayload>) {
    let finalEvent: ErrorPayload = {
      type: partialEvent.type || "unknown_error",
      message: partialEvent.message || "",
      stack: partialEvent.stack || null,
      time: new Date().getTime(),
      url: window.location.href,
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

    console.dir(finalEvent);

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
        headers: { "Content-Type": "application/json" },
      }).catch(console.error);
    }
  }
}
