import type { MonitorEvent, Transport, TransportResult } from "../types";
import {
  SDK_INJECTED_HEADER,
  SDK_INJECTED_HEADER_VALUE,
} from "../../utils/request";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  [SDK_INJECTED_HEADER]: SDK_INJECTED_HEADER_VALUE,
};

export interface FetchTransportOptions {
  dsn: string;
  headers?: Record<string, string>;
}

export class FetchTransport implements Transport {
  private readonly dsn: string;
  private readonly headers: Record<string, string>;

  constructor(options: FetchTransportOptions) {
    this.dsn = options.dsn;
    this.headers = {
      ...DEFAULT_HEADERS,
      ...(options.headers ?? {}),
    };
  }

  public async send(event: MonitorEvent): Promise<TransportResult> {
    if (typeof fetch !== "function") {
      return {
        ok: false,
        error: new Error("Fetch API is not available in the current runtime."),
        retryable: false,
      };
    }

    try {
      const response = await fetch(this.dsn, {
        method: "POST",
        body: JSON.stringify(event),
        keepalive: true,
        headers: this.headers,
      });

      if (!response.ok) {
        return {
          ok: false,
          error: new Error(
            `Transport request failed with status ${response.status}.`,
          ),
          statusCode: response.status,
          retryable: response.status >= 500 || response.status === 429,
        };
      }

      return { ok: true };
    } catch (sendError) {
      return {
        ok: false,
        error: sendError,
        retryable: true,
      };
    }
  }
}
