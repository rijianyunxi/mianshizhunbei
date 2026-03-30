export type EventLevel = "debug" | "info" | "warn" | "error" | "fatal";

export const EVENT_KIND = {
  ERROR: "error",
  MESSAGE: "message",
  HTTP: "http",
  RESOURCE: "resource",
  PERFORMANCE: "performance",
  ACTION: "action",
  BUSINESS: "business",
  CUSTOM: "custom",
} as const;

export type BuiltinEventKind = (typeof EVENT_KIND)[keyof typeof EVENT_KIND];
export type EventKind = BuiltinEventKind | (string & {});

export const EVENT_TYPE = {
  // Error events
  MANUAL_ERROR: "manual_error",
  JS_ERROR: "js_error",
  UNHANDLED_REJECTION: "unhandled_rejection",
  VUE_ERROR: "vue_error",
  REACT_ERROR: "react_error",

  // Network/resource events
  HTTP_ERROR: "http_error",
  RESOURCE_ERROR: "resource_error",

  // Message events
  MANUAL_MESSAGE: "manual_message",

  // Tracking (buried point) events
  TRACK_CLICK: "track_click",
  TRACK_EXPOSURE: "track_exposure",
  TRACK_SUBMIT: "track_submit",
  TRACK_NAVIGATION: "track_navigation",
  TRACK_CUSTOM: "track_custom",

  // Performance events
  PERF_FCP: "perf_fcp",
  PERF_LCP: "perf_lcp",
  PERF_CLS: "perf_cls",
  PERF_INP: "perf_inp",
  PERF_TTFB: "perf_ttfb",
  PERF_LONG_TASK: "perf_long_task",

  // Fallback
  CUSTOM_EVENT: "custom_event",
} as const;

export type BuiltinEventType = (typeof EVENT_TYPE)[keyof typeof EVENT_TYPE];
export type EventType = BuiltinEventType | (string & {});

export interface TransportSuccessResult {
  ok: true;
}

export interface TransportFailureResult {
  ok: false;
  error: unknown;
  retryable?: boolean;
  statusCode?: number;
}

export type TransportResult = TransportSuccessResult | TransportFailureResult;
export type TransportSendSource = "direct" | "queue";

export interface TransportFailureOptions {
  retryCount?: number;
  retryDelayMs?: number;
  maxRetryDelayMs?: number;
  queueEnabled?: boolean;
  maxQueueSize?: number;
  maxQueuedAttempts?: number;
}

export interface TransportErrorContext {
  event: MonitorEvent;
  result: TransportFailureResult;
  attempt: number;
  source: TransportSendSource;
  queued: boolean;
  queueSize: number;
  willRetry: boolean;
  dropped: boolean;
}

export interface Transport {
  send(event: MonitorEvent): TransportResult | Promise<TransportResult>;
  dispose?(): void;
}

export interface SDKOptions {
  dsn: string;
  appVersion?: string;
  environment?: "development" | "production" | "test";
  integrations?: Integration[];
  transport?: Transport;
  beforeSend?: (event: MonitorEvent) => MonitorEvent | null;
  transportFailureOptions?: TransportFailureOptions;
  onTransportError?: (context: TransportErrorContext) => void;
}

export interface MonitorEvent {
  kind: EventKind;
  type: EventType;
  level: EventLevel;
  message: string;
  stack?: string | null;
  timestamp: number;
  url: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  appVersion?: string;
  environment?: string;
  user?: Record<string, unknown>;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

export type MonitorEventInput = Partial<MonitorEvent>;

export interface TrackerInstance {
  captureException(error: unknown, extraInfo?: Record<string, unknown>): void;
  captureMessage(
    message: string,
    extraInfo?: Record<string, unknown>,
    level?: EventLevel,
  ): void;
  track(
    eventName: string,
    properties?: Record<string, unknown>,
    eventType?: EventType,
  ): void;
  captureEvent(event: MonitorEventInput): void;
  setUser(user: Record<string, unknown>): void;
  clearUser(): void;
  setTag(key: string, value: string): void;
  getDsn(): string;
  flush(): Promise<void>;
}

export interface Integration {
  name: string;
  setup: (tracker: TrackerInstance) => void;
  dispose?: () => void;
}
