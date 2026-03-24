import type {
  SDKOptions,
  MonitorEvent,
  MonitorEventInput,
  Integration,
  EventLevel,
  EventKind,
  EventType,
  TrackerInstance,
} from "./types";
import { EVENT_KIND, EVENT_TYPE } from "./types";
import { getPageUrl } from "../utils/context";

export class MonitorSDK implements TrackerInstance {
  private options: SDKOptions;
  private userContext: Record<string, unknown> = {};
  private tagsContext: Record<string, string> = {};
  private activeIntegrations: Integration[] = [];

  constructor(options: SDKOptions) {
    if (!options.dsn) {
      throw new Error("MonitorSDK: dsn is required!");
    }
    this.options = options;
    this.setupIntegrations();
  }

  public getDsn(): string {
    return this.options.dsn;
  }

  private setupIntegrations() {
    this.activeIntegrations = [];

    const rawIntegrations = this.options.integrations as unknown;
    if (rawIntegrations == null) {
      return;
    }

    if (!Array.isArray(rawIntegrations)) {
      console.warn("[MonitorSDK] options.integrations must be an array.");
      return;
    }

    const mountedNames = new Set<string>();

    rawIntegrations.forEach((candidate, index) => {
      if (!this.isValidIntegration(candidate)) {
        console.warn(
          `[MonitorSDK] invalid integration at index ${index}, expected { name: string, setup: Function }.`,
        );
        return;
      }

      const integrationName = candidate.name.trim();
      if (mountedNames.has(integrationName)) {
        console.warn(
          `[MonitorSDK] integration "${integrationName}" is duplicated and will be ignored.`,
        );
        return;
      }

      mountedNames.add(integrationName);

      try {
        candidate.setup(this);
        this.activeIntegrations.push(candidate);
      } catch (error) {
        console.error(
          `[MonitorSDK] integration "${integrationName}" setup failed.`,
          error,
        );
      }
    });
  }

  public dispose() {
    const integrations = [...this.activeIntegrations].reverse();
    integrations.forEach((integration) => {
      if (typeof integration.dispose !== "function") {
        return;
      }

      try {
        integration.dispose();
      } catch (error) {
        console.error(
          `[MonitorSDK] integration "${integration.name}" dispose failed.`,
          error,
        );
      }
    });

    this.activeIntegrations = [];
  }

  private isValidIntegration(candidate: unknown): candidate is Integration {
    if (!candidate || typeof candidate !== "object") {
      return false;
    }

    const integration = candidate as Partial<Integration>;
    return (
      typeof integration.name === "string" &&
      integration.name.trim().length > 0 &&
      typeof integration.setup === "function" &&
      (integration.dispose === undefined ||
        typeof integration.dispose === "function")
    );
  }

  public setUser(user: Record<string, unknown>) {
    this.userContext = { ...this.userContext, ...user };
  }

  public clearUser() {
    this.userContext = {};
  }

  public setTag(key: string, value: string) {
    this.tagsContext[key] = value;
  }

  public captureException(error: unknown, extraInfo?: Record<string, unknown>) {
    const normalized = this.normalizeUnknownError(error);
    this.captureEvent({
      kind: EVENT_KIND.ERROR,
      type: EVENT_TYPE.MANUAL_ERROR,
      level: "error",
      message: normalized.message,
      stack: normalized.stack,
      extra: extraInfo || {},
    });
  }

  public captureMessage(
    message: string,
    extraInfo?: Record<string, unknown>,
    level: EventLevel = "info",
  ) {
    this.captureEvent({
      kind: EVENT_KIND.MESSAGE,
      type: EVENT_TYPE.MANUAL_MESSAGE,
      level,
      message,
      extra: extraInfo || {},
    });
  }

  public track(
    eventName: string,
    properties: Record<string, unknown> = {},
    eventType: EventType = EVENT_TYPE.TRACK_CUSTOM,
  ) {
    this.captureEvent({
      kind: EVENT_KIND.ACTION,
      type: eventType,
      level: "info",
      message: eventName,
      extra: {
        eventName,
        properties,
      },
    });
  }

  public captureEvent(event: MonitorEventInput) {
    this.dispatchEvent(event);
  }

  private dispatchEvent(partialEvent: MonitorEventInput) {
    const eventTimestamp = partialEvent.timestamp ?? Date.now();

    let finalEvent: MonitorEvent = {
      kind: partialEvent.kind || this.inferKind(partialEvent),
      type: partialEvent.type || EVENT_TYPE.CUSTOM_EVENT,
      level: partialEvent.level || this.inferLevel(partialEvent),
      message: partialEvent.message || "",
      stack: partialEvent.stack ?? null,
      filename: partialEvent.filename,
      lineno: partialEvent.lineno,
      colno: partialEvent.colno,
      timestamp: eventTimestamp,
      url: partialEvent.url || getPageUrl(),
      appVersion: this.options.appVersion,
      environment: this.options.environment,
      user: { ...this.userContext },
      tags: { ...this.tagsContext },
      extra: { ...(partialEvent.extra || {}) },
    };

    if (typeof this.options.beforeSend === "function") {
      const processedEvent = this.options.beforeSend(finalEvent);
      if (processedEvent === null) {
        return;
      }
      finalEvent = processedEvent;
    }

    this.send(finalEvent);
  }

  private inferKind(partialEvent: MonitorEventInput): EventKind {
    if (partialEvent.stack || partialEvent.filename) {
      return EVENT_KIND.ERROR;
    }

    if (partialEvent.type?.includes("http")) {
      return EVENT_KIND.HTTP;
    }

    if (partialEvent.type?.includes("resource")) {
      return EVENT_KIND.RESOURCE;
    }

    return EVENT_KIND.CUSTOM;
  }

  private inferLevel(partialEvent: MonitorEventInput): EventLevel {
    if (partialEvent.kind === EVENT_KIND.ERROR) {
      return "error";
    }

    if (partialEvent.type?.includes("error")) {
      return "error";
    }

    return "info";
  }

  private normalizeUnknownError(error: unknown): {
    message: string;
    stack: string | null;
  } {
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack || null,
      };
    }

    if (typeof error === "string") {
      return {
        message: error,
        stack: null,
      };
    }

    try {
      return {
        message: JSON.stringify(error),
        stack: null,
      };
    } catch {
      return {
        message: "Unknown error",
        stack: null,
      };
    }
  }

  private send(payload: MonitorEvent) {
    const data = JSON.stringify(payload);

    if (
      typeof navigator !== "undefined" &&
      typeof navigator.sendBeacon === "function"
    ) {
      const blob = new Blob([data], { type: "application/json" });
      const sent = navigator.sendBeacon(this.options.dsn, blob);
      if (sent) {
        return;
      }
    }

    if (typeof fetch !== "function") {
      return;
    }

    fetch(this.options.dsn, {
      method: "POST",
      body: data,
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        "X-SDK-Injected": "true",
      },
    }).catch((sendError) => {
      console.error("[MonitorSDK] failed to send event", sendError);
    });
  }
}
