import type {
  SDKOptions,
  MonitorEvent,
  MonitorEventInput,
  Integration,
  EventLevel,
  EventKind,
  EventType,
  TrackerInstance,
  Transport,
  TransportErrorContext,
  TransportFailureResult,
  TransportFailureOptions,
  TransportResult,
  TransportSendSource,
} from "./types";
import { EVENT_KIND, EVENT_TYPE } from "./types";
import { SDK_PACKAGE_NAME, sdkError, sdkWarn } from "./logger";
import { getPageUrl } from "../utils/context";
import { createDefaultTransport } from "./transports";

export class MonitorSDK implements TrackerInstance {
  private static readonly DEFAULT_TRANSPORT_FAILURE_OPTIONS: Required<TransportFailureOptions> =
    {
      retryCount: 2,
      retryDelayMs: 1000,
      maxRetryDelayMs: 10000,
      queueEnabled: true,
      maxQueueSize: 20,
      maxQueuedAttempts: 3,
    };

  private options: SDKOptions;
  private readonly transport: Transport;
  private readonly transportFailureOptions: Required<TransportFailureOptions>;
  private userContext: Record<string, unknown> = {};
  private tagsContext: Record<string, string> = {};
  private activeIntegrations: Integration[] = [];
  private pendingQueue: QueuedTransportEvent[] = [];
  private queueFlushTimer: ReturnType<typeof setTimeout> | null = null;
  private isFlushingQueue = false;
  private isDisposed = false;

  constructor(options: SDKOptions) {
    if (!options.dsn) {
      throw new Error(`${SDK_PACKAGE_NAME}: dsn is required!`);
    }
    this.options = options;
    this.transport = options.transport ?? createDefaultTransport(options.dsn);
    this.transportFailureOptions = {
      ...MonitorSDK.DEFAULT_TRANSPORT_FAILURE_OPTIONS,
      ...(options.transportFailureOptions ?? {}),
    };
    this.setupIntegrations();
  }

  public getDsn(): string {
    return this.options.dsn;
  }

  public async flush(): Promise<void> {
    await this.flushQueue();
  }

  private setupIntegrations() {
    this.activeIntegrations = [];

    const rawIntegrations = this.options.integrations as unknown;
    if (rawIntegrations == null) {
      return;
    }

    if (!Array.isArray(rawIntegrations)) {
      sdkWarn("options.integrations must be an array.");
      return;
    }

    const mountedNames = new Set<string>();

    rawIntegrations.forEach((candidate, index) => {
      if (!this.isValidIntegration(candidate)) {
        sdkWarn(
          `invalid integration at index ${index}, expected { name: string, setup: Function }.`,
        );
        return;
      }

      const integrationName = candidate.name.trim();
      if (mountedNames.has(integrationName)) {
        sdkWarn(
          `integration "${integrationName}" is duplicated and will be ignored.`,
        );
        return;
      }

      mountedNames.add(integrationName);

      try {
        candidate.setup(this);
        this.activeIntegrations.push(candidate);
      } catch (error) {
        sdkError(`integration "${integrationName}" setup failed.`, error);
      }
    });
  }

  public dispose() {
    this.isDisposed = true;

    const integrations = [...this.activeIntegrations].reverse();
    integrations.forEach((integration) => {
      if (typeof integration.dispose !== "function") {
        return;
      }

      try {
        integration.dispose();
      } catch (error) {
        sdkError(`integration "${integration.name}" dispose failed.`, error);
      }
    });

    this.activeIntegrations = [];
    this.pendingQueue = [];
    this.clearQueueFlushTimer();

    if (typeof this.transport.dispose === "function") {
      this.transport.dispose();
    }
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
    this.captureEvent(
      this.createExceptionEvent(normalized, extraInfo),
    );
  }

  public captureMessage(
    message: string,
    extraInfo?: Record<string, unknown>,
    level: EventLevel = "info",
  ) {
    this.captureEvent(this.createMessageEvent(message, extraInfo, level));
  }

  public track(
    eventName: string,
    properties: Record<string, unknown> = {},
    eventType: EventType = EVENT_TYPE.TRACK_CUSTOM,
  ) {
    this.captureEvent(this.createTrackEvent(eventName, properties, eventType));
  }

  public captureEvent(partialEvent: MonitorEventInput) {
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

  private createExceptionEvent(
    error: { message: string; stack: string | null },
    extraInfo?: Record<string, unknown>,
  ): MonitorEventInput {
    return {
      kind: EVENT_KIND.ERROR,
      type: EVENT_TYPE.MANUAL_ERROR,
      level: "error",
      message: error.message,
      stack: error.stack,
      extra: extraInfo || {},
    };
  }

  private createMessageEvent(
    message: string,
    extraInfo?: Record<string, unknown>,
    level: EventLevel = "info",
  ): MonitorEventInput {
    return {
      kind: EVENT_KIND.MESSAGE,
      type: EVENT_TYPE.MANUAL_MESSAGE,
      level,
      message,
      extra: extraInfo || {},
    };
  }

  private createTrackEvent(
    eventName: string,
    properties: Record<string, unknown>,
    eventType: EventType,
  ): MonitorEventInput {
    return {
      kind: EVENT_KIND.ACTION,
      type: eventType,
      level: "info",
      message: eventName,
      extra: {
        eventName,
        properties,
      },
    };
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
    void this.deliverEvent(
      {
        event: payload,
        attempt: 0,
        queueAttempt: 0,
        nextAttemptAt: 0,
      },
      "direct",
    );
  }

  private async deliverEvent(
    transportEvent: QueuedTransportEvent,
    source: TransportSendSource,
  ): Promise<void> {
    if (this.isDisposed) {
      return;
    }

    const sendResult = await this.sendWithRetries(transportEvent, source);
    if (sendResult.ok) {
      if (this.pendingQueue.length > 0) {
        this.scheduleQueueFlush(0);
      }
      return;
    }

    if (this.shouldQueueEvent(transportEvent, sendResult)) {
      this.enqueueTransportEvent(transportEvent);
    }
  }

  private async sendWithRetries(
    transportEvent: QueuedTransportEvent,
    source: TransportSendSource,
  ): Promise<TransportResult> {
    let attemptInCycle = 0;

    while (attemptInCycle <= this.transportFailureOptions.retryCount) {
      attemptInCycle += 1;
      transportEvent.attempt += 1;

      let sendResult: TransportResult;

      try {
        sendResult = await this.transport.send(transportEvent.event);
      } catch (sendError) {
        sendResult = {
          ok: false,
          error: sendError,
          retryable: true,
        };
      }

      if (sendResult.ok) {
        return sendResult;
      }

      const willRetry =
        Boolean(sendResult.retryable) &&
        attemptInCycle <= this.transportFailureOptions.retryCount;

      this.handleTransportError({
        event: transportEvent.event,
        result: sendResult,
        attempt: transportEvent.attempt,
        source,
        queued: source === "queue",
        queueSize: this.pendingQueue.length,
        willRetry,
        dropped: false,
      });

      if (!willRetry) {
        return sendResult;
      }

      await this.wait(this.getRetryDelay(attemptInCycle));
      if (this.isDisposed) {
        return {
          ok: false,
          error: new Error(`${SDK_PACKAGE_NAME} has been disposed.`),
          retryable: false,
        };
      }
    }

    return {
      ok: false,
      error: new Error("Transport retry loop exited unexpectedly."),
      retryable: false,
    };
  }

  private handleTransportError(context: TransportErrorContext): void {
    sdkError("failed to send event", {
      type: context.event.type,
      kind: context.event.kind,
      level: context.event.level,
      url: context.event.url,
      statusCode: context.result.statusCode,
      retryable: context.result.retryable ?? false,
      error: context.result.error,
      attempt: context.attempt,
      source: context.source,
      queued: context.queued,
      queueSize: context.queueSize,
      willRetry: context.willRetry,
      dropped: context.dropped,
    });

    try {
      this.options.onTransportError?.(context);
    } catch (hookError) {
      sdkError("onTransportError hook failed.", hookError);
    }
  }

  private shouldQueueEvent(
    transportEvent: QueuedTransportEvent,
    result: TransportFailureResult,
  ): boolean {
    return (
      !this.isDisposed &&
      this.transportFailureOptions.queueEnabled &&
      Boolean(result.retryable) &&
      transportEvent.queueAttempt < this.transportFailureOptions.maxQueuedAttempts
    );
  }

  private enqueueTransportEvent(transportEvent: QueuedTransportEvent): void {
    const nextQueueAttempt = transportEvent.queueAttempt + 1;
    const queuedEvent: QueuedTransportEvent = {
      ...transportEvent,
      queueAttempt: nextQueueAttempt,
      nextAttemptAt: Date.now() + this.getRetryDelay(nextQueueAttempt),
    };

    if (this.pendingQueue.length >= this.transportFailureOptions.maxQueueSize) {
      const droppedEvent = this.pendingQueue.shift();
      if (droppedEvent) {
        this.handleTransportError({
          event: droppedEvent.event,
          result: {
            ok: false,
            error: new Error("Transport queue is full, oldest event was dropped."),
            retryable: false,
          },
          attempt: droppedEvent.attempt,
          source: "queue",
          queued: false,
          queueSize: this.pendingQueue.length,
          willRetry: false,
          dropped: true,
        });
      }
    }

    this.pendingQueue.push(queuedEvent);
    this.scheduleQueueFlush(this.getQueueFlushDelay());
  }

  private scheduleQueueFlush(delayMs: number): void {
    if (this.isDisposed || this.pendingQueue.length === 0) {
      return;
    }

    this.clearQueueFlushTimer();
    this.queueFlushTimer = setTimeout(() => {
      this.queueFlushTimer = null;
      void this.flushQueue();
    }, Math.max(0, delayMs));
  }

  private async flushQueue(): Promise<void> {
    if (this.isDisposed || this.isFlushingQueue || this.pendingQueue.length === 0) {
      return;
    }

    this.isFlushingQueue = true;

    try {
      while (!this.isDisposed && this.pendingQueue.length > 0) {
        const queuedEvent = this.pendingQueue[0];
        const waitDelay = queuedEvent.nextAttemptAt - Date.now();

        if (waitDelay > 0) {
          this.scheduleQueueFlush(waitDelay);
          break;
        }

        this.pendingQueue.shift();
        const sendResult = await this.sendWithRetries(queuedEvent, "queue");

        if (sendResult.ok) {
          continue;
        }

        if (this.shouldQueueEvent(queuedEvent, sendResult)) {
          this.enqueueTransportEvent(queuedEvent);
        } else {
          this.handleTransportError({
            event: queuedEvent.event,
            result: {
              ...sendResult,
              retryable: false,
            },
            attempt: queuedEvent.attempt,
            source: "queue",
            queued: false,
            queueSize: this.pendingQueue.length,
            willRetry: false,
            dropped: true,
          });
        }
      }
    } finally {
      this.isFlushingQueue = false;
    }
  }

  private getRetryDelay(attempt: number): number {
    const baseDelay = this.transportFailureOptions.retryDelayMs;
    const maxDelay = this.transportFailureOptions.maxRetryDelayMs;
    const backoffDelay = baseDelay * 2 ** Math.max(0, attempt - 1);

    return Math.min(backoffDelay, maxDelay);
  }

  private getQueueFlushDelay(): number {
    if (this.pendingQueue.length === 0) {
      return 0;
    }

    const nextAttemptAt = Math.min(
      ...this.pendingQueue.map((queuedEvent) => queuedEvent.nextAttemptAt),
    );

    return Math.max(0, nextAttemptAt - Date.now());
  }

  private clearQueueFlushTimer(): void {
    if (this.queueFlushTimer === null) {
      return;
    }

    clearTimeout(this.queueFlushTimer);
    this.queueFlushTimer = null;
  }

  private wait(delayMs: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, delayMs);
    });
  }

}

interface QueuedTransportEvent {
  event: MonitorEvent;
  attempt: number;
  queueAttempt: number;
  nextAttemptAt: number;
}
