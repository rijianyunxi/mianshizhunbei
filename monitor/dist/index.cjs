/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  BaseIntegration: () => (/* reexport */ BaseIntegration),
  BrowserIntegration: () => (/* reexport */ BrowserIntegration),
  BrowserTransport: () => (/* reexport */ BrowserTransport),
  EVENT_KIND: () => (/* reexport */ EVENT_KIND),
  EVENT_TYPE: () => (/* reexport */ EVENT_TYPE),
  FetchIntegration: () => (/* reexport */ FetchIntegration),
  FetchTransport: () => (/* reexport */ FetchTransport),
  MiniProgramIntegration: () => (/* reexport */ MiniProgramIntegration),
  MiniProgramTransport: () => (/* reexport */ MiniProgramTransport),
  MonitorSDK: () => (/* reexport */ MonitorSDK),
  SDK_LOG_PREFIX: () => (/* reexport */ SDK_LOG_PREFIX),
  SDK_PACKAGE_NAME: () => (/* reexport */ SDK_PACKAGE_NAME),
  VueIntegration: () => (/* reexport */ VueIntegration),
  XhrIntegration: () => (/* reexport */ XhrIntegration),
  createDefaultTransport: () => (/* reexport */ createDefaultTransport),
  sdkError: () => (/* reexport */ sdkError),
  sdkWarn: () => (/* reexport */ sdkWarn)
});

;// ./src/core/types.ts
const EVENT_KIND = {
    ERROR: "error",
    MESSAGE: "message",
    HTTP: "http",
    RESOURCE: "resource",
    PERFORMANCE: "performance",
    ACTION: "action",
    BUSINESS: "business",
    CUSTOM: "custom",
};
const EVENT_TYPE = {
    // Error events
    MANUAL_ERROR: "manual_error",
    JS_ERROR: "js_error",
    UNHANDLED_REJECTION: "unhandled_rejection",
    VUE_ERROR: "vue_error",
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
};

;// ./src/core/logger.ts
const SDK_PACKAGE_NAME = "oh-my-monitor-sdk";
const SDK_LOG_PREFIX = `[${SDK_PACKAGE_NAME}]`;
const sdkWarn = (message, ...args) => {
    console.warn(`${SDK_LOG_PREFIX} ${message}`, ...args);
};
const sdkError = (message, ...args) => {
    console.error(`${SDK_LOG_PREFIX} ${message}`, ...args);
};

;// ./src/utils/platform.ts
const MINI_PROGRAM_GLOBAL_KEYS = ["wx", "tt", "swan", "my", "uni"];
const getMiniProgramGlobal = () => {
    const globalObject = globalThis;
    for (const key of MINI_PROGRAM_GLOBAL_KEYS) {
        const candidate = globalObject[key];
        if (!candidate || typeof candidate !== "object") {
            continue;
        }
        if ("request" in candidate ||
            "onError" in candidate ||
            "onUnhandledRejection" in candidate) {
            return candidate;
        }
    }
    return null;
};
const isBrowserRuntime = () => {
    return typeof window !== "undefined" && typeof document !== "undefined";
};
const isMiniProgramRuntime = () => {
    return getMiniProgramGlobal() !== null;
};
const detectRuntimePlatform = () => {
    if (isMiniProgramRuntime()) {
        return "mini-program";
    }
    if (isBrowserRuntime()) {
        return "browser";
    }
    return "unknown";
};
const getCurrentMiniProgramRoute = () => {
    var _a, _b;
    const globalObject = globalThis;
    if (typeof globalObject.getCurrentPages !== "function") {
        return null;
    }
    try {
        const pages = globalObject.getCurrentPages();
        if (!Array.isArray(pages) || pages.length === 0) {
            return "app_launch";
        }
        const currentPage = pages[pages.length - 1];
        return (_b = (_a = currentPage.route) !== null && _a !== void 0 ? _a : currentPage.__route__) !== null && _b !== void 0 ? _b : "unknown_mini_program_route";
    }
    catch (_c) {
        return "unknown_mini_program_route";
    }
};

;// ./src/utils/context.ts

function getPageUrl() {
    const miniProgramRoute = getCurrentMiniProgramRoute();
    if (miniProgramRoute) {
        return miniProgramRoute;
    }
    if (typeof window !== "undefined" && window.location) {
        return window.location.href;
    }
    return "unknown_environment";
}

;// ./src/utils/request.ts
const SDK_INJECTED_HEADER = "X-SDK-Injected";
const SDK_INJECTED_HEADER_VALUE = "true";
const normalizeRequestUrl = (url) => {
    const normalizedInput = url.trim();
    if (!normalizedInput) {
        return normalizedInput;
    }
    if (typeof URL === "function") {
        try {
            const base = typeof window !== "undefined" && window.location
                ? window.location.href
                : undefined;
            return base
                ? new URL(normalizedInput, base).toString()
                : new URL(normalizedInput).toString();
        }
        catch (_a) {
            return normalizedInput;
        }
    }
    return normalizedInput;
};
const isSameRequestEndpoint = (url, dsn) => {
    return normalizeRequestUrl(url) === normalizeRequestUrl(dsn);
};
const isSdkInjectedRequest = (headers) => {
    return extractHeader(headers, SDK_INJECTED_HEADER) !== null;
};
const matchesRequestUrlRule = (url, rule) => {
    if (typeof rule === "string") {
        return url.includes(rule);
    }
    return rule.test(url);
};
const shouldSkipMonitoringRequest = ({ url, dsn, headers, ignoreUrls = [], }) => {
    if (isSameRequestEndpoint(url, dsn)) {
        return true;
    }
    if (ignoreUrls.some((rule) => matchesRequestUrlRule(url, rule))) {
        return true;
    }
    return isSdkInjectedRequest(headers);
};
const extractHeader = (headers, key) => {
    if (!headers) {
        return null;
    }
    if (typeof Headers !== "undefined" && headers instanceof Headers) {
        return headers.get(key);
    }
    if (Array.isArray(headers)) {
        const matchedHeader = headers.find((header) => {
            return (Array.isArray(header) &&
                header.length >= 2 &&
                String(header[0]).toLowerCase() === key.toLowerCase());
        });
        return matchedHeader ? String(matchedHeader[1]) : null;
    }
    if (typeof headers === "object") {
        const headerRecord = headers;
        const matchedKey = Object.keys(headerRecord).find((headerKey) => {
            return headerKey.toLowerCase() === key.toLowerCase();
        });
        return matchedKey ? String(headerRecord[matchedKey]) : null;
    }
    return null;
};

;// ./src/core/transports/fetch.ts
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

const DEFAULT_HEADERS = {
    "Content-Type": "application/json",
    [SDK_INJECTED_HEADER]: SDK_INJECTED_HEADER_VALUE,
};
class FetchTransport {
    constructor(options) {
        var _a;
        this.dsn = options.dsn;
        this.headers = Object.assign(Object.assign({}, DEFAULT_HEADERS), ((_a = options.headers) !== null && _a !== void 0 ? _a : {}));
    }
    send(event) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof fetch !== "function") {
                return {
                    ok: false,
                    error: new Error("Fetch API is not available in the current runtime."),
                    retryable: false,
                };
            }
            try {
                const response = yield fetch(this.dsn, {
                    method: "POST",
                    body: JSON.stringify(event),
                    keepalive: true,
                    headers: this.headers,
                });
                if (!response.ok) {
                    return {
                        ok: false,
                        error: new Error(`Transport request failed with status ${response.status}.`),
                        statusCode: response.status,
                        retryable: response.status >= 500 || response.status === 429,
                    };
                }
                return { ok: true };
            }
            catch (sendError) {
                return {
                    ok: false,
                    error: sendError,
                    retryable: true,
                };
            }
        });
    }
}

;// ./src/core/transports/browser.ts

class BrowserTransport {
    constructor(options) {
        this.dsn = options.dsn;
        this.fetchTransport = new FetchTransport({
            dsn: options.dsn,
        });
    }
    send(event) {
        const data = JSON.stringify(event);
        if (typeof navigator !== "undefined" &&
            typeof navigator.sendBeacon === "function") {
            const body = typeof Blob === "function"
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

;// ./src/core/transports/miniprogram.ts


const MINI_PROGRAM_HEADERS = {
    "content-type": "application/json",
    [SDK_INJECTED_HEADER]: SDK_INJECTED_HEADER_VALUE,
};
class MiniProgramTransport {
    constructor(options) {
        var _a;
        this.dsn = options.dsn;
        this.api = (_a = options.api) !== null && _a !== void 0 ? _a : getMiniProgramGlobal();
    }
    send(event) {
        const api = this.api;
        const request = api === null || api === void 0 ? void 0 : api.request;
        if (!request) {
            return {
                ok: false,
                error: new Error("Mini program request API is not available in the current runtime."),
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
                        const statusCode = typeof (result === null || result === void 0 ? void 0 : result.statusCode) === "number" ? result.statusCode : undefined;
                        if (statusCode !== undefined && statusCode >= 400) {
                            resolve({
                                ok: false,
                                error: new Error(`Transport request failed with status ${statusCode}.`),
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
            }
            catch (sendError) {
                resolve({
                    ok: false,
                    error: sendError,
                    retryable: true,
                });
            }
        });
    }
}

;// ./src/core/transports/index.ts




class NoopTransport {
    send() {
        return {
            ok: false,
            error: new Error("No transport is available for the current runtime."),
            retryable: false,
        };
    }
}
const createDefaultTransport = (dsn) => {
    const runtimePlatform = detectRuntimePlatform();
    if (runtimePlatform === "mini-program") {
        const miniProgramApi = getMiniProgramGlobal();
        if (miniProgramApi === null || miniProgramApi === void 0 ? void 0 : miniProgramApi.request) {
            return new MiniProgramTransport({
                dsn,
                api: miniProgramApi,
            });
        }
    }
    if (runtimePlatform === "browser") {
        return new BrowserTransport({ dsn });
    }
    if (typeof fetch === "function") {
        return new FetchTransport({ dsn });
    }
    return new NoopTransport();
};

;// ./src/core/core.ts
var core_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};




class MonitorSDK {
    constructor(options) {
        var _a, _b;
        this.userContext = {};
        this.tagsContext = {};
        this.activeIntegrations = [];
        this.pendingQueue = [];
        this.queueFlushTimer = null;
        this.isFlushingQueue = false;
        this.isDisposed = false;
        if (!options.dsn) {
            throw new Error(`${SDK_PACKAGE_NAME}: dsn is required!`);
        }
        this.options = options;
        this.transport = (_a = options.transport) !== null && _a !== void 0 ? _a : createDefaultTransport(options.dsn);
        this.transportFailureOptions = Object.assign(Object.assign({}, MonitorSDK.DEFAULT_TRANSPORT_FAILURE_OPTIONS), ((_b = options.transportFailureOptions) !== null && _b !== void 0 ? _b : {}));
        this.setupIntegrations();
    }
    getDsn() {
        return this.options.dsn;
    }
    flush() {
        return core_awaiter(this, void 0, void 0, function* () {
            yield this.flushQueue();
        });
    }
    setupIntegrations() {
        this.activeIntegrations = [];
        const rawIntegrations = this.options.integrations;
        if (rawIntegrations == null) {
            return;
        }
        if (!Array.isArray(rawIntegrations)) {
            sdkWarn("options.integrations must be an array.");
            return;
        }
        const mountedNames = new Set();
        rawIntegrations.forEach((candidate, index) => {
            if (!this.isValidIntegration(candidate)) {
                sdkWarn(`invalid integration at index ${index}, expected { name: string, setup: Function }.`);
                return;
            }
            const integrationName = candidate.name.trim();
            if (mountedNames.has(integrationName)) {
                sdkWarn(`integration "${integrationName}" is duplicated and will be ignored.`);
                return;
            }
            mountedNames.add(integrationName);
            try {
                candidate.setup(this);
                this.activeIntegrations.push(candidate);
            }
            catch (error) {
                sdkError(`integration "${integrationName}" setup failed.`, error);
            }
        });
    }
    dispose() {
        this.isDisposed = true;
        const integrations = [...this.activeIntegrations].reverse();
        integrations.forEach((integration) => {
            if (typeof integration.dispose !== "function") {
                return;
            }
            try {
                integration.dispose();
            }
            catch (error) {
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
    isValidIntegration(candidate) {
        if (!candidate || typeof candidate !== "object") {
            return false;
        }
        const integration = candidate;
        return (typeof integration.name === "string" &&
            integration.name.trim().length > 0 &&
            typeof integration.setup === "function" &&
            (integration.dispose === undefined ||
                typeof integration.dispose === "function"));
    }
    setUser(user) {
        this.userContext = Object.assign(Object.assign({}, this.userContext), user);
    }
    clearUser() {
        this.userContext = {};
    }
    setTag(key, value) {
        this.tagsContext[key] = value;
    }
    captureException(error, extraInfo) {
        const normalized = this.normalizeUnknownError(error);
        this.captureEvent(this.createExceptionEvent(normalized, extraInfo));
    }
    captureMessage(message, extraInfo, level = "info") {
        this.captureEvent(this.createMessageEvent(message, extraInfo, level));
    }
    track(eventName, properties = {}, eventType = EVENT_TYPE.TRACK_CUSTOM) {
        this.captureEvent(this.createTrackEvent(eventName, properties, eventType));
    }
    captureEvent(partialEvent) {
        var _a, _b;
        const eventTimestamp = (_a = partialEvent.timestamp) !== null && _a !== void 0 ? _a : Date.now();
        let finalEvent = {
            kind: partialEvent.kind || this.inferKind(partialEvent),
            type: partialEvent.type || EVENT_TYPE.CUSTOM_EVENT,
            level: partialEvent.level || this.inferLevel(partialEvent),
            message: partialEvent.message || "",
            stack: (_b = partialEvent.stack) !== null && _b !== void 0 ? _b : null,
            filename: partialEvent.filename,
            lineno: partialEvent.lineno,
            colno: partialEvent.colno,
            timestamp: eventTimestamp,
            url: partialEvent.url || getPageUrl(),
            appVersion: this.options.appVersion,
            environment: this.options.environment,
            user: Object.assign({}, this.userContext),
            tags: Object.assign({}, this.tagsContext),
            extra: Object.assign({}, (partialEvent.extra || {})),
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
    createExceptionEvent(error, extraInfo) {
        return {
            kind: EVENT_KIND.ERROR,
            type: EVENT_TYPE.MANUAL_ERROR,
            level: "error",
            message: error.message,
            stack: error.stack,
            extra: extraInfo || {},
        };
    }
    createMessageEvent(message, extraInfo, level = "info") {
        return {
            kind: EVENT_KIND.MESSAGE,
            type: EVENT_TYPE.MANUAL_MESSAGE,
            level,
            message,
            extra: extraInfo || {},
        };
    }
    createTrackEvent(eventName, properties, eventType) {
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
    inferKind(partialEvent) {
        var _a, _b;
        if (partialEvent.stack || partialEvent.filename) {
            return EVENT_KIND.ERROR;
        }
        if ((_a = partialEvent.type) === null || _a === void 0 ? void 0 : _a.includes("http")) {
            return EVENT_KIND.HTTP;
        }
        if ((_b = partialEvent.type) === null || _b === void 0 ? void 0 : _b.includes("resource")) {
            return EVENT_KIND.RESOURCE;
        }
        return EVENT_KIND.CUSTOM;
    }
    inferLevel(partialEvent) {
        var _a;
        if (partialEvent.kind === EVENT_KIND.ERROR) {
            return "error";
        }
        if ((_a = partialEvent.type) === null || _a === void 0 ? void 0 : _a.includes("error")) {
            return "error";
        }
        return "info";
    }
    normalizeUnknownError(error) {
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
        }
        catch (_a) {
            return {
                message: "Unknown error",
                stack: null,
            };
        }
    }
    send(payload) {
        void this.deliverEvent({
            event: payload,
            attempt: 0,
            queueAttempt: 0,
            nextAttemptAt: 0,
        }, "direct");
    }
    deliverEvent(transportEvent, source) {
        return core_awaiter(this, void 0, void 0, function* () {
            if (this.isDisposed) {
                return;
            }
            const sendResult = yield this.sendWithRetries(transportEvent, source);
            if (sendResult.ok) {
                if (this.pendingQueue.length > 0) {
                    this.scheduleQueueFlush(0);
                }
                return;
            }
            if (this.shouldQueueEvent(transportEvent, sendResult)) {
                this.enqueueTransportEvent(transportEvent);
            }
        });
    }
    sendWithRetries(transportEvent, source) {
        return core_awaiter(this, void 0, void 0, function* () {
            let attemptInCycle = 0;
            while (attemptInCycle <= this.transportFailureOptions.retryCount) {
                attemptInCycle += 1;
                transportEvent.attempt += 1;
                let sendResult;
                try {
                    sendResult = yield this.transport.send(transportEvent.event);
                }
                catch (sendError) {
                    sendResult = {
                        ok: false,
                        error: sendError,
                        retryable: true,
                    };
                }
                if (sendResult.ok) {
                    return sendResult;
                }
                const willRetry = Boolean(sendResult.retryable) &&
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
                yield this.wait(this.getRetryDelay(attemptInCycle));
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
        });
    }
    handleTransportError(context) {
        var _a, _b, _c;
        sdkError("failed to send event", {
            type: context.event.type,
            kind: context.event.kind,
            level: context.event.level,
            url: context.event.url,
            statusCode: context.result.statusCode,
            retryable: (_a = context.result.retryable) !== null && _a !== void 0 ? _a : false,
            error: context.result.error,
            attempt: context.attempt,
            source: context.source,
            queued: context.queued,
            queueSize: context.queueSize,
            willRetry: context.willRetry,
            dropped: context.dropped,
        });
        try {
            (_c = (_b = this.options).onTransportError) === null || _c === void 0 ? void 0 : _c.call(_b, context);
        }
        catch (hookError) {
            sdkError("onTransportError hook failed.", hookError);
        }
    }
    shouldQueueEvent(transportEvent, result) {
        return (!this.isDisposed &&
            this.transportFailureOptions.queueEnabled &&
            Boolean(result.retryable) &&
            transportEvent.queueAttempt < this.transportFailureOptions.maxQueuedAttempts);
    }
    enqueueTransportEvent(transportEvent) {
        const nextQueueAttempt = transportEvent.queueAttempt + 1;
        const queuedEvent = Object.assign(Object.assign({}, transportEvent), { queueAttempt: nextQueueAttempt, nextAttemptAt: Date.now() + this.getRetryDelay(nextQueueAttempt) });
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
    scheduleQueueFlush(delayMs) {
        if (this.isDisposed || this.pendingQueue.length === 0) {
            return;
        }
        this.clearQueueFlushTimer();
        this.queueFlushTimer = setTimeout(() => {
            this.queueFlushTimer = null;
            void this.flushQueue();
        }, Math.max(0, delayMs));
    }
    flushQueue() {
        return core_awaiter(this, void 0, void 0, function* () {
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
                    const sendResult = yield this.sendWithRetries(queuedEvent, "queue");
                    if (sendResult.ok) {
                        continue;
                    }
                    if (this.shouldQueueEvent(queuedEvent, sendResult)) {
                        this.enqueueTransportEvent(queuedEvent);
                    }
                    else {
                        this.handleTransportError({
                            event: queuedEvent.event,
                            result: Object.assign(Object.assign({}, sendResult), { retryable: false }),
                            attempt: queuedEvent.attempt,
                            source: "queue",
                            queued: false,
                            queueSize: this.pendingQueue.length,
                            willRetry: false,
                            dropped: true,
                        });
                    }
                }
            }
            finally {
                this.isFlushingQueue = false;
            }
        });
    }
    getRetryDelay(attempt) {
        const baseDelay = this.transportFailureOptions.retryDelayMs;
        const maxDelay = this.transportFailureOptions.maxRetryDelayMs;
        const backoffDelay = baseDelay * Math.pow(2, Math.max(0, attempt - 1));
        return Math.min(backoffDelay, maxDelay);
    }
    getQueueFlushDelay() {
        if (this.pendingQueue.length === 0) {
            return 0;
        }
        const nextAttemptAt = Math.min(...this.pendingQueue.map((queuedEvent) => queuedEvent.nextAttemptAt));
        return Math.max(0, nextAttemptAt - Date.now());
    }
    clearQueueFlushTimer() {
        if (this.queueFlushTimer === null) {
            return;
        }
        clearTimeout(this.queueFlushTimer);
        this.queueFlushTimer = null;
    }
    wait(delayMs) {
        return new Promise((resolve) => {
            setTimeout(resolve, delayMs);
        });
    }
}
MonitorSDK.DEFAULT_TRANSPORT_FAILURE_OPTIONS = {
    retryCount: 2,
    retryDelayMs: 1000,
    maxRetryDelayMs: 10000,
    queueEnabled: true,
    maxQueueSize: 20,
    maxQueuedAttempts: 3,
};

;// ./src/core/BaseIntegration.ts

class BaseIntegration {
    constructor() {
        this.isSetup = false;
        this.trackerInstance = null;
    }
    setup(tracker) {
        if (this.isSetup) {
            return;
        }
        try {
            this.setupCore(tracker);
            this.trackerInstance = tracker;
            this.isSetup = true;
        }
        catch (error) {
            this.trackerInstance = null;
            this.isSetup = false;
            sdkError(`integration "${this.name}" setup failed.`, error);
        }
    }
    dispose() {
        if (!this.isSetup || !this.trackerInstance) {
            return;
        }
        try {
            this.teardownCore(this.trackerInstance);
        }
        catch (error) {
            sdkError(`integration "${this.name}" dispose failed.`, error);
        }
        finally {
            this.trackerInstance = null;
            this.isSetup = false;
        }
    }
    teardownCore(_tracker) { }
}

;// ./src/intergrations/browser/errors.ts

const setupBrowserErrorCollection = (tracker, options) => {
    if (!options.enabled) {
        return;
    }
    if (options.jsError || options.resourceError) {
        window.addEventListener("error", (event) => {
            var _a;
            const target = event.target;
            if (options.resourceError && isResourceErrorTarget(target)) {
                const resourceUrl = target.src ||
                    target.href ||
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
            const errorEvent = event;
            tracker.captureEvent({
                kind: EVENT_KIND.ERROR,
                type: EVENT_TYPE.JS_ERROR,
                level: "error",
                message: errorEvent.message || "Unknown script error",
                stack: ((_a = errorEvent.error) === null || _a === void 0 ? void 0 : _a.stack) || null,
                filename: errorEvent.filename,
                lineno: errorEvent.lineno,
                colno: errorEvent.colno,
            });
        }, true);
    }
    if (options.unhandledRejection) {
        window.addEventListener("unhandledrejection", (event) => {
            const reason = event.reason;
            tracker.captureEvent({
                kind: EVENT_KIND.ERROR,
                type: EVENT_TYPE.UNHANDLED_REJECTION,
                level: "error",
                message: extractPromiseMessage(reason),
                stack: reason instanceof Error ? reason.stack : null,
            });
        });
    }
};
const isResourceErrorTarget = (target) => {
    return target instanceof HTMLElement;
};
const extractPromiseMessage = (reason) => {
    if (typeof reason === "string") {
        return reason;
    }
    if (reason instanceof Error) {
        return reason.message;
    }
    try {
        return JSON.stringify(reason);
    }
    catch (_a) {
        return "Promise rejected with non-serializable value";
    }
};

;// ./src/intergrations/browser/options.ts
const DEFAULT_ERROR_OPTIONS = {
    enabled: true,
    jsError: true,
    resourceError: true,
    unhandledRejection: true,
};
const DEFAULT_VITALS_OPTIONS = {
    enabled: true,
    reportAllChanges: false,
    fcp: true,
    lcp: true,
    cls: true,
    inp: true,
    ttfb: true,
};
const DEFAULT_BROWSER_OPTIONS = {
    enabled: true,
    errors: DEFAULT_ERROR_OPTIONS,
    vitals: DEFAULT_VITALS_OPTIONS,
};
const resolveErrorOptions = (options = {}) => {
    return Object.assign(Object.assign({}, DEFAULT_ERROR_OPTIONS), options);
};
const resolveVitalsOptions = (options = {}) => {
    return Object.assign(Object.assign({}, DEFAULT_VITALS_OPTIONS), options);
};
const resolveBrowserIntegrationOptions = (options = {}) => {
    var _a;
    return {
        enabled: (_a = options.enabled) !== null && _a !== void 0 ? _a : DEFAULT_BROWSER_OPTIONS.enabled,
        errors: resolveErrorOptions(options.errors),
        vitals: resolveVitalsOptions(options.vitals),
    };
};

;// ./node_modules/.pnpm/web-vitals@5.1.0/node_modules/web-vitals/dist/web-vitals.js
let e=-1;const t=t=>{addEventListener("pageshow",(n=>{n.persisted&&(e=n.timeStamp,t(n))}),!0)},n=(e,t,n,i)=>{let s,o;return r=>{t.value>=0&&(r||i)&&(o=t.value-(s??0),(o||void 0===s)&&(s=t.value,t.delta=o,t.rating=((e,t)=>e>t[1]?"poor":e>t[0]?"needs-improvement":"good")(t.value,n),e(t)))}},i=e=>{requestAnimationFrame((()=>requestAnimationFrame((()=>e()))))},s=()=>{const e=performance.getEntriesByType("navigation")[0];if(e&&e.responseStart>0&&e.responseStart<performance.now())return e},o=()=>{const e=s();return e?.activationStart??0},r=(t,n=-1)=>{const i=s();let r="navigate";e>=0?r="back-forward-cache":i&&(document.prerendering||o()>0?r="prerender":document.wasDiscarded?r="restore":i.type&&(r=i.type.replace(/_/g,"-")));return{name:t,value:n,rating:"good",delta:0,entries:[],id:`v5-${Date.now()}-${Math.floor(8999999999999*Math.random())+1e12}`,navigationType:r}},c=new WeakMap;function a(e,t){return c.get(e)||c.set(e,new t),c.get(e)}class d{t;i=0;o=[];h(e){if(e.hadRecentInput)return;const t=this.o[0],n=this.o.at(-1);this.i&&t&&n&&e.startTime-n.startTime<1e3&&e.startTime-t.startTime<5e3?(this.i+=e.value,this.o.push(e)):(this.i=e.value,this.o=[e]),this.t?.(e)}}const h=(e,t,n={})=>{try{if(PerformanceObserver.supportedEntryTypes.includes(e)){const i=new PerformanceObserver((e=>{Promise.resolve().then((()=>{t(e.getEntries())}))}));return i.observe({type:e,buffered:!0,...n}),i}}catch{}},f=e=>{let t=!1;return()=>{t||(e(),t=!0)}};let u=-1;const l=new Set,m=()=>"hidden"!==document.visibilityState||document.prerendering?1/0:0,p=e=>{if("hidden"===document.visibilityState){if("visibilitychange"===e.type)for(const e of l)e();isFinite(u)||(u="visibilitychange"===e.type?e.timeStamp:0,removeEventListener("prerenderingchange",p,!0))}},v=()=>{if(u<0){const e=o(),n=document.prerendering?void 0:globalThis.performance.getEntriesByType("visibility-state").filter((t=>"hidden"===t.name&&t.startTime>e))[0]?.startTime;u=n??m(),addEventListener("visibilitychange",p,!0),addEventListener("prerenderingchange",p,!0),t((()=>{setTimeout((()=>{u=m()}))}))}return{get firstHiddenTime(){return u},onHidden(e){l.add(e)}}},g=e=>{document.prerendering?addEventListener("prerenderingchange",(()=>e()),!0):e()},y=[1800,3e3],E=(e,s={})=>{g((()=>{const c=v();let a,d=r("FCP");const f=h("paint",(e=>{for(const t of e)"first-contentful-paint"===t.name&&(f.disconnect(),t.startTime<c.firstHiddenTime&&(d.value=Math.max(t.startTime-o(),0),d.entries.push(t),a(!0)))}));f&&(a=n(e,d,y,s.reportAllChanges),t((t=>{d=r("FCP"),a=n(e,d,y,s.reportAllChanges),i((()=>{d.value=performance.now()-t.timeStamp,a(!0)}))})))}))},b=[.1,.25],L=(e,s={})=>{const o=v();E(f((()=>{let c,f=r("CLS",0);const u=a(s,d),l=e=>{for(const t of e)u.h(t);u.i>f.value&&(f.value=u.i,f.entries=u.o,c())},m=h("layout-shift",l);m&&(c=n(e,f,b,s.reportAllChanges),o.onHidden((()=>{l(m.takeRecords()),c(!0)})),t((()=>{u.i=0,f=r("CLS",0),c=n(e,f,b,s.reportAllChanges),i((()=>c()))})),setTimeout(c))})))};let P=0,T=1/0,_=0;const M=e=>{for(const t of e)t.interactionId&&(T=Math.min(T,t.interactionId),_=Math.max(_,t.interactionId),P=_?(_-T)/7+1:0)};let w;const C=()=>w?P:performance.interactionCount??0,I=()=>{"interactionCount"in performance||w||(w=h("event",M,{type:"event",buffered:!0,durationThreshold:0}))};let F=0;class k{u=[];l=new Map;m;p;v(){F=C(),this.u.length=0,this.l.clear()}L(){const e=Math.min(this.u.length-1,Math.floor((C()-F)/50));return this.u[e]}h(e){if(this.m?.(e),!e.interactionId&&"first-input"!==e.entryType)return;const t=this.u.at(-1);let n=this.l.get(e.interactionId);if(n||this.u.length<10||e.duration>t.P){if(n?e.duration>n.P?(n.entries=[e],n.P=e.duration):e.duration===n.P&&e.startTime===n.entries[0].startTime&&n.entries.push(e):(n={id:e.interactionId,entries:[e],P:e.duration},this.l.set(n.id,n),this.u.push(n)),this.u.sort(((e,t)=>t.P-e.P)),this.u.length>10){const e=this.u.splice(10);for(const t of e)this.l.delete(t.id)}this.p?.(n)}}}const A=e=>{const t=globalThis.requestIdleCallback||setTimeout;"hidden"===document.visibilityState?e():(e=f(e),addEventListener("visibilitychange",e,{once:!0,capture:!0}),t((()=>{e(),removeEventListener("visibilitychange",e,{capture:!0})})))},B=[200,500],S=(e,i={})=>{if(!globalThis.PerformanceEventTiming||!("interactionId"in PerformanceEventTiming.prototype))return;const s=v();g((()=>{I();let o,c=r("INP");const d=a(i,k),f=e=>{A((()=>{for(const t of e)d.h(t);const t=d.L();t&&t.P!==c.value&&(c.value=t.P,c.entries=t.entries,o())}))},u=h("event",f,{durationThreshold:i.durationThreshold??40});o=n(e,c,B,i.reportAllChanges),u&&(u.observe({type:"first-input",buffered:!0}),s.onHidden((()=>{f(u.takeRecords()),o(!0)})),t((()=>{d.v(),c=r("INP"),o=n(e,c,B,i.reportAllChanges)})))}))};class N{m;h(e){this.m?.(e)}}const q=[2500,4e3],x=(e,s={})=>{g((()=>{const c=v();let d,u=r("LCP");const l=a(s,N),m=e=>{s.reportAllChanges||(e=e.slice(-1));for(const t of e)l.h(t),t.startTime<c.firstHiddenTime&&(u.value=Math.max(t.startTime-o(),0),u.entries=[t],d())},p=h("largest-contentful-paint",m);if(p){d=n(e,u,q,s.reportAllChanges);const o=f((()=>{m(p.takeRecords()),p.disconnect(),d(!0)})),c=e=>{e.isTrusted&&(A(o),removeEventListener(e.type,c,{capture:!0}))};for(const e of["keydown","click","visibilitychange"])addEventListener(e,c,{capture:!0});t((t=>{u=r("LCP"),d=n(e,u,q,s.reportAllChanges),i((()=>{u.value=performance.now()-t.timeStamp,d(!0)}))}))}}))},H=[800,1800],O=e=>{document.prerendering?g((()=>O(e))):"complete"!==document.readyState?addEventListener("load",(()=>O(e)),!0):setTimeout(e)},$=(e,i={})=>{let c=r("TTFB"),a=n(e,c,H,i.reportAllChanges);O((()=>{const d=s();d&&(c.value=Math.max(d.responseStart-o(),0),c.entries=[d],a(!0),t((()=>{c=r("TTFB",0),a=n(e,c,H,i.reportAllChanges),a(!0)})))}))};

;// ./src/intergrations/browser/vitals.ts


const METRIC_EVENT_TYPE_MAP = {
    FCP: EVENT_TYPE.PERF_FCP,
    LCP: EVENT_TYPE.PERF_LCP,
    CLS: EVENT_TYPE.PERF_CLS,
    INP: EVENT_TYPE.PERF_INP,
    TTFB: EVENT_TYPE.PERF_TTFB,
};
const setupWebVitalsCollection = (tracker, options) => {
    if (!options.enabled) {
        return;
    }
    const createReportOptions = () => ({
        reportAllChanges: options.reportAllChanges,
    });
    const reportMetric = (metric) => {
        console.log(metric);
        tracker.captureEvent({
            kind: EVENT_KIND.PERFORMANCE,
            type: METRIC_EVENT_TYPE_MAP[metric.name],
            level: mapRatingToLevel(metric.rating),
            message: buildMetricMessage(metric),
            extra: {
                metricName: metric.name,
                value: metric.value,
                delta: metric.delta,
                rating: metric.rating,
                metricId: metric.id,
                navigationType: metric.navigationType,
                entriesCount: metric.entries.length,
            },
        });
    };
    if (options.fcp) {
        E(reportMetric, createReportOptions());
    }
    if (options.lcp) {
        x(reportMetric, createReportOptions());
    }
    if (options.cls) {
        L(reportMetric, createReportOptions());
    }
    if (options.inp) {
        S(reportMetric, createReportOptions());
    }
    if (options.ttfb) {
        $(reportMetric, createReportOptions());
    }
};
const mapRatingToLevel = (rating) => {
    if (rating === "poor") {
        return "error";
    }
    if (rating === "needs-improvement") {
        return "warn";
    }
    return "info";
};
const buildMetricMessage = (metric) => {
    const unit = metric.name === "CLS" ? "" : "ms";
    return `${metric.name}: ${metric.value.toFixed(2)}${unit}`;
};

;// ./src/intergrations/browser/index.ts




class BrowserIntegration extends BaseIntegration {
    /**
     * @param options 浏览器端采集配置。
     */
    constructor(options) {
        super();
        this.name = "BrowserIntegration";
        options = options !== null && options !== void 0 ? options : {};
        this.options = resolveBrowserIntegrationOptions(options);
    }
    setupCore(tracker) {
        if (!this.options.enabled) {
            return;
        }
        if (typeof window === "undefined") {
            return;
        }
        setupBrowserErrorCollection(tracker, this.options.errors);
        setupWebVitalsCollection(tracker, this.options.vitals);
    }
}

;// ./src/intergrations/fetch.ts
var fetch_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};



const resolveFetchIntegrationOptions = (options = {}) => {
    var _a, _b, _c, _d;
    return {
        enabled: (_a = options.enabled) !== null && _a !== void 0 ? _a : true,
        statusErrorThreshold: (_b = options.statusErrorThreshold) !== null && _b !== void 0 ? _b : 400,
        captureRequestBody: (_c = options.captureRequestBody) !== null && _c !== void 0 ? _c : true,
        ignoreUrls: (_d = options.ignoreUrls) !== null && _d !== void 0 ? _d : [],
    };
};
class FetchIntegration extends BaseIntegration {
    /**
     * @param options fetch 请求采集配置。
     */
    constructor(options = {}) {
        super();
        this.name = "FetchIntegration";
        this.options = resolveFetchIntegrationOptions(options);
    }
    setupCore(tracker) {
        if (!this.options.enabled) {
            return;
        }
        if (typeof window === "undefined" || typeof window.fetch !== "function") {
            return;
        }
        this.instrumentFetch(tracker);
    }
    instrumentFetch(tracker) {
        const originalFetch = window.fetch;
        const dsn = tracker.getDsn();
        window.fetch = (...args) => fetch_awaiter(this, void 0, void 0, function* () {
            const [input, init] = args;
            const start = performance.now();
            const url = this.resolveUrl(input);
            const method = this.resolveMethod(input, init);
            const requestBody = this.resolveRequestBody(input, init, method);
            if (this.shouldSkipRequest(url, dsn, input, init)) {
                return originalFetch(...args);
            }
            try {
                const response = yield originalFetch(...args);
                const duration = performance.now() - start;
                if (response.status >= this.options.statusErrorThreshold) {
                    tracker.captureEvent({
                        kind: EVENT_KIND.HTTP,
                        type: EVENT_TYPE.HTTP_ERROR,
                        level: "error",
                        message: `Fetch ${method} ${response.status} ${response.statusText}`,
                        extra: {
                            url,
                            method,
                            status: response.status,
                            statusText: response.statusText,
                            durationMs: Number(duration.toFixed(2)),
                            requestData: requestBody,
                        },
                    });
                }
                return response;
            }
            catch (error) {
                const duration = performance.now() - start;
                tracker.captureEvent({
                    kind: EVENT_KIND.HTTP,
                    type: EVENT_TYPE.HTTP_ERROR,
                    level: "error",
                    message: error instanceof Error ? error.message : "Network Error",
                    extra: {
                        url,
                        method,
                        durationMs: Number(duration.toFixed(2)),
                        requestData: requestBody,
                    },
                });
                throw error;
            }
        });
    }
    resolveUrl(input) {
        if (typeof input === "string") {
            return input;
        }
        if (input instanceof URL) {
            return input.href;
        }
        return input.url;
    }
    resolveMethod(input, init) {
        if (init === null || init === void 0 ? void 0 : init.method) {
            return init.method.toUpperCase();
        }
        if (typeof Request !== "undefined" && input instanceof Request) {
            return input.method.toUpperCase();
        }
        return "GET";
    }
    resolveRequestBody(input, init, method) {
        if (!this.options.captureRequestBody) {
            return undefined;
        }
        if (method === "GET" || method === "HEAD") {
            return null;
        }
        const body = init === null || init === void 0 ? void 0 : init.body;
        if (!body && typeof Request !== "undefined" && input instanceof Request) {
            return "[RequestBody stream]";
        }
        if (body instanceof FormData) {
            return "[FormData]";
        }
        if (body instanceof Blob) {
            return "[Blob]";
        }
        return body !== null && body !== void 0 ? body : null;
    }
    shouldSkipRequest(url, dsn, input, init) {
        if (shouldSkipMonitoringRequest({
            url,
            dsn,
            headers: init === null || init === void 0 ? void 0 : init.headers,
            ignoreUrls: this.options.ignoreUrls,
        })) {
            return true;
        }
        return (typeof Request !== "undefined" &&
            input instanceof Request &&
            isSdkInjectedRequest(input.headers));
    }
}

;// ./src/intergrations/xhr.ts



const resolveXhrIntegrationOptions = (options = {}) => {
    var _a, _b, _c, _d;
    return {
        enabled: (_a = options.enabled) !== null && _a !== void 0 ? _a : true,
        statusErrorThreshold: (_b = options.statusErrorThreshold) !== null && _b !== void 0 ? _b : 400,
        captureRequestBody: (_c = options.captureRequestBody) !== null && _c !== void 0 ? _c : true,
        ignoreUrls: (_d = options.ignoreUrls) !== null && _d !== void 0 ? _d : [],
    };
};
class XhrIntegration extends BaseIntegration {
    /**
     * @param options XMLHttpRequest 请求采集配置。
     */
    constructor(options = {}) {
        super();
        this.name = "XhrIntegration";
        this.options = resolveXhrIntegrationOptions(options);
    }
    setupCore(tracker) {
        if (!this.options.enabled) {
            return;
        }
        if (typeof XMLHttpRequest === "undefined") {
            return;
        }
        this.instrumentXhr(tracker);
    }
    instrumentXhr(tracker) {
        const integration = this;
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
        const dsn = tracker.getDsn();
        XMLHttpRequest.prototype.open = function (method, url, ...args) {
            const xhr = this;
            xhr._monitorMetadata = {
                method: method.toUpperCase(),
                url: url.toString(),
                start: performance.now(),
                headers: {},
            };
            return originalOpen.apply(this, [method, url, ...args]);
        };
        XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
            const xhr = this;
            if (xhr._monitorMetadata) {
                xhr._monitorMetadata.headers[name] = value;
            }
            return originalSetRequestHeader.apply(this, [name, value]);
        };
        XMLHttpRequest.prototype.send = function (body) {
            const xhr = this;
            const metadata = xhr._monitorMetadata;
            if (metadata) {
                metadata.requestData = integration.options.captureRequestBody
                    ? (body !== null && body !== void 0 ? body : null)
                    : undefined;
            }
            if (metadata &&
                integration.shouldSkipRequest(metadata.url, dsn, metadata.headers)) {
                return originalSend.apply(this, [body]);
            }
            this.addEventListener("loadend", () => {
                if (!metadata) {
                    return;
                }
                const duration = performance.now() - metadata.start;
                const status = this.status;
                if (status === 0 ||
                    status >= integration.options.statusErrorThreshold) {
                    tracker.captureEvent({
                        kind: EVENT_KIND.HTTP,
                        type: EVENT_TYPE.HTTP_ERROR,
                        level: "error",
                        message: `XHR ${metadata.method} ${status || "Failed"}`,
                        extra: {
                            url: metadata.url,
                            method: metadata.method,
                            status,
                            durationMs: Number(duration.toFixed(2)),
                            requestData: metadata.requestData,
                        },
                    });
                }
            });
            return originalSend.apply(this, [body]);
        };
    }
    shouldSkipRequest(url, dsn, headers) {
        return shouldSkipMonitoringRequest({
            url,
            dsn,
            headers,
            ignoreUrls: this.options.ignoreUrls,
        });
    }
}

;// ./src/intergrations/vue.ts



class VueIntegration extends BaseIntegration {
    constructor(options) {
        super();
        this.name = "VueIntegration";
        this.app = options.app;
    }
    setupCore(tracker) {
        if (!this.app.config) {
            return;
        }
        this.originalErrorHandler = this.app.config.errorHandler;
        const integration = this;
        const nextErrorHandler = (err, instance, info) => {
            var _a;
            try {
                const normalizedError = normalizeVueError(err);
                tracker.captureEvent({
                    kind: EVENT_KIND.ERROR,
                    type: EVENT_TYPE.VUE_ERROR,
                    level: "error",
                    message: normalizedError.message,
                    stack: normalizedError.stack,
                    extra: {
                        source: "vue_error_handler",
                        lifecycle: info,
                        componentName: integration.resolveComponentName(instance),
                    },
                });
            }
            catch (captureError) {
                sdkError("VueIntegration failed to capture error.", captureError);
            }
            finally {
                (_a = integration.originalErrorHandler) === null || _a === void 0 ? void 0 : _a.call(integration, err, instance, info);
            }
        };
        this.installedErrorHandler = nextErrorHandler;
        this.app.config.errorHandler = nextErrorHandler;
    }
    teardownCore() {
        if (!this.app.config) {
            return;
        }
        if (this.app.config.errorHandler === this.installedErrorHandler) {
            this.app.config.errorHandler = this.originalErrorHandler;
        }
        this.installedErrorHandler = undefined;
        this.originalErrorHandler = undefined;
    }
    resolveComponentName(instance) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        if (!instance || typeof instance !== "object") {
            return undefined;
        }
        const component = instance;
        return ((_h = (_f = (_d = (_b = (_a = component.type) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : (_c = component.type) === null || _c === void 0 ? void 0 : _c.__name) !== null && _d !== void 0 ? _d : (_e = component.$options) === null || _e === void 0 ? void 0 : _e.name) !== null && _f !== void 0 ? _f : (_g = component.$options) === null || _g === void 0 ? void 0 : _g.__name) !== null && _h !== void 0 ? _h : (_j = component.$options) === null || _j === void 0 ? void 0 : _j._componentTag);
    }
}
const normalizeVueError = (error) => {
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
    }
    catch (_a) {
        return {
            message: "Unknown Vue error",
            stack: null,
        };
    }
};

;// ./src/intergrations/miniprogram/index.ts




const DEFAULT_MINI_PROGRAM_REQUEST_OPTIONS = {
    enabled: true,
    statusErrorThreshold: 400,
    captureRequestData: true,
    ignoreUrls: [],
};
const DEFAULT_MINI_PROGRAM_OPTIONS = {
    enabled: true,
    jsError: true,
    unhandledRejection: true,
    request: DEFAULT_MINI_PROGRAM_REQUEST_OPTIONS,
};
const resolveRequestOptions = (options = {}) => {
    var _a;
    return Object.assign(Object.assign(Object.assign({}, DEFAULT_MINI_PROGRAM_REQUEST_OPTIONS), options), { ignoreUrls: (_a = options.ignoreUrls) !== null && _a !== void 0 ? _a : DEFAULT_MINI_PROGRAM_REQUEST_OPTIONS.ignoreUrls });
};
const resolveMiniProgramIntegrationOptions = (options = {}) => {
    var _a, _b, _c;
    return {
        enabled: (_a = options.enabled) !== null && _a !== void 0 ? _a : DEFAULT_MINI_PROGRAM_OPTIONS.enabled,
        jsError: (_b = options.jsError) !== null && _b !== void 0 ? _b : DEFAULT_MINI_PROGRAM_OPTIONS.jsError,
        unhandledRejection: (_c = options.unhandledRejection) !== null && _c !== void 0 ? _c : DEFAULT_MINI_PROGRAM_OPTIONS.unhandledRejection,
        request: resolveRequestOptions(options.request),
    };
};
class MiniProgramIntegration extends BaseIntegration {
    constructor(options = {}) {
        super();
        this.name = "MiniProgramIntegration";
        this.api = null;
        this.options = resolveMiniProgramIntegrationOptions(options);
    }
    setupCore(tracker) {
        if (!this.options.enabled) {
            return;
        }
        this.api = getMiniProgramGlobal();
        if (!this.api) {
            return;
        }
        if (this.options.jsError && typeof this.api.onError === "function") {
            this.errorHandler = (error) => {
                tracker.captureEvent({
                    kind: EVENT_KIND.ERROR,
                    type: EVENT_TYPE.JS_ERROR,
                    level: "error",
                    message: error || "Mini program runtime error",
                });
            };
            this.api.onError(this.errorHandler);
        }
        if (this.options.unhandledRejection &&
            typeof this.api.onUnhandledRejection === "function") {
            this.rejectionHandler = (result) => {
                var _a;
                const reason = result.reason;
                tracker.captureEvent({
                    kind: EVENT_KIND.ERROR,
                    type: EVENT_TYPE.UNHANDLED_REJECTION,
                    level: "error",
                    message: miniprogram_extractPromiseMessage(reason),
                    stack: reason instanceof Error ? (_a = reason.stack) !== null && _a !== void 0 ? _a : null : null,
                });
            };
            this.api.onUnhandledRejection(this.rejectionHandler);
        }
        if (this.options.request.enabled) {
            this.instrumentRequest(tracker);
        }
    }
    teardownCore() {
        if (!this.api) {
            return;
        }
        if (this.errorHandler && typeof this.api.offError === "function") {
            this.api.offError(this.errorHandler);
        }
        if (this.rejectionHandler &&
            typeof this.api.offUnhandledRejection === "function") {
            this.api.offUnhandledRejection(this.rejectionHandler);
        }
        if (this.originalRequest && typeof this.api.request === "function") {
            this.api.request = this.originalRequest;
        }
        this.api = null;
        this.errorHandler = undefined;
        this.rejectionHandler = undefined;
        this.originalRequest = undefined;
    }
    instrumentRequest(tracker) {
        const api = this.api;
        if (!(api === null || api === void 0 ? void 0 : api.request)) {
            return;
        }
        const integration = this;
        const dsn = tracker.getDsn();
        const originalRequest = api.request;
        this.originalRequest = originalRequest;
        api.request = function (options) {
            if (!options || typeof options.url !== "string") {
                return originalRequest.call(this, options);
            }
            const url = options.url;
            const method = integration.resolveRequestMethod(options.method);
            const requestData = integration.resolveRequestData(options.data, method);
            if (shouldSkipMonitoringRequest({
                url,
                dsn,
                headers: options.header,
                ignoreUrls: integration.options.request.ignoreUrls,
            })) {
                return originalRequest.call(this, options);
            }
            const startedAt = getNow();
            let settled = false;
            const originalSuccess = options.success;
            const originalFail = options.fail;
            const finalize = (handler) => {
                if (settled) {
                    return;
                }
                settled = true;
                handler();
            };
            const wrappedOptions = Object.assign(Object.assign({}, options), { success(result) {
                    finalize(() => {
                        integration.reportRequestSuccess(tracker, {
                            url,
                            method,
                            startedAt,
                            requestData,
                        }, result);
                    });
                    originalSuccess === null || originalSuccess === void 0 ? void 0 : originalSuccess(result);
                },
                fail(error) {
                    finalize(() => {
                        integration.reportRequestFailure(tracker, {
                            url,
                            method,
                            startedAt,
                            requestData,
                        }, error);
                    });
                    originalFail === null || originalFail === void 0 ? void 0 : originalFail(error);
                } });
            const requestResult = originalRequest.call(this, wrappedOptions);
            if (isPromiseLike(requestResult)) {
                return requestResult
                    .then((result) => {
                    finalize(() => {
                        integration.reportPromiseRequestResult(tracker, {
                            url,
                            method,
                            startedAt,
                            requestData,
                        }, result);
                    });
                    return result;
                })
                    .catch((error) => {
                    finalize(() => {
                        integration.reportRequestFailure(tracker, {
                            url,
                            method,
                            startedAt,
                            requestData,
                        }, error);
                    });
                    throw error;
                });
            }
            return requestResult;
        };
    }
    reportPromiseRequestResult(tracker, context, result) {
        if (Array.isArray(result) && result.length >= 2) {
            const [error, response] = result;
            if (error) {
                this.reportRequestFailure(tracker, context, error);
                return;
            }
            this.reportRequestSuccess(tracker, context, response);
            return;
        }
        this.reportRequestSuccess(tracker, context, result);
    }
    reportRequestSuccess(tracker, context, result) {
        const statusCode = typeof (result === null || result === void 0 ? void 0 : result.statusCode) === "number" ? result.statusCode : 0;
        if (statusCode < this.options.request.statusErrorThreshold) {
            return;
        }
        tracker.captureEvent({
            kind: EVENT_KIND.HTTP,
            type: EVENT_TYPE.HTTP_ERROR,
            level: "error",
            message: buildStatusMessage(context.method, statusCode, result === null || result === void 0 ? void 0 : result.errMsg),
            extra: {
                url: context.url,
                method: context.method,
                status: statusCode,
                durationMs: getDurationMs(context.startedAt),
                requestData: context.requestData,
            },
        });
    }
    reportRequestFailure(tracker, context, error) {
        tracker.captureEvent({
            kind: EVENT_KIND.HTTP,
            type: EVENT_TYPE.HTTP_ERROR,
            level: "error",
            message: extractMiniProgramRequestErrorMessage(error),
            extra: {
                url: context.url,
                method: context.method,
                durationMs: getDurationMs(context.startedAt),
                requestData: context.requestData,
            },
        });
    }
    resolveRequestMethod(method) {
        return (method !== null && method !== void 0 ? method : "GET").toUpperCase();
    }
    resolveRequestData(data, method) {
        if (!this.options.request.captureRequestData) {
            return undefined;
        }
        if (method === "GET" || method === "HEAD") {
            return null;
        }
        return data !== null && data !== void 0 ? data : null;
    }
}
const miniprogram_extractPromiseMessage = (reason) => {
    if (typeof reason === "string") {
        return reason;
    }
    if (reason instanceof Error) {
        return reason.message;
    }
    try {
        return JSON.stringify(reason);
    }
    catch (_a) {
        return "Promise rejected with non-serializable value";
    }
};
const extractMiniProgramRequestErrorMessage = (error) => {
    if (typeof error === "string") {
        return error;
    }
    if (error instanceof Error) {
        return error.message;
    }
    if (error && typeof error === "object" && "errMsg" in error) {
        return String(error.errMsg || "Network Error");
    }
    try {
        return JSON.stringify(error);
    }
    catch (_a) {
        return "Network Error";
    }
};
const buildStatusMessage = (method, statusCode, errMsg) => {
    const suffix = errMsg ? ` ${errMsg}` : "";
    return `Request ${method} ${statusCode}${suffix}`;
};
const isPromiseLike = (value) => {
    return !!value && typeof value.then === "function";
};
const getNow = () => {
    if (typeof performance !== "undefined" && typeof performance.now === "function") {
        return performance.now();
    }
    return Date.now();
};
const getDurationMs = (startedAt) => {
    return Number((getNow() - startedAt).toFixed(2));
};

;// ./src/index.ts














module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=index.cjs.map