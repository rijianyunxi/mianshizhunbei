import { BaseIntegration } from "./base";
import type { TrackerInstance } from "../core/types";

export class FetchIntegration extends BaseIntegration {
  public readonly name = "FetchIntegration";

  public setupCore(tracker: TrackerInstance) {
    this.instrumentFetch(tracker);
  }

  private instrumentFetch(tracker: TrackerInstance) {
    const originalFetch = window.fetch;

    window.fetch = async (
      ...args: Parameters<typeof fetch>
    ): Promise<Response> => {
      const [input, init] = args;
      const start = performance.now(); // 使用高精度时间

      let url: string;
      if (typeof input === "string") {
        url = input;
      } else if (input instanceof URL) {
        url = input.href;
      } else {
        url = input.url;
      }

      const method = (
        init?.method || (input instanceof Request ? input.method : "GET")
      ).toUpperCase();

      let requestBody: any = null;
      try {
        if (method !== "GET" && method !== "HEAD") {
          requestBody =
            init?.body ||
            (input instanceof Request ? (input as any)._bodyInit : null);
          if (requestBody instanceof FormData) requestBody = "[FormData]";
          if (requestBody instanceof Blob) requestBody = "[Blob]";
        }
      } catch (e) {
        requestBody = "[Unparseable Body]";
      }

      if (init?.headers && (init.headers as any)["X-SDK-Injected"]) {
        return originalFetch(...args);
      }

      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - start;
        if (!response.ok) {
          tracker.processPayload({
            type: "http_error",
            message: `Fetch ${method} ${response.status} ${response.statusText}`,
            extra: {
              url,
              method,
              status: response.status,
              statusText: response.statusText,
              duration: Number(duration.toFixed(2)) + "ms",
              requestData: requestBody,
            },
          });
        }

        return response;
      } catch (error: any) {
        // 网络断开或跨域错误
        const duration = performance.now() - start;
        tracker.processPayload({
          type: "http_error",
          message: error.message || "Network Error",
          extra: {
            url,
            method,
            duration: Number(duration.toFixed(2)) + "ms",
            requestData: requestBody,
          },
        });
        throw error;
      }
    };
  }
}
