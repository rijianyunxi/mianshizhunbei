import type { MonitorEvent, Transport, TransportResult } from "../types";
import {
  getMiniProgramGlobal,
  type MiniProgramGlobalApi,
} from "../../utils/platform";
import {
  SDK_INJECTED_HEADER,
  SDK_INJECTED_HEADER_VALUE,
} from "../../utils/request";

const MINI_PROGRAM_HEADERS = {
  "content-type": "application/json",
  [SDK_INJECTED_HEADER]: SDK_INJECTED_HEADER_VALUE,
};

export interface MiniProgramTransportOptions {
  dsn: string;
  api?: MiniProgramGlobalApi;
}

export class MiniProgramTransport implements Transport {
  private readonly dsn: string;
  private readonly api: MiniProgramGlobalApi | null;

  constructor(options: MiniProgramTransportOptions) {
    this.dsn = options.dsn;
    this.api = options.api ?? getMiniProgramGlobal();
  }

  public send(event: MonitorEvent): Promise<TransportResult> | TransportResult {
    const api = this.api;
    const request = api?.request;
    if (!request) {
      return {
        ok: false,
        error: new Error(
          "Mini program request API is not available in the current runtime.",
        ),
        retryable: false,
      };
    }

    return new Promise((resolve) => {
      try {
        request({
          url: this.dsn,
          method: "POST",
          data: event,
          header: MINI_PROGRAM_HEADERS,
          success: (result) => {
            const statusCode =
              typeof result?.statusCode === "number" ? result.statusCode : undefined;

            if (statusCode !== undefined && statusCode >= 400) {
              resolve({
                ok: false,
                error: new Error(
                  `Transport request failed with status ${statusCode}.`,
                ),
                statusCode,
                retryable: statusCode >= 500 || statusCode === 429,
              });
              return;
            }

            resolve({ ok: true });
          },
          fail: (sendError) => {
            resolve({
              ok: false,
              error: sendError,
              retryable: true,
            });
          },
        });
      } catch (sendError) {
        resolve({
          ok: false,
          error: sendError,
          retryable: true,
        });
      }
    });
  }
}
