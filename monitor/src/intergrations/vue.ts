import { BaseIntegration } from "../core/BaseIntegration";
import { EVENT_KIND, EVENT_TYPE } from "../core/types";
import type { TrackerInstance } from "../core/types";

export class VueIntegration extends BaseIntegration {
  public readonly name = "VueIntegration";
  private app: any;

  constructor(options: { app: any }) {
    super();
    this.app = options.app;
  }

  protected setupCore(tracker: TrackerInstance) {
    if (!this.app?.config) {
      return;
    }

    this.app.config.errorHandler = (err: unknown, _instance: unknown, info: string) => {
      const normalizedError = err instanceof Error ? err : new Error(String(err));
      tracker.captureEvent({
        kind: EVENT_KIND.ERROR,
        type: EVENT_TYPE.VUE_ERROR,
        level: "error",
        message: normalizedError.message,
        stack: normalizedError.stack || null,
        extra: {
          source: "vue_error_handler",
          lifecycle: info,
        },
      });
    };
  }
}
