import { EVENT_KIND, EVENT_TYPE } from "../../core/types";
import type { TrackerInstance } from "../../core/types";
import type { ResolvedBrowserErrorCollectionOptions } from "./options";

export const setupBrowserErrorCollection = (
  tracker: TrackerInstance,
  options: ResolvedBrowserErrorCollectionOptions,
): void => {
  if (!options.enabled) {
    return;
  }

  if (options.jsError || options.resourceError) {
    window.addEventListener(
      "error",
      (event: ErrorEvent | Event) => {
        const target = event.target as EventTarget | null;

        if (options.resourceError && isResourceErrorTarget(target)) {
          const resourceUrl =
            (target as HTMLImageElement).src ||
            (target as HTMLLinkElement).href ||
            "";
          const tagName = target.tagName.toLowerCase();

          tracker.captureEvent({
            kind: EVENT_KIND.RESOURCE,
            type: EVENT_TYPE.RESOURCE_ERROR,
            level: "error",
            message: `Static resource failed: <${tagName}>`,
            url: resourceUrl,
            extra: {
              tagName,
            },
          });
          return;
        }

        if (!options.jsError) {
          return;
        }

        const errorEvent = event as ErrorEvent;
        tracker.captureEvent({
          kind: EVENT_KIND.ERROR,
          type: EVENT_TYPE.JS_ERROR,
          level: "error",
          message: errorEvent.message || "Unknown script error",
          stack: errorEvent.error?.stack || null,
          filename: errorEvent.filename,
          lineno: errorEvent.lineno,
          colno: errorEvent.colno,
        });
      },
      true,
    );
  }

  if (options.unhandledRejection) {
    window.addEventListener(
      "unhandledrejection",
      (event: PromiseRejectionEvent) => {
        const reason = event.reason;
        tracker.captureEvent({
          kind: EVENT_KIND.ERROR,
          type: EVENT_TYPE.UNHANDLED_REJECTION,
          level: "error",
          message: extractPromiseMessage(reason),
          stack: reason instanceof Error ? reason.stack : null,
        });
      },
    );
  }
};

const isResourceErrorTarget = (target: EventTarget | null): target is HTMLElement => {
  return target instanceof HTMLElement;
};

const extractPromiseMessage = (reason: unknown): string => {
  if (typeof reason === "string") {
    return reason;
  }

  if (reason instanceof Error) {
    return reason.message;
  }

  try {
    return JSON.stringify(reason);
  } catch {
    return "Promise rejected with non-serializable value";
  }
};
