// core.ts
import type { SDKOptions, ErrorPayload, Integration } from "./types";

export class ErrorTracker {
  private options: SDKOptions;
  private userContext: Record<string, any> = {};
  private tagsContext: Record<string, string> = {};

  constructor(options: SDKOptions) {
    if (!options.dsn) throw new Error("ErrorTracker: dsn is required!");
    this.options = options;
    
    // 【核心改造】不再硬编码 initGlobalListeners，而是遍历执行传入的 integrations
    this.setupIntegrations();
  }

  private setupIntegrations() {
    const integrations = this.options.integrations || [];
    integrations.forEach((integration) => {
      integration.setup(this);
    });
  }

  // ... setUser, setTag, clearUser 保持不变 ...

  // 【新增】暴露一个底层的捕获方法，供各个 Integration 内部调用
  public capture(payload: Partial<ErrorPayload>) {
    this.captureEvent(payload);
  }

  // 暴露给用户手动调用的
  public captureException(error: Error, extraInfo?: Record<string, any>) {
    this.captureEvent({
      type: "manual_error",
      message: error.message,
      stack: error.stack,
      extra: extraInfo,
    });
  }

  // captureEvent 和 send 方法的内部逻辑保持你的原样即可
  private captureEvent(partialEvent: Partial<ErrorPayload>) { /* ... */ }
  private send(payload: ErrorPayload) { /* ... */ }
}