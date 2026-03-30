import type { MonitorEvent, Transport, TransportResult } from "../types";
import { FetchTransport } from "./fetch";

export interface BrowserTransportOptions {
  dsn: string;
}

export class BrowserTransport implements Transport {
  private readonly dsn: string;
  private readonly fetchTransport: FetchTransport;

  constructor(options: BrowserTransportOptions) {
    this.dsn = options.dsn;
    this.fetchTransport = new FetchTransport({
      dsn: options.dsn,
    });
  }

  public send(event: MonitorEvent): Promise<TransportResult> | TransportResult {
    const data = JSON.stringify(event);

    if (
      typeof navigator !== "undefined" &&
      typeof navigator.sendBeacon === "function"
    ) {
      const body =
        typeof Blob === "function"
          ? new Blob([data], { type: "application/json" })
          : data;
      const sent = navigator.sendBeacon(this.dsn, body);

      if (sent) {
        return { ok: true };
      }
    }

    return this.fetchTransport.send(event);
  }
}
