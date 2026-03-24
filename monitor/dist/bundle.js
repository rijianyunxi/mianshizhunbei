/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/core/BaseIntegration.ts"
/*!*************************************!*\
  !*** ./src/core/BaseIntegration.ts ***!
  \*************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BaseIntegration: () => (/* binding */ BaseIntegration)
/* harmony export */ });
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
            console.error(`[MonitorSDK] integration "${this.name}" setup failed.`, error);
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
            console.error(`[MonitorSDK] integration "${this.name}" dispose failed.`, error);
        }
        finally {
            this.trackerInstance = null;
            this.isSetup = false;
        }
    }
    teardownCore(_tracker) { }
}


/***/ },

/***/ "./src/core/core.ts"
/*!**************************!*\
  !*** ./src/core/core.ts ***!
  \**************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MonitorSDK: () => (/* binding */ MonitorSDK)
/* harmony export */ });
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./types */ "./src/core/types.ts");
/* harmony import */ var _utils_context__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/context */ "./src/utils/context.ts");


class MonitorSDK {
    constructor(options) {
        this.userContext = {};
        this.tagsContext = {};
        this.activeIntegrations = [];
        if (!options.dsn) {
            throw new Error("MonitorSDK: dsn is required!");
        }
        this.options = options;
        this.setupIntegrations();
    }
    getDsn() {
        return this.options.dsn;
    }
    setupIntegrations() {
        this.activeIntegrations = [];
        const rawIntegrations = this.options.integrations;
        if (rawIntegrations == null) {
            return;
        }
        if (!Array.isArray(rawIntegrations)) {
            console.warn("[MonitorSDK] options.integrations must be an array.");
            return;
        }
        const mountedNames = new Set();
        rawIntegrations.forEach((candidate, index) => {
            if (!this.isValidIntegration(candidate)) {
                console.warn(`[MonitorSDK] invalid integration at index ${index}, expected { name: string, setup: Function }.`);
                return;
            }
            const integrationName = candidate.name.trim();
            if (mountedNames.has(integrationName)) {
                console.warn(`[MonitorSDK] integration "${integrationName}" is duplicated and will be ignored.`);
                return;
            }
            mountedNames.add(integrationName);
            try {
                candidate.setup(this);
                this.activeIntegrations.push(candidate);
            }
            catch (error) {
                console.error(`[MonitorSDK] integration "${integrationName}" setup failed.`, error);
            }
        });
    }
    dispose() {
        const integrations = [...this.activeIntegrations].reverse();
        integrations.forEach((integration) => {
            if (typeof integration.dispose !== "function") {
                return;
            }
            try {
                integration.dispose();
            }
            catch (error) {
                console.error(`[MonitorSDK] integration "${integration.name}" dispose failed.`, error);
            }
        });
        this.activeIntegrations = [];
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
        this.captureEvent({
            kind: _types__WEBPACK_IMPORTED_MODULE_0__.EVENT_KIND.ERROR,
            type: _types__WEBPACK_IMPORTED_MODULE_0__.EVENT_TYPE.MANUAL_ERROR,
            level: "error",
            message: normalized.message,
            stack: normalized.stack,
            extra: extraInfo || {},
        });
    }
    captureMessage(message, extraInfo, level = "info") {
        this.captureEvent({
            kind: _types__WEBPACK_IMPORTED_MODULE_0__.EVENT_KIND.MESSAGE,
            type: _types__WEBPACK_IMPORTED_MODULE_0__.EVENT_TYPE.MANUAL_MESSAGE,
            level,
            message,
            extra: extraInfo || {},
        });
    }
    track(eventName, properties = {}, eventType = _types__WEBPACK_IMPORTED_MODULE_0__.EVENT_TYPE.TRACK_CUSTOM) {
        this.captureEvent({
            kind: _types__WEBPACK_IMPORTED_MODULE_0__.EVENT_KIND.ACTION,
            type: eventType,
            level: "info",
            message: eventName,
            extra: {
                eventName,
                properties,
            },
        });
    }
    captureEvent(event) {
        this.dispatchEvent(event);
    }
    dispatchEvent(partialEvent) {
        var _a, _b;
        const eventTimestamp = (_a = partialEvent.timestamp) !== null && _a !== void 0 ? _a : Date.now();
        let finalEvent = {
            kind: partialEvent.kind || this.inferKind(partialEvent),
            type: partialEvent.type || _types__WEBPACK_IMPORTED_MODULE_0__.EVENT_TYPE.CUSTOM_EVENT,
            level: partialEvent.level || this.inferLevel(partialEvent),
            message: partialEvent.message || "",
            stack: (_b = partialEvent.stack) !== null && _b !== void 0 ? _b : null,
            filename: partialEvent.filename,
            lineno: partialEvent.lineno,
            colno: partialEvent.colno,
            timestamp: eventTimestamp,
            url: partialEvent.url || (0,_utils_context__WEBPACK_IMPORTED_MODULE_1__.getPageUrl)(),
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
    inferKind(partialEvent) {
        var _a, _b;
        if (partialEvent.stack || partialEvent.filename) {
            return _types__WEBPACK_IMPORTED_MODULE_0__.EVENT_KIND.ERROR;
        }
        if ((_a = partialEvent.type) === null || _a === void 0 ? void 0 : _a.includes("http")) {
            return _types__WEBPACK_IMPORTED_MODULE_0__.EVENT_KIND.HTTP;
        }
        if ((_b = partialEvent.type) === null || _b === void 0 ? void 0 : _b.includes("resource")) {
            return _types__WEBPACK_IMPORTED_MODULE_0__.EVENT_KIND.RESOURCE;
        }
        return _types__WEBPACK_IMPORTED_MODULE_0__.EVENT_KIND.CUSTOM;
    }
    inferLevel(partialEvent) {
        var _a;
        if (partialEvent.kind === _types__WEBPACK_IMPORTED_MODULE_0__.EVENT_KIND.ERROR) {
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
        const data = JSON.stringify(payload);
        if (typeof navigator !== "undefined" &&
            typeof navigator.sendBeacon === "function") {
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


/***/ },

/***/ "./src/core/types.ts"
/*!***************************!*\
  !*** ./src/core/types.ts ***!
  \***************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   EVENT_KIND: () => (/* binding */ EVENT_KIND),
/* harmony export */   EVENT_TYPE: () => (/* binding */ EVENT_TYPE)
/* harmony export */ });
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


/***/ },

/***/ "./src/intergrations/browser/errors.ts"
/*!*********************************************!*\
  !*** ./src/intergrations/browser/errors.ts ***!
  \*********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setupBrowserErrorCollection: () => (/* binding */ setupBrowserErrorCollection)
/* harmony export */ });
/* harmony import */ var _core_types__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../core/types */ "./src/core/types.ts");

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
                    kind: _core_types__WEBPACK_IMPORTED_MODULE_0__.EVENT_KIND.RESOURCE,
                    type: _core_types__WEBPACK_IMPORTED_MODULE_0__.EVENT_TYPE.RESOURCE_ERROR,
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
                kind: _core_types__WEBPACK_IMPORTED_MODULE_0__.EVENT_KIND.ERROR,
                type: _core_types__WEBPACK_IMPORTED_MODULE_0__.EVENT_TYPE.JS_ERROR,
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
                kind: _core_types__WEBPACK_IMPORTED_MODULE_0__.EVENT_KIND.ERROR,
                type: _core_types__WEBPACK_IMPORTED_MODULE_0__.EVENT_TYPE.UNHANDLED_REJECTION,
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


/***/ },

/***/ "./src/intergrations/browser/index.ts"
/*!********************************************!*\
  !*** ./src/intergrations/browser/index.ts ***!
  \********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BrowserIntegration: () => (/* binding */ BrowserIntegration),
/* harmony export */   defineBrowserIntegrationOptions: () => (/* reexport safe */ _options__WEBPACK_IMPORTED_MODULE_2__.defineBrowserIntegrationOptions)
/* harmony export */ });
/* harmony import */ var _core_BaseIntegration__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../core/BaseIntegration */ "./src/core/BaseIntegration.ts");
/* harmony import */ var _errors__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./errors */ "./src/intergrations/browser/errors.ts");
/* harmony import */ var _options__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./options */ "./src/intergrations/browser/options.ts");
/* harmony import */ var _vitals__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./vitals */ "./src/intergrations/browser/vitals.ts");





class BrowserIntegration extends _core_BaseIntegration__WEBPACK_IMPORTED_MODULE_0__.BaseIntegration {
    /**
     * @param options 浏览器端采集配置。
     */
    constructor(options) {
        super();
        this.name = "BrowserIntegration";
        options = options !== null && options !== void 0 ? options : {};
        this.options = (0,_options__WEBPACK_IMPORTED_MODULE_2__.resolveBrowserIntegrationOptions)(options);
    }
    setupCore(tracker) {
        if (!this.options.enabled) {
            return;
        }
        if (typeof window === "undefined") {
            return;
        }
        (0,_errors__WEBPACK_IMPORTED_MODULE_1__.setupBrowserErrorCollection)(tracker, this.options.errors);
        (0,_vitals__WEBPACK_IMPORTED_MODULE_3__.setupWebVitalsCollection)(tracker, this.options.vitals);
    }
}


/***/ },

/***/ "./src/intergrations/browser/options.ts"
/*!**********************************************!*\
  !*** ./src/intergrations/browser/options.ts ***!
  \**********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   defineBrowserIntegrationOptions: () => (/* binding */ defineBrowserIntegrationOptions),
/* harmony export */   resolveBrowserIntegrationOptions: () => (/* binding */ resolveBrowserIntegrationOptions)
/* harmony export */ });
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
/**
 * 在调用处提供更稳定的类型提示与校验。
 *
 * @example
 * const options = defineBrowserIntegrationOptions({
 *   errors: { jsError: true },
 *   vitals: { fcp: true, lcp: true },
 * });
 */
const defineBrowserIntegrationOptions = (options) => options;


/***/ },

/***/ "./src/intergrations/browser/vitals.ts"
/*!*********************************************!*\
  !*** ./src/intergrations/browser/vitals.ts ***!
  \*********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   setupWebVitalsCollection: () => (/* binding */ setupWebVitalsCollection)
/* harmony export */ });
/* harmony import */ var web_vitals__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! web-vitals */ "./node_modules/.pnpm/web-vitals@5.1.0/node_modules/web-vitals/dist/web-vitals.js");
/* harmony import */ var _core_types__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../core/types */ "./src/core/types.ts");


const METRIC_EVENT_TYPE_MAP = {
    FCP: _core_types__WEBPACK_IMPORTED_MODULE_1__.EVENT_TYPE.PERF_FCP,
    LCP: _core_types__WEBPACK_IMPORTED_MODULE_1__.EVENT_TYPE.PERF_LCP,
    CLS: _core_types__WEBPACK_IMPORTED_MODULE_1__.EVENT_TYPE.PERF_CLS,
    INP: _core_types__WEBPACK_IMPORTED_MODULE_1__.EVENT_TYPE.PERF_INP,
    TTFB: _core_types__WEBPACK_IMPORTED_MODULE_1__.EVENT_TYPE.PERF_TTFB,
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
            kind: _core_types__WEBPACK_IMPORTED_MODULE_1__.EVENT_KIND.PERFORMANCE,
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
        (0,web_vitals__WEBPACK_IMPORTED_MODULE_0__.onFCP)(reportMetric, createReportOptions());
    }
    if (options.lcp) {
        (0,web_vitals__WEBPACK_IMPORTED_MODULE_0__.onLCP)(reportMetric, createReportOptions());
    }
    if (options.cls) {
        (0,web_vitals__WEBPACK_IMPORTED_MODULE_0__.onCLS)(reportMetric, createReportOptions());
    }
    if (options.inp) {
        (0,web_vitals__WEBPACK_IMPORTED_MODULE_0__.onINP)(reportMetric, createReportOptions());
    }
    if (options.ttfb) {
        (0,web_vitals__WEBPACK_IMPORTED_MODULE_0__.onTTFB)(reportMetric, createReportOptions());
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


/***/ },

/***/ "./src/intergrations/fetch.ts"
/*!************************************!*\
  !*** ./src/intergrations/fetch.ts ***!
  \************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   FetchIntegration: () => (/* binding */ FetchIntegration)
/* harmony export */ });
/* harmony import */ var _core_BaseIntegration__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../core/BaseIntegration */ "./src/core/BaseIntegration.ts");
/* harmony import */ var _core_types__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../core/types */ "./src/core/types.ts");
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
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
class FetchIntegration extends _core_BaseIntegration__WEBPACK_IMPORTED_MODULE_0__.BaseIntegration {
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
        window.fetch = (...args) => __awaiter(this, void 0, void 0, function* () {
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
                        kind: _core_types__WEBPACK_IMPORTED_MODULE_1__.EVENT_KIND.HTTP,
                        type: _core_types__WEBPACK_IMPORTED_MODULE_1__.EVENT_TYPE.HTTP_ERROR,
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
                    kind: _core_types__WEBPACK_IMPORTED_MODULE_1__.EVENT_KIND.HTTP,
                    type: _core_types__WEBPACK_IMPORTED_MODULE_1__.EVENT_TYPE.HTTP_ERROR,
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
        if (url.includes(dsn)) {
            return true;
        }
        if (this.options.ignoreUrls.some((rule) => this.matchesUrlRule(url, rule))) {
            return true;
        }
        const injectedHeader = this.extractHeader("X-SDK-Injected", init === null || init === void 0 ? void 0 : init.headers);
        if (injectedHeader) {
            return true;
        }
        if (typeof Request !== "undefined" && input instanceof Request) {
            const requestInjectedHeader = input.headers.get("X-SDK-Injected");
            if (requestInjectedHeader) {
                return true;
            }
        }
        return false;
    }
    extractHeader(key, headers) {
        if (!headers) {
            return null;
        }
        if (headers instanceof Headers) {
            return headers.get(key);
        }
        if (Array.isArray(headers)) {
            const match = headers.find(([headerKey]) => headerKey.toLowerCase() === key.toLowerCase());
            return match ? match[1] : null;
        }
        const headerRecord = headers;
        const matchedKey = Object.keys(headerRecord).find((headerKey) => headerKey.toLowerCase() === key.toLowerCase());
        return matchedKey ? headerRecord[matchedKey] : null;
    }
    matchesUrlRule(url, rule) {
        if (typeof rule === "string") {
            return url.includes(rule);
        }
        return rule.test(url);
    }
}


/***/ },

/***/ "./src/intergrations/xhr.ts"
/*!**********************************!*\
  !*** ./src/intergrations/xhr.ts ***!
  \**********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   XhrIntegration: () => (/* binding */ XhrIntegration)
/* harmony export */ });
/* harmony import */ var _core_BaseIntegration__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../core/BaseIntegration */ "./src/core/BaseIntegration.ts");
/* harmony import */ var _core_types__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../core/types */ "./src/core/types.ts");


const resolveXhrIntegrationOptions = (options = {}) => {
    var _a, _b, _c, _d;
    return {
        enabled: (_a = options.enabled) !== null && _a !== void 0 ? _a : true,
        statusErrorThreshold: (_b = options.statusErrorThreshold) !== null && _b !== void 0 ? _b : 400,
        captureRequestBody: (_c = options.captureRequestBody) !== null && _c !== void 0 ? _c : true,
        ignoreUrls: (_d = options.ignoreUrls) !== null && _d !== void 0 ? _d : [],
    };
};
class XhrIntegration extends _core_BaseIntegration__WEBPACK_IMPORTED_MODULE_0__.BaseIntegration {
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
        const dsn = tracker.getDsn();
        XMLHttpRequest.prototype.open = function (method, url, ...args) {
            const xhr = this;
            xhr._monitorMetadata = {
                method: method.toUpperCase(),
                url: url.toString(),
                start: performance.now(),
            };
            return originalOpen.apply(this, [method, url, ...args]);
        };
        XMLHttpRequest.prototype.send = function (body) {
            const xhr = this;
            const metadata = xhr._monitorMetadata;
            if (metadata) {
                metadata.requestData = integration.options.captureRequestBody
                    ? (body !== null && body !== void 0 ? body : null)
                    : undefined;
            }
            if (metadata && integration.shouldSkipUrl(metadata.url, dsn)) {
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
                        kind: _core_types__WEBPACK_IMPORTED_MODULE_1__.EVENT_KIND.HTTP,
                        type: _core_types__WEBPACK_IMPORTED_MODULE_1__.EVENT_TYPE.HTTP_ERROR,
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
    shouldSkipUrl(url, dsn) {
        if (url.includes(dsn)) {
            return true;
        }
        return this.options.ignoreUrls.some((rule) => this.matchesUrlRule(url, rule));
    }
    matchesUrlRule(url, rule) {
        if (typeof rule === "string") {
            return url.includes(rule);
        }
        return rule.test(url);
    }
}


/***/ },

/***/ "./src/utils/context.ts"
/*!******************************!*\
  !*** ./src/utils/context.ts ***!
  \******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getPageUrl: () => (/* binding */ getPageUrl)
/* harmony export */ });
function getPageUrl() {
    // 获取跨环境的顶级全局对象
    const globalObj = typeof globalThis !== 'undefined' ? globalThis : self;
    // 使用 (globalObj as any) 绕过 TS 的严格检查
    if (typeof globalObj.wx !== 'undefined' && typeof globalObj.getCurrentPages === 'function') {
        try {
            const pages = globalObj.getCurrentPages();
            return pages.length ? pages[pages.length - 1].route : 'app_launch';
        }
        catch (e) {
            return 'unknown_wx_route';
        }
    }
    // 浏览器兜底
    if (typeof window !== 'undefined' && window.location) {
        return window.location.href;
    }
    return 'unknown_environment';
}


/***/ },

/***/ "./node_modules/.pnpm/web-vitals@5.1.0/node_modules/web-vitals/dist/web-vitals.js"
/*!****************************************************************************************!*\
  !*** ./node_modules/.pnpm/web-vitals@5.1.0/node_modules/web-vitals/dist/web-vitals.js ***!
  \****************************************************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CLSThresholds: () => (/* binding */ b),
/* harmony export */   FCPThresholds: () => (/* binding */ y),
/* harmony export */   INPThresholds: () => (/* binding */ B),
/* harmony export */   LCPThresholds: () => (/* binding */ q),
/* harmony export */   TTFBThresholds: () => (/* binding */ H),
/* harmony export */   onCLS: () => (/* binding */ L),
/* harmony export */   onFCP: () => (/* binding */ E),
/* harmony export */   onINP: () => (/* binding */ S),
/* harmony export */   onLCP: () => (/* binding */ x),
/* harmony export */   onTTFB: () => (/* binding */ $)
/* harmony export */ });
let e=-1;const t=t=>{addEventListener("pageshow",(n=>{n.persisted&&(e=n.timeStamp,t(n))}),!0)},n=(e,t,n,i)=>{let s,o;return r=>{t.value>=0&&(r||i)&&(o=t.value-(s??0),(o||void 0===s)&&(s=t.value,t.delta=o,t.rating=((e,t)=>e>t[1]?"poor":e>t[0]?"needs-improvement":"good")(t.value,n),e(t)))}},i=e=>{requestAnimationFrame((()=>requestAnimationFrame((()=>e()))))},s=()=>{const e=performance.getEntriesByType("navigation")[0];if(e&&e.responseStart>0&&e.responseStart<performance.now())return e},o=()=>{const e=s();return e?.activationStart??0},r=(t,n=-1)=>{const i=s();let r="navigate";e>=0?r="back-forward-cache":i&&(document.prerendering||o()>0?r="prerender":document.wasDiscarded?r="restore":i.type&&(r=i.type.replace(/_/g,"-")));return{name:t,value:n,rating:"good",delta:0,entries:[],id:`v5-${Date.now()}-${Math.floor(8999999999999*Math.random())+1e12}`,navigationType:r}},c=new WeakMap;function a(e,t){return c.get(e)||c.set(e,new t),c.get(e)}class d{t;i=0;o=[];h(e){if(e.hadRecentInput)return;const t=this.o[0],n=this.o.at(-1);this.i&&t&&n&&e.startTime-n.startTime<1e3&&e.startTime-t.startTime<5e3?(this.i+=e.value,this.o.push(e)):(this.i=e.value,this.o=[e]),this.t?.(e)}}const h=(e,t,n={})=>{try{if(PerformanceObserver.supportedEntryTypes.includes(e)){const i=new PerformanceObserver((e=>{Promise.resolve().then((()=>{t(e.getEntries())}))}));return i.observe({type:e,buffered:!0,...n}),i}}catch{}},f=e=>{let t=!1;return()=>{t||(e(),t=!0)}};let u=-1;const l=new Set,m=()=>"hidden"!==document.visibilityState||document.prerendering?1/0:0,p=e=>{if("hidden"===document.visibilityState){if("visibilitychange"===e.type)for(const e of l)e();isFinite(u)||(u="visibilitychange"===e.type?e.timeStamp:0,removeEventListener("prerenderingchange",p,!0))}},v=()=>{if(u<0){const e=o(),n=document.prerendering?void 0:globalThis.performance.getEntriesByType("visibility-state").filter((t=>"hidden"===t.name&&t.startTime>e))[0]?.startTime;u=n??m(),addEventListener("visibilitychange",p,!0),addEventListener("prerenderingchange",p,!0),t((()=>{setTimeout((()=>{u=m()}))}))}return{get firstHiddenTime(){return u},onHidden(e){l.add(e)}}},g=e=>{document.prerendering?addEventListener("prerenderingchange",(()=>e()),!0):e()},y=[1800,3e3],E=(e,s={})=>{g((()=>{const c=v();let a,d=r("FCP");const f=h("paint",(e=>{for(const t of e)"first-contentful-paint"===t.name&&(f.disconnect(),t.startTime<c.firstHiddenTime&&(d.value=Math.max(t.startTime-o(),0),d.entries.push(t),a(!0)))}));f&&(a=n(e,d,y,s.reportAllChanges),t((t=>{d=r("FCP"),a=n(e,d,y,s.reportAllChanges),i((()=>{d.value=performance.now()-t.timeStamp,a(!0)}))})))}))},b=[.1,.25],L=(e,s={})=>{const o=v();E(f((()=>{let c,f=r("CLS",0);const u=a(s,d),l=e=>{for(const t of e)u.h(t);u.i>f.value&&(f.value=u.i,f.entries=u.o,c())},m=h("layout-shift",l);m&&(c=n(e,f,b,s.reportAllChanges),o.onHidden((()=>{l(m.takeRecords()),c(!0)})),t((()=>{u.i=0,f=r("CLS",0),c=n(e,f,b,s.reportAllChanges),i((()=>c()))})),setTimeout(c))})))};let P=0,T=1/0,_=0;const M=e=>{for(const t of e)t.interactionId&&(T=Math.min(T,t.interactionId),_=Math.max(_,t.interactionId),P=_?(_-T)/7+1:0)};let w;const C=()=>w?P:performance.interactionCount??0,I=()=>{"interactionCount"in performance||w||(w=h("event",M,{type:"event",buffered:!0,durationThreshold:0}))};let F=0;class k{u=[];l=new Map;m;p;v(){F=C(),this.u.length=0,this.l.clear()}L(){const e=Math.min(this.u.length-1,Math.floor((C()-F)/50));return this.u[e]}h(e){if(this.m?.(e),!e.interactionId&&"first-input"!==e.entryType)return;const t=this.u.at(-1);let n=this.l.get(e.interactionId);if(n||this.u.length<10||e.duration>t.P){if(n?e.duration>n.P?(n.entries=[e],n.P=e.duration):e.duration===n.P&&e.startTime===n.entries[0].startTime&&n.entries.push(e):(n={id:e.interactionId,entries:[e],P:e.duration},this.l.set(n.id,n),this.u.push(n)),this.u.sort(((e,t)=>t.P-e.P)),this.u.length>10){const e=this.u.splice(10);for(const t of e)this.l.delete(t.id)}this.p?.(n)}}}const A=e=>{const t=globalThis.requestIdleCallback||setTimeout;"hidden"===document.visibilityState?e():(e=f(e),addEventListener("visibilitychange",e,{once:!0,capture:!0}),t((()=>{e(),removeEventListener("visibilitychange",e,{capture:!0})})))},B=[200,500],S=(e,i={})=>{if(!globalThis.PerformanceEventTiming||!("interactionId"in PerformanceEventTiming.prototype))return;const s=v();g((()=>{I();let o,c=r("INP");const d=a(i,k),f=e=>{A((()=>{for(const t of e)d.h(t);const t=d.L();t&&t.P!==c.value&&(c.value=t.P,c.entries=t.entries,o())}))},u=h("event",f,{durationThreshold:i.durationThreshold??40});o=n(e,c,B,i.reportAllChanges),u&&(u.observe({type:"first-input",buffered:!0}),s.onHidden((()=>{f(u.takeRecords()),o(!0)})),t((()=>{d.v(),c=r("INP"),o=n(e,c,B,i.reportAllChanges)})))}))};class N{m;h(e){this.m?.(e)}}const q=[2500,4e3],x=(e,s={})=>{g((()=>{const c=v();let d,u=r("LCP");const l=a(s,N),m=e=>{s.reportAllChanges||(e=e.slice(-1));for(const t of e)l.h(t),t.startTime<c.firstHiddenTime&&(u.value=Math.max(t.startTime-o(),0),u.entries=[t],d())},p=h("largest-contentful-paint",m);if(p){d=n(e,u,q,s.reportAllChanges);const o=f((()=>{m(p.takeRecords()),p.disconnect(),d(!0)})),c=e=>{e.isTrusted&&(A(o),removeEventListener(e.type,c,{capture:!0}))};for(const e of["keydown","click","visibilitychange"])addEventListener(e,c,{capture:!0});t((t=>{u=r("LCP"),d=n(e,u,q,s.reportAllChanges),i((()=>{u.value=performance.now()-t.timeStamp,d(!0)}))}))}}))},H=[800,1800],O=e=>{document.prerendering?g((()=>O(e))):"complete"!==document.readyState?addEventListener("load",(()=>O(e)),!0):setTimeout(e)},$=(e,i={})=>{let c=r("TTFB"),a=n(e,c,H,i.reportAllChanges);O((()=>{const d=s();d&&(c.value=Math.max(d.responseStart-o(),0),c.entries=[d],a(!0),t((()=>{c=r("TTFB",0),a=n(e,c,H,i.reportAllChanges),a(!0)})))}))};


/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
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
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _core_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./core/core */ "./src/core/core.ts");
/* harmony import */ var _intergrations_browser__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./intergrations/browser */ "./src/intergrations/browser/index.ts");
/* harmony import */ var _intergrations_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./intergrations/fetch */ "./src/intergrations/fetch.ts");
/* harmony import */ var _intergrations_xhr__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./intergrations/xhr */ "./src/intergrations/xhr.ts");




const monitor = new _core_core__WEBPACK_IMPORTED_MODULE_0__.MonitorSDK({
    dsn: "http://172.18.21.150/dengchuan/serve/login",
    integrations: [
        new _intergrations_browser__WEBPACK_IMPORTED_MODULE_1__.BrowserIntegration((0,_intergrations_browser__WEBPACK_IMPORTED_MODULE_1__.defineBrowserIntegrationOptions)({
            enabled: true,
            errors: {},
            vitals: {},
        })),
        new _intergrations_fetch__WEBPACK_IMPORTED_MODULE_2__.FetchIntegration(),
        new _intergrations_xhr__WEBPACK_IMPORTED_MODULE_3__.XhrIntegration(),
    ],
});
// monitor.captureMessage("Monitor SDK initialized", { module: "bootstrap" });

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7OztXQzVCQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLHlDQUF5Qyx3Q0FBd0M7V0FDakY7V0FDQTtXQUNBLEU7Ozs7O1dDUEEsd0Y7Ozs7O1dDQUE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdELEU7Ozs7Ozs7Ozs7Ozs7OztBQ055QztBQUNxRDtBQUNyQztBQUNKO0FBRXJELE1BQU0sT0FBTyxHQUFHLElBQUksa0RBQVUsQ0FBQztJQUM3QixHQUFHLEVBQUUsNENBQTRDO0lBQ2pELFlBQVksRUFBRTtRQUNaLElBQUksc0VBQWtCLENBQ3BCLHVGQUErQixDQUFDO1lBQzlCLE9BQU8sRUFBRSxJQUFJO1lBQ2IsTUFBTSxFQUFFLEVBQUU7WUFDVixNQUFNLEVBQUUsRUFBRTtTQUNYLENBQUMsQ0FDSDtRQUNELElBQUksa0VBQWdCLEVBQUU7UUFDdEIsSUFBSSw4REFBYyxFQUFFO0tBQ3JCO0NBQ0YsQ0FBQyxDQUFDO0FBRUgsOEVBQThFIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vbW9uaXRvci8uL3NyYy9jb3JlL0Jhc2VJbnRlZ3JhdGlvbi50cyIsIndlYnBhY2s6Ly9tb25pdG9yLy4vc3JjL2NvcmUvY29yZS50cyIsIndlYnBhY2s6Ly9tb25pdG9yLy4vc3JjL2NvcmUvdHlwZXMudHMiLCJ3ZWJwYWNrOi8vbW9uaXRvci8uL3NyYy9pbnRlcmdyYXRpb25zL2Jyb3dzZXIvZXJyb3JzLnRzIiwid2VicGFjazovL21vbml0b3IvLi9zcmMvaW50ZXJncmF0aW9ucy9icm93c2VyL2luZGV4LnRzIiwid2VicGFjazovL21vbml0b3IvLi9zcmMvaW50ZXJncmF0aW9ucy9icm93c2VyL29wdGlvbnMudHMiLCJ3ZWJwYWNrOi8vbW9uaXRvci8uL3NyYy9pbnRlcmdyYXRpb25zL2Jyb3dzZXIvdml0YWxzLnRzIiwid2VicGFjazovL21vbml0b3IvLi9zcmMvaW50ZXJncmF0aW9ucy9mZXRjaC50cyIsIndlYnBhY2s6Ly9tb25pdG9yLy4vc3JjL2ludGVyZ3JhdGlvbnMveGhyLnRzIiwid2VicGFjazovL21vbml0b3IvLi9zcmMvdXRpbHMvY29udGV4dC50cyIsIndlYnBhY2s6Ly9tb25pdG9yLy4vbm9kZV9tb2R1bGVzLy5wbnBtL3dlYi12aXRhbHNANS4xLjAvbm9kZV9tb2R1bGVzL3dlYi12aXRhbHMvZGlzdC93ZWItdml0YWxzLmpzIiwid2VicGFjazovL21vbml0b3Ivd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vbW9uaXRvci93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vbW9uaXRvci93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL21vbml0b3Ivd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9tb25pdG9yLy4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgVHJhY2tlckluc3RhbmNlIH0gZnJvbSBcIi4vdHlwZXNcIjtcblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEJhc2VJbnRlZ3JhdGlvbiB7XG4gIHB1YmxpYyBhYnN0cmFjdCByZWFkb25seSBuYW1lOiBzdHJpbmc7XG5cbiAgcHJpdmF0ZSBpc1NldHVwID0gZmFsc2U7XG4gIHByaXZhdGUgdHJhY2tlckluc3RhbmNlOiBUcmFja2VySW5zdGFuY2UgfCBudWxsID0gbnVsbDtcblxuICBwdWJsaWMgc2V0dXAodHJhY2tlcjogVHJhY2tlckluc3RhbmNlKSB7XG4gICAgaWYgKHRoaXMuaXNTZXR1cCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICB0aGlzLnNldHVwQ29yZSh0cmFja2VyKTtcbiAgICAgIHRoaXMudHJhY2tlckluc3RhbmNlID0gdHJhY2tlcjtcbiAgICAgIHRoaXMuaXNTZXR1cCA9IHRydWU7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHRoaXMudHJhY2tlckluc3RhbmNlID0gbnVsbDtcbiAgICAgIHRoaXMuaXNTZXR1cCA9IGZhbHNlO1xuICAgICAgY29uc29sZS5lcnJvcihgW01vbml0b3JTREtdIGludGVncmF0aW9uIFwiJHt0aGlzLm5hbWV9XCIgc2V0dXAgZmFpbGVkLmAsIGVycm9yKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgZGlzcG9zZSgpIHtcbiAgICBpZiAoIXRoaXMuaXNTZXR1cCB8fCAhdGhpcy50cmFja2VySW5zdGFuY2UpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgdGhpcy50ZWFyZG93bkNvcmUodGhpcy50cmFja2VySW5zdGFuY2UpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICBgW01vbml0b3JTREtdIGludGVncmF0aW9uIFwiJHt0aGlzLm5hbWV9XCIgZGlzcG9zZSBmYWlsZWQuYCxcbiAgICAgICAgZXJyb3IsXG4gICAgICApO1xuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLnRyYWNrZXJJbnN0YW5jZSA9IG51bGw7XG4gICAgICB0aGlzLmlzU2V0dXAgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBwcm90ZWN0ZWQgYWJzdHJhY3Qgc2V0dXBDb3JlKHRyYWNrZXI6IFRyYWNrZXJJbnN0YW5jZSk6IHZvaWQ7XG4gIHByb3RlY3RlZCB0ZWFyZG93bkNvcmUoX3RyYWNrZXI6IFRyYWNrZXJJbnN0YW5jZSk6IHZvaWQge31cbn1cbiIsImltcG9ydCB0eXBlIHtcbiAgU0RLT3B0aW9ucyxcbiAgTW9uaXRvckV2ZW50LFxuICBNb25pdG9yRXZlbnRJbnB1dCxcbiAgSW50ZWdyYXRpb24sXG4gIEV2ZW50TGV2ZWwsXG4gIEV2ZW50S2luZCxcbiAgRXZlbnRUeXBlLFxuICBUcmFja2VySW5zdGFuY2UsXG59IGZyb20gXCIuL3R5cGVzXCI7XG5pbXBvcnQgeyBFVkVOVF9LSU5ELCBFVkVOVF9UWVBFIH0gZnJvbSBcIi4vdHlwZXNcIjtcbmltcG9ydCB7IGdldFBhZ2VVcmwgfSBmcm9tIFwiLi4vdXRpbHMvY29udGV4dFwiO1xuXG5leHBvcnQgY2xhc3MgTW9uaXRvclNESyBpbXBsZW1lbnRzIFRyYWNrZXJJbnN0YW5jZSB7XG4gIHByaXZhdGUgb3B0aW9uczogU0RLT3B0aW9ucztcbiAgcHJpdmF0ZSB1c2VyQ29udGV4dDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fTtcbiAgcHJpdmF0ZSB0YWdzQ29udGV4dDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICBwcml2YXRlIGFjdGl2ZUludGVncmF0aW9uczogSW50ZWdyYXRpb25bXSA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IFNES09wdGlvbnMpIHtcbiAgICBpZiAoIW9wdGlvbnMuZHNuKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNb25pdG9yU0RLOiBkc24gaXMgcmVxdWlyZWQhXCIpO1xuICAgIH1cbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMuc2V0dXBJbnRlZ3JhdGlvbnMoKTtcbiAgfVxuXG4gIHB1YmxpYyBnZXREc24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLmRzbjtcbiAgfVxuXG4gIHByaXZhdGUgc2V0dXBJbnRlZ3JhdGlvbnMoKSB7XG4gICAgdGhpcy5hY3RpdmVJbnRlZ3JhdGlvbnMgPSBbXTtcblxuICAgIGNvbnN0IHJhd0ludGVncmF0aW9ucyA9IHRoaXMub3B0aW9ucy5pbnRlZ3JhdGlvbnMgYXMgdW5rbm93bjtcbiAgICBpZiAocmF3SW50ZWdyYXRpb25zID09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkocmF3SW50ZWdyYXRpb25zKSkge1xuICAgICAgY29uc29sZS53YXJuKFwiW01vbml0b3JTREtdIG9wdGlvbnMuaW50ZWdyYXRpb25zIG11c3QgYmUgYW4gYXJyYXkuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG1vdW50ZWROYW1lcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuXG4gICAgcmF3SW50ZWdyYXRpb25zLmZvckVhY2goKGNhbmRpZGF0ZSwgaW5kZXgpID0+IHtcbiAgICAgIGlmICghdGhpcy5pc1ZhbGlkSW50ZWdyYXRpb24oY2FuZGlkYXRlKSkge1xuICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgYFtNb25pdG9yU0RLXSBpbnZhbGlkIGludGVncmF0aW9uIGF0IGluZGV4ICR7aW5kZXh9LCBleHBlY3RlZCB7IG5hbWU6IHN0cmluZywgc2V0dXA6IEZ1bmN0aW9uIH0uYCxcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBpbnRlZ3JhdGlvbk5hbWUgPSBjYW5kaWRhdGUubmFtZS50cmltKCk7XG4gICAgICBpZiAobW91bnRlZE5hbWVzLmhhcyhpbnRlZ3JhdGlvbk5hbWUpKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICBgW01vbml0b3JTREtdIGludGVncmF0aW9uIFwiJHtpbnRlZ3JhdGlvbk5hbWV9XCIgaXMgZHVwbGljYXRlZCBhbmQgd2lsbCBiZSBpZ25vcmVkLmAsXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgbW91bnRlZE5hbWVzLmFkZChpbnRlZ3JhdGlvbk5hbWUpO1xuXG4gICAgICB0cnkge1xuICAgICAgICBjYW5kaWRhdGUuc2V0dXAodGhpcyk7XG4gICAgICAgIHRoaXMuYWN0aXZlSW50ZWdyYXRpb25zLnB1c2goY2FuZGlkYXRlKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgYFtNb25pdG9yU0RLXSBpbnRlZ3JhdGlvbiBcIiR7aW50ZWdyYXRpb25OYW1lfVwiIHNldHVwIGZhaWxlZC5gLFxuICAgICAgICAgIGVycm9yLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGRpc3Bvc2UoKSB7XG4gICAgY29uc3QgaW50ZWdyYXRpb25zID0gWy4uLnRoaXMuYWN0aXZlSW50ZWdyYXRpb25zXS5yZXZlcnNlKCk7XG4gICAgaW50ZWdyYXRpb25zLmZvckVhY2goKGludGVncmF0aW9uKSA9PiB7XG4gICAgICBpZiAodHlwZW9mIGludGVncmF0aW9uLmRpc3Bvc2UgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGludGVncmF0aW9uLmRpc3Bvc2UoKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgYFtNb25pdG9yU0RLXSBpbnRlZ3JhdGlvbiBcIiR7aW50ZWdyYXRpb24ubmFtZX1cIiBkaXNwb3NlIGZhaWxlZC5gLFxuICAgICAgICAgIGVycm9yLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5hY3RpdmVJbnRlZ3JhdGlvbnMgPSBbXTtcbiAgfVxuXG4gIHByaXZhdGUgaXNWYWxpZEludGVncmF0aW9uKGNhbmRpZGF0ZTogdW5rbm93bik6IGNhbmRpZGF0ZSBpcyBJbnRlZ3JhdGlvbiB7XG4gICAgaWYgKCFjYW5kaWRhdGUgfHwgdHlwZW9mIGNhbmRpZGF0ZSAhPT0gXCJvYmplY3RcIikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IGludGVncmF0aW9uID0gY2FuZGlkYXRlIGFzIFBhcnRpYWw8SW50ZWdyYXRpb24+O1xuICAgIHJldHVybiAoXG4gICAgICB0eXBlb2YgaW50ZWdyYXRpb24ubmFtZSA9PT0gXCJzdHJpbmdcIiAmJlxuICAgICAgaW50ZWdyYXRpb24ubmFtZS50cmltKCkubGVuZ3RoID4gMCAmJlxuICAgICAgdHlwZW9mIGludGVncmF0aW9uLnNldHVwID09PSBcImZ1bmN0aW9uXCIgJiZcbiAgICAgIChpbnRlZ3JhdGlvbi5kaXNwb3NlID09PSB1bmRlZmluZWQgfHxcbiAgICAgICAgdHlwZW9mIGludGVncmF0aW9uLmRpc3Bvc2UgPT09IFwiZnVuY3Rpb25cIilcbiAgICApO1xuICB9XG5cbiAgcHVibGljIHNldFVzZXIodXNlcjogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pIHtcbiAgICB0aGlzLnVzZXJDb250ZXh0ID0geyAuLi50aGlzLnVzZXJDb250ZXh0LCAuLi51c2VyIH07XG4gIH1cblxuICBwdWJsaWMgY2xlYXJVc2VyKCkge1xuICAgIHRoaXMudXNlckNvbnRleHQgPSB7fTtcbiAgfVxuXG4gIHB1YmxpYyBzZXRUYWcoa2V5OiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpIHtcbiAgICB0aGlzLnRhZ3NDb250ZXh0W2tleV0gPSB2YWx1ZTtcbiAgfVxuXG4gIHB1YmxpYyBjYXB0dXJlRXhjZXB0aW9uKGVycm9yOiB1bmtub3duLCBleHRyYUluZm8/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSB0aGlzLm5vcm1hbGl6ZVVua25vd25FcnJvcihlcnJvcik7XG4gICAgdGhpcy5jYXB0dXJlRXZlbnQoe1xuICAgICAga2luZDogRVZFTlRfS0lORC5FUlJPUixcbiAgICAgIHR5cGU6IEVWRU5UX1RZUEUuTUFOVUFMX0VSUk9SLFxuICAgICAgbGV2ZWw6IFwiZXJyb3JcIixcbiAgICAgIG1lc3NhZ2U6IG5vcm1hbGl6ZWQubWVzc2FnZSxcbiAgICAgIHN0YWNrOiBub3JtYWxpemVkLnN0YWNrLFxuICAgICAgZXh0cmE6IGV4dHJhSW5mbyB8fCB7fSxcbiAgICB9KTtcbiAgfVxuXG4gIHB1YmxpYyBjYXB0dXJlTWVzc2FnZShcbiAgICBtZXNzYWdlOiBzdHJpbmcsXG4gICAgZXh0cmFJbmZvPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gICAgbGV2ZWw6IEV2ZW50TGV2ZWwgPSBcImluZm9cIixcbiAgKSB7XG4gICAgdGhpcy5jYXB0dXJlRXZlbnQoe1xuICAgICAga2luZDogRVZFTlRfS0lORC5NRVNTQUdFLFxuICAgICAgdHlwZTogRVZFTlRfVFlQRS5NQU5VQUxfTUVTU0FHRSxcbiAgICAgIGxldmVsLFxuICAgICAgbWVzc2FnZSxcbiAgICAgIGV4dHJhOiBleHRyYUluZm8gfHwge30sXG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgdHJhY2soXG4gICAgZXZlbnROYW1lOiBzdHJpbmcsXG4gICAgcHJvcGVydGllczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPSB7fSxcbiAgICBldmVudFR5cGU6IEV2ZW50VHlwZSA9IEVWRU5UX1RZUEUuVFJBQ0tfQ1VTVE9NLFxuICApIHtcbiAgICB0aGlzLmNhcHR1cmVFdmVudCh7XG4gICAgICBraW5kOiBFVkVOVF9LSU5ELkFDVElPTixcbiAgICAgIHR5cGU6IGV2ZW50VHlwZSxcbiAgICAgIGxldmVsOiBcImluZm9cIixcbiAgICAgIG1lc3NhZ2U6IGV2ZW50TmFtZSxcbiAgICAgIGV4dHJhOiB7XG4gICAgICAgIGV2ZW50TmFtZSxcbiAgICAgICAgcHJvcGVydGllcyxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgY2FwdHVyZUV2ZW50KGV2ZW50OiBNb25pdG9yRXZlbnRJbnB1dCkge1xuICAgIHRoaXMuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gIH1cblxuICBwcml2YXRlIGRpc3BhdGNoRXZlbnQocGFydGlhbEV2ZW50OiBNb25pdG9yRXZlbnRJbnB1dCkge1xuICAgIGNvbnN0IGV2ZW50VGltZXN0YW1wID0gcGFydGlhbEV2ZW50LnRpbWVzdGFtcCA/PyBEYXRlLm5vdygpO1xuXG4gICAgbGV0IGZpbmFsRXZlbnQ6IE1vbml0b3JFdmVudCA9IHtcbiAgICAgIGtpbmQ6IHBhcnRpYWxFdmVudC5raW5kIHx8IHRoaXMuaW5mZXJLaW5kKHBhcnRpYWxFdmVudCksXG4gICAgICB0eXBlOiBwYXJ0aWFsRXZlbnQudHlwZSB8fCBFVkVOVF9UWVBFLkNVU1RPTV9FVkVOVCxcbiAgICAgIGxldmVsOiBwYXJ0aWFsRXZlbnQubGV2ZWwgfHwgdGhpcy5pbmZlckxldmVsKHBhcnRpYWxFdmVudCksXG4gICAgICBtZXNzYWdlOiBwYXJ0aWFsRXZlbnQubWVzc2FnZSB8fCBcIlwiLFxuICAgICAgc3RhY2s6IHBhcnRpYWxFdmVudC5zdGFjayA/PyBudWxsLFxuICAgICAgZmlsZW5hbWU6IHBhcnRpYWxFdmVudC5maWxlbmFtZSxcbiAgICAgIGxpbmVubzogcGFydGlhbEV2ZW50LmxpbmVubyxcbiAgICAgIGNvbG5vOiBwYXJ0aWFsRXZlbnQuY29sbm8sXG4gICAgICB0aW1lc3RhbXA6IGV2ZW50VGltZXN0YW1wLFxuICAgICAgdXJsOiBwYXJ0aWFsRXZlbnQudXJsIHx8IGdldFBhZ2VVcmwoKSxcbiAgICAgIGFwcFZlcnNpb246IHRoaXMub3B0aW9ucy5hcHBWZXJzaW9uLFxuICAgICAgZW52aXJvbm1lbnQ6IHRoaXMub3B0aW9ucy5lbnZpcm9ubWVudCxcbiAgICAgIHVzZXI6IHsgLi4udGhpcy51c2VyQ29udGV4dCB9LFxuICAgICAgdGFnczogeyAuLi50aGlzLnRhZ3NDb250ZXh0IH0sXG4gICAgICBleHRyYTogeyAuLi4ocGFydGlhbEV2ZW50LmV4dHJhIHx8IHt9KSB9LFxuICAgIH07XG5cbiAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5iZWZvcmVTZW5kID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIGNvbnN0IHByb2Nlc3NlZEV2ZW50ID0gdGhpcy5vcHRpb25zLmJlZm9yZVNlbmQoZmluYWxFdmVudCk7XG4gICAgICBpZiAocHJvY2Vzc2VkRXZlbnQgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZmluYWxFdmVudCA9IHByb2Nlc3NlZEV2ZW50O1xuICAgIH1cblxuICAgIHRoaXMuc2VuZChmaW5hbEV2ZW50KTtcbiAgfVxuXG4gIHByaXZhdGUgaW5mZXJLaW5kKHBhcnRpYWxFdmVudDogTW9uaXRvckV2ZW50SW5wdXQpOiBFdmVudEtpbmQge1xuICAgIGlmIChwYXJ0aWFsRXZlbnQuc3RhY2sgfHwgcGFydGlhbEV2ZW50LmZpbGVuYW1lKSB7XG4gICAgICByZXR1cm4gRVZFTlRfS0lORC5FUlJPUjtcbiAgICB9XG5cbiAgICBpZiAocGFydGlhbEV2ZW50LnR5cGU/LmluY2x1ZGVzKFwiaHR0cFwiKSkge1xuICAgICAgcmV0dXJuIEVWRU5UX0tJTkQuSFRUUDtcbiAgICB9XG5cbiAgICBpZiAocGFydGlhbEV2ZW50LnR5cGU/LmluY2x1ZGVzKFwicmVzb3VyY2VcIikpIHtcbiAgICAgIHJldHVybiBFVkVOVF9LSU5ELlJFU09VUkNFO1xuICAgIH1cblxuICAgIHJldHVybiBFVkVOVF9LSU5ELkNVU1RPTTtcbiAgfVxuXG4gIHByaXZhdGUgaW5mZXJMZXZlbChwYXJ0aWFsRXZlbnQ6IE1vbml0b3JFdmVudElucHV0KTogRXZlbnRMZXZlbCB7XG4gICAgaWYgKHBhcnRpYWxFdmVudC5raW5kID09PSBFVkVOVF9LSU5ELkVSUk9SKSB7XG4gICAgICByZXR1cm4gXCJlcnJvclwiO1xuICAgIH1cblxuICAgIGlmIChwYXJ0aWFsRXZlbnQudHlwZT8uaW5jbHVkZXMoXCJlcnJvclwiKSkge1xuICAgICAgcmV0dXJuIFwiZXJyb3JcIjtcbiAgICB9XG5cbiAgICByZXR1cm4gXCJpbmZvXCI7XG4gIH1cblxuICBwcml2YXRlIG5vcm1hbGl6ZVVua25vd25FcnJvcihlcnJvcjogdW5rbm93bik6IHtcbiAgICBtZXNzYWdlOiBzdHJpbmc7XG4gICAgc3RhY2s6IHN0cmluZyB8IG51bGw7XG4gIH0ge1xuICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBtZXNzYWdlOiBlcnJvci5tZXNzYWdlLFxuICAgICAgICBzdGFjazogZXJyb3Iuc3RhY2sgfHwgbnVsbCxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBlcnJvciA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbWVzc2FnZTogZXJyb3IsXG4gICAgICAgIHN0YWNrOiBudWxsLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbWVzc2FnZTogSlNPTi5zdHJpbmdpZnkoZXJyb3IpLFxuICAgICAgICBzdGFjazogbnVsbCxcbiAgICAgIH07XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBtZXNzYWdlOiBcIlVua25vd24gZXJyb3JcIixcbiAgICAgICAgc3RhY2s6IG51bGwsXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc2VuZChwYXlsb2FkOiBNb25pdG9yRXZlbnQpIHtcbiAgICBjb25zdCBkYXRhID0gSlNPTi5zdHJpbmdpZnkocGF5bG9hZCk7XG5cbiAgICBpZiAoXG4gICAgICB0eXBlb2YgbmF2aWdhdG9yICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICB0eXBlb2YgbmF2aWdhdG9yLnNlbmRCZWFjb24gPT09IFwiZnVuY3Rpb25cIlxuICAgICkge1xuICAgICAgY29uc3QgYmxvYiA9IG5ldyBCbG9iKFtkYXRhXSwgeyB0eXBlOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9KTtcbiAgICAgIGNvbnN0IHNlbnQgPSBuYXZpZ2F0b3Iuc2VuZEJlYWNvbih0aGlzLm9wdGlvbnMuZHNuLCBibG9iKTtcbiAgICAgIGlmIChzZW50KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGZldGNoICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmZXRjaCh0aGlzLm9wdGlvbnMuZHNuLCB7XG4gICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgYm9keTogZGF0YSxcbiAgICAgIGtlZXBhbGl2ZTogdHJ1ZSxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICAgIFwiWC1TREstSW5qZWN0ZWRcIjogXCJ0cnVlXCIsXG4gICAgICB9LFxuICAgIH0pLmNhdGNoKChzZW5kRXJyb3IpID0+IHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJbTW9uaXRvclNES10gZmFpbGVkIHRvIHNlbmQgZXZlbnRcIiwgc2VuZEVycm9yKTtcbiAgICB9KTtcbiAgfVxufVxuIiwiZXhwb3J0IHR5cGUgRXZlbnRMZXZlbCA9IFwiZGVidWdcIiB8IFwiaW5mb1wiIHwgXCJ3YXJuXCIgfCBcImVycm9yXCIgfCBcImZhdGFsXCI7XG5cbmV4cG9ydCBjb25zdCBFVkVOVF9LSU5EID0ge1xuICBFUlJPUjogXCJlcnJvclwiLFxuICBNRVNTQUdFOiBcIm1lc3NhZ2VcIixcbiAgSFRUUDogXCJodHRwXCIsXG4gIFJFU09VUkNFOiBcInJlc291cmNlXCIsXG4gIFBFUkZPUk1BTkNFOiBcInBlcmZvcm1hbmNlXCIsXG4gIEFDVElPTjogXCJhY3Rpb25cIixcbiAgQlVTSU5FU1M6IFwiYnVzaW5lc3NcIixcbiAgQ1VTVE9NOiBcImN1c3RvbVwiLFxufSBhcyBjb25zdDtcblxuZXhwb3J0IHR5cGUgQnVpbHRpbkV2ZW50S2luZCA9ICh0eXBlb2YgRVZFTlRfS0lORClba2V5b2YgdHlwZW9mIEVWRU5UX0tJTkRdO1xuZXhwb3J0IHR5cGUgRXZlbnRLaW5kID0gQnVpbHRpbkV2ZW50S2luZCB8IChzdHJpbmcgJiB7fSk7XG5cbmV4cG9ydCBjb25zdCBFVkVOVF9UWVBFID0ge1xuICAvLyBFcnJvciBldmVudHNcbiAgTUFOVUFMX0VSUk9SOiBcIm1hbnVhbF9lcnJvclwiLFxuICBKU19FUlJPUjogXCJqc19lcnJvclwiLFxuICBVTkhBTkRMRURfUkVKRUNUSU9OOiBcInVuaGFuZGxlZF9yZWplY3Rpb25cIixcbiAgVlVFX0VSUk9SOiBcInZ1ZV9lcnJvclwiLFxuXG4gIC8vIE5ldHdvcmsvcmVzb3VyY2UgZXZlbnRzXG4gIEhUVFBfRVJST1I6IFwiaHR0cF9lcnJvclwiLFxuICBSRVNPVVJDRV9FUlJPUjogXCJyZXNvdXJjZV9lcnJvclwiLFxuXG4gIC8vIE1lc3NhZ2UgZXZlbnRzXG4gIE1BTlVBTF9NRVNTQUdFOiBcIm1hbnVhbF9tZXNzYWdlXCIsXG5cbiAgLy8gVHJhY2tpbmcgKGJ1cmllZCBwb2ludCkgZXZlbnRzXG4gIFRSQUNLX0NMSUNLOiBcInRyYWNrX2NsaWNrXCIsXG4gIFRSQUNLX0VYUE9TVVJFOiBcInRyYWNrX2V4cG9zdXJlXCIsXG4gIFRSQUNLX1NVQk1JVDogXCJ0cmFja19zdWJtaXRcIixcbiAgVFJBQ0tfTkFWSUdBVElPTjogXCJ0cmFja19uYXZpZ2F0aW9uXCIsXG4gIFRSQUNLX0NVU1RPTTogXCJ0cmFja19jdXN0b21cIixcblxuICAvLyBQZXJmb3JtYW5jZSBldmVudHNcbiAgUEVSRl9GQ1A6IFwicGVyZl9mY3BcIixcbiAgUEVSRl9MQ1A6IFwicGVyZl9sY3BcIixcbiAgUEVSRl9DTFM6IFwicGVyZl9jbHNcIixcbiAgUEVSRl9JTlA6IFwicGVyZl9pbnBcIixcbiAgUEVSRl9UVEZCOiBcInBlcmZfdHRmYlwiLFxuICBQRVJGX0xPTkdfVEFTSzogXCJwZXJmX2xvbmdfdGFza1wiLFxuXG4gIC8vIEZhbGxiYWNrXG4gIENVU1RPTV9FVkVOVDogXCJjdXN0b21fZXZlbnRcIixcbn0gYXMgY29uc3Q7XG5cbmV4cG9ydCB0eXBlIEJ1aWx0aW5FdmVudFR5cGUgPSAodHlwZW9mIEVWRU5UX1RZUEUpW2tleW9mIHR5cGVvZiBFVkVOVF9UWVBFXTtcbmV4cG9ydCB0eXBlIEV2ZW50VHlwZSA9IEJ1aWx0aW5FdmVudFR5cGUgfCAoc3RyaW5nICYge30pO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNES09wdGlvbnMge1xuICBkc246IHN0cmluZztcbiAgYXBwVmVyc2lvbj86IHN0cmluZztcbiAgZW52aXJvbm1lbnQ/OiBcImRldmVsb3BtZW50XCIgfCBcInByb2R1Y3Rpb25cIiB8IFwidGVzdFwiO1xuICBpbnRlZ3JhdGlvbnM/OiBJbnRlZ3JhdGlvbltdO1xuICBiZWZvcmVTZW5kPzogKGV2ZW50OiBNb25pdG9yRXZlbnQpID0+IE1vbml0b3JFdmVudCB8IG51bGw7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTW9uaXRvckV2ZW50IHtcbiAga2luZDogRXZlbnRLaW5kO1xuICB0eXBlOiBFdmVudFR5cGU7XG4gIGxldmVsOiBFdmVudExldmVsO1xuICBtZXNzYWdlOiBzdHJpbmc7XG4gIHN0YWNrPzogc3RyaW5nIHwgbnVsbDtcbiAgdGltZXN0YW1wOiBudW1iZXI7XG4gIHVybDogc3RyaW5nO1xuICBmaWxlbmFtZT86IHN0cmluZztcbiAgbGluZW5vPzogbnVtYmVyO1xuICBjb2xubz86IG51bWJlcjtcbiAgYXBwVmVyc2lvbj86IHN0cmluZztcbiAgZW52aXJvbm1lbnQ/OiBzdHJpbmc7XG4gIHVzZXI/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gIGV4dHJhPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG59XG5cbmV4cG9ydCB0eXBlIE1vbml0b3JFdmVudElucHV0ID0gUGFydGlhbDxNb25pdG9yRXZlbnQ+O1xuXG5leHBvcnQgaW50ZXJmYWNlIFRyYWNrZXJJbnN0YW5jZSB7XG4gIGNhcHR1cmVFeGNlcHRpb24oZXJyb3I6IHVua25vd24sIGV4dHJhSW5mbz86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KTogdm9pZDtcbiAgY2FwdHVyZU1lc3NhZ2UoXG4gICAgbWVzc2FnZTogc3RyaW5nLFxuICAgIGV4dHJhSW5mbz86IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICAgIGxldmVsPzogRXZlbnRMZXZlbCxcbiAgKTogdm9pZDtcbiAgdHJhY2soXG4gICAgZXZlbnROYW1lOiBzdHJpbmcsXG4gICAgcHJvcGVydGllcz86IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICAgIGV2ZW50VHlwZT86IEV2ZW50VHlwZSxcbiAgKTogdm9pZDtcbiAgY2FwdHVyZUV2ZW50KGV2ZW50OiBNb25pdG9yRXZlbnRJbnB1dCk6IHZvaWQ7XG4gIHNldFVzZXIodXNlcjogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pOiB2b2lkO1xuICBjbGVhclVzZXIoKTogdm9pZDtcbiAgc2V0VGFnKGtleTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKTogdm9pZDtcbiAgZ2V0RHNuKCk6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbnRlZ3JhdGlvbiB7XG4gIG5hbWU6IHN0cmluZztcbiAgc2V0dXA6ICh0cmFja2VyOiBUcmFja2VySW5zdGFuY2UpID0+IHZvaWQ7XG4gIGRpc3Bvc2U/OiAoKSA9PiB2b2lkO1xufVxuIiwiaW1wb3J0IHsgRVZFTlRfS0lORCwgRVZFTlRfVFlQRSB9IGZyb20gXCIuLi8uLi9jb3JlL3R5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IFRyYWNrZXJJbnN0YW5jZSB9IGZyb20gXCIuLi8uLi9jb3JlL3R5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IFJlc29sdmVkQnJvd3NlckVycm9yQ29sbGVjdGlvbk9wdGlvbnMgfSBmcm9tIFwiLi9vcHRpb25zXCI7XG5cbmV4cG9ydCBjb25zdCBzZXR1cEJyb3dzZXJFcnJvckNvbGxlY3Rpb24gPSAoXG4gIHRyYWNrZXI6IFRyYWNrZXJJbnN0YW5jZSxcbiAgb3B0aW9uczogUmVzb2x2ZWRCcm93c2VyRXJyb3JDb2xsZWN0aW9uT3B0aW9ucyxcbik6IHZvaWQgPT4ge1xuICBpZiAoIW9wdGlvbnMuZW5hYmxlZCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChvcHRpb25zLmpzRXJyb3IgfHwgb3B0aW9ucy5yZXNvdXJjZUVycm9yKSB7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICBcImVycm9yXCIsXG4gICAgICAoZXZlbnQ6IEVycm9yRXZlbnQgfCBFdmVudCkgPT4ge1xuICAgICAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgRXZlbnRUYXJnZXQgfCBudWxsO1xuXG4gICAgICAgIGlmIChvcHRpb25zLnJlc291cmNlRXJyb3IgJiYgaXNSZXNvdXJjZUVycm9yVGFyZ2V0KHRhcmdldCkpIHtcbiAgICAgICAgICBjb25zdCByZXNvdXJjZVVybCA9XG4gICAgICAgICAgICAodGFyZ2V0IGFzIEhUTUxJbWFnZUVsZW1lbnQpLnNyYyB8fFxuICAgICAgICAgICAgKHRhcmdldCBhcyBIVE1MTGlua0VsZW1lbnQpLmhyZWYgfHxcbiAgICAgICAgICAgIFwiXCI7XG4gICAgICAgICAgY29uc3QgdGFnTmFtZSA9IHRhcmdldC50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgICAgICB0cmFja2VyLmNhcHR1cmVFdmVudCh7XG4gICAgICAgICAgICBraW5kOiBFVkVOVF9LSU5ELlJFU09VUkNFLFxuICAgICAgICAgICAgdHlwZTogRVZFTlRfVFlQRS5SRVNPVVJDRV9FUlJPUixcbiAgICAgICAgICAgIGxldmVsOiBcImVycm9yXCIsXG4gICAgICAgICAgICBtZXNzYWdlOiBgU3RhdGljIHJlc291cmNlIGZhaWxlZDogPCR7dGFnTmFtZX0+YCxcbiAgICAgICAgICAgIHVybDogcmVzb3VyY2VVcmwsXG4gICAgICAgICAgICBleHRyYToge1xuICAgICAgICAgICAgICB0YWdOYW1lLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIW9wdGlvbnMuanNFcnJvcikge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGVycm9yRXZlbnQgPSBldmVudCBhcyBFcnJvckV2ZW50O1xuICAgICAgICB0cmFja2VyLmNhcHR1cmVFdmVudCh7XG4gICAgICAgICAga2luZDogRVZFTlRfS0lORC5FUlJPUixcbiAgICAgICAgICB0eXBlOiBFVkVOVF9UWVBFLkpTX0VSUk9SLFxuICAgICAgICAgIGxldmVsOiBcImVycm9yXCIsXG4gICAgICAgICAgbWVzc2FnZTogZXJyb3JFdmVudC5tZXNzYWdlIHx8IFwiVW5rbm93biBzY3JpcHQgZXJyb3JcIixcbiAgICAgICAgICBzdGFjazogZXJyb3JFdmVudC5lcnJvcj8uc3RhY2sgfHwgbnVsbCxcbiAgICAgICAgICBmaWxlbmFtZTogZXJyb3JFdmVudC5maWxlbmFtZSxcbiAgICAgICAgICBsaW5lbm86IGVycm9yRXZlbnQubGluZW5vLFxuICAgICAgICAgIGNvbG5vOiBlcnJvckV2ZW50LmNvbG5vLFxuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgICB0cnVlLFxuICAgICk7XG4gIH1cblxuICBpZiAob3B0aW9ucy51bmhhbmRsZWRSZWplY3Rpb24pIHtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgIFwidW5oYW5kbGVkcmVqZWN0aW9uXCIsXG4gICAgICAoZXZlbnQ6IFByb21pc2VSZWplY3Rpb25FdmVudCkgPT4ge1xuICAgICAgICBjb25zdCByZWFzb24gPSBldmVudC5yZWFzb247XG4gICAgICAgIHRyYWNrZXIuY2FwdHVyZUV2ZW50KHtcbiAgICAgICAgICBraW5kOiBFVkVOVF9LSU5ELkVSUk9SLFxuICAgICAgICAgIHR5cGU6IEVWRU5UX1RZUEUuVU5IQU5ETEVEX1JFSkVDVElPTixcbiAgICAgICAgICBsZXZlbDogXCJlcnJvclwiLFxuICAgICAgICAgIG1lc3NhZ2U6IGV4dHJhY3RQcm9taXNlTWVzc2FnZShyZWFzb24pLFxuICAgICAgICAgIHN0YWNrOiByZWFzb24gaW5zdGFuY2VvZiBFcnJvciA/IHJlYXNvbi5zdGFjayA6IG51bGwsXG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICApO1xuICB9XG59O1xuXG5jb25zdCBpc1Jlc291cmNlRXJyb3JUYXJnZXQgPSAodGFyZ2V0OiBFdmVudFRhcmdldCB8IG51bGwpOiB0YXJnZXQgaXMgSFRNTEVsZW1lbnQgPT4ge1xuICByZXR1cm4gdGFyZ2V0IGluc3RhbmNlb2YgSFRNTEVsZW1lbnQ7XG59O1xuXG5jb25zdCBleHRyYWN0UHJvbWlzZU1lc3NhZ2UgPSAocmVhc29uOiB1bmtub3duKTogc3RyaW5nID0+IHtcbiAgaWYgKHR5cGVvZiByZWFzb24gPT09IFwic3RyaW5nXCIpIHtcbiAgICByZXR1cm4gcmVhc29uO1xuICB9XG5cbiAgaWYgKHJlYXNvbiBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgcmV0dXJuIHJlYXNvbi5tZXNzYWdlO1xuICB9XG5cbiAgdHJ5IHtcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkocmVhc29uKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIFwiUHJvbWlzZSByZWplY3RlZCB3aXRoIG5vbi1zZXJpYWxpemFibGUgdmFsdWVcIjtcbiAgfVxufTtcclxuIiwiaW1wb3J0IHsgQmFzZUludGVncmF0aW9uIH0gZnJvbSBcIi4uLy4uL2NvcmUvQmFzZUludGVncmF0aW9uXCI7XG5pbXBvcnQgdHlwZSB7IFRyYWNrZXJJbnN0YW5jZSB9IGZyb20gXCIuLi8uLi9jb3JlL3R5cGVzXCI7XG5pbXBvcnQgeyBzZXR1cEJyb3dzZXJFcnJvckNvbGxlY3Rpb24gfSBmcm9tIFwiLi9lcnJvcnNcIjtcbmltcG9ydCB7XG4gIGRlZmluZUJyb3dzZXJJbnRlZ3JhdGlvbk9wdGlvbnMsXG4gIHJlc29sdmVCcm93c2VySW50ZWdyYXRpb25PcHRpb25zLFxuICB0eXBlIEJyb3dzZXJJbnRlZ3JhdGlvbk9wdGlvbnMsXG4gIHR5cGUgUmVzb2x2ZWRCcm93c2VySW50ZWdyYXRpb25PcHRpb25zLFxufSBmcm9tIFwiLi9vcHRpb25zXCI7XG5pbXBvcnQgeyBzZXR1cFdlYlZpdGFsc0NvbGxlY3Rpb24gfSBmcm9tIFwiLi92aXRhbHNcIjtcblxuZXhwb3J0IHsgZGVmaW5lQnJvd3NlckludGVncmF0aW9uT3B0aW9ucyB9O1xuZXhwb3J0IHR5cGUgeyBCcm93c2VySW50ZWdyYXRpb25PcHRpb25zIH07XG5cbmV4cG9ydCBjbGFzcyBCcm93c2VySW50ZWdyYXRpb24gZXh0ZW5kcyBCYXNlSW50ZWdyYXRpb24ge1xuICBwdWJsaWMgcmVhZG9ubHkgbmFtZSA9IFwiQnJvd3NlckludGVncmF0aW9uXCI7XG5cbiAgcHJpdmF0ZSByZWFkb25seSBvcHRpb25zOiBSZXNvbHZlZEJyb3dzZXJJbnRlZ3JhdGlvbk9wdGlvbnM7XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBvcHRpb25zIOa1j+iniOWZqOerr+mHh+mbhumFjee9ruOAglxuICAgKi9cbiAgY29uc3RydWN0b3Iob3B0aW9ucz86IEJyb3dzZXJJbnRlZ3JhdGlvbk9wdGlvbnMpIHtcbiAgICBzdXBlcigpO1xuICAgIG9wdGlvbnMgPSBvcHRpb25zID8/IHt9O1xuICAgIHRoaXMub3B0aW9ucyA9IHJlc29sdmVCcm93c2VySW50ZWdyYXRpb25PcHRpb25zKG9wdGlvbnMpO1xuICB9XG5cbiAgcHJvdGVjdGVkIHNldHVwQ29yZSh0cmFja2VyOiBUcmFja2VySW5zdGFuY2UpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5lbmFibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZXR1cEJyb3dzZXJFcnJvckNvbGxlY3Rpb24odHJhY2tlciwgdGhpcy5vcHRpb25zLmVycm9ycyk7XG4gICAgc2V0dXBXZWJWaXRhbHNDb2xsZWN0aW9uKHRyYWNrZXIsIHRoaXMub3B0aW9ucy52aXRhbHMpO1xuICB9XG59XG4iLCIvKipcbiAqIOa1j+iniOWZqOWFqOWxgOmUmeivr+mHh+mbhumFjee9ruOAglxuICovXG5leHBvcnQgaW50ZXJmYWNlIEJyb3dzZXJFcnJvckNvbGxlY3Rpb25PcHRpb25zIHtcbiAgLyoqIOaYr+WQpuWQr+eUqOivpeaooeWdl+S4i+WFqOmDqOmUmeivr+ebkeWQrOOAgkBkZWZhdWx0IHRydWUgKi9cbiAgZW5hYmxlZD86IGJvb2xlYW47XG4gIC8qKiDmmK/lkKbph4fpm4YgYHdpbmRvdy5vbmVycm9yYCDkuqfnlJ/nmoQgSlMg6L+Q6KGM5pe26ZSZ6K+v44CCQGRlZmF1bHQgdHJ1ZSAqL1xuICBqc0Vycm9yPzogYm9vbGVhbjtcbiAgLyoqIOaYr+WQpumHh+mbhumdmeaAgei1hOa6kOWKoOi9vemUmeivr++8iGltZy9zY3JpcHQvbGlua++8ieOAgkBkZWZhdWx0IHRydWUgKi9cbiAgcmVzb3VyY2VFcnJvcj86IGJvb2xlYW47XG4gIC8qKiDmmK/lkKbph4fpm4bmnKrlpITnkIbnmoQgUHJvbWlzZSDmi5Lnu53jgIJAZGVmYXVsdCB0cnVlICovXG4gIHVuaGFuZGxlZFJlamVjdGlvbj86IGJvb2xlYW47XG59XG5cbi8qKlxuICog5Z+65LqOIGB3ZWItdml0YWxzYCDnmoTmgKfog73mjIfmoIfph4fpm4bphY3nva7jgIJcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBCcm93c2VyVml0YWxzQ29sbGVjdGlvbk9wdGlvbnMge1xuICAvKiog5piv5ZCm5ZCv55So6K+l5qih5Z2X5LiL5YWo6YOoIHZpdGFscyDnm5HlkKzjgIJAZGVmYXVsdCB0cnVlICovXG4gIGVuYWJsZWQ/OiBib29sZWFuO1xuICAvKiog5piv5ZCm5LiK5oql5q+P5LiA5qyh5oyH5qCH5Y+Y5YyW77yI5ZCm5YiZ5Y+q5LiK5oql56iz5a6aL+acgOe7iOWAvO+8ieOAgkBkZWZhdWx0IGZhbHNlICovXG4gIHJlcG9ydEFsbENoYW5nZXM/OiBib29sZWFuO1xuICAvKiog5piv5ZCm6YeH6ZuGIEZDUO+8iOmmluasoeWGheWuuee7mOWItu+8ieOAgkBkZWZhdWx0IHRydWUgKi9cbiAgZmNwPzogYm9vbGVhbjtcbiAgLyoqIOaYr+WQpumHh+mbhiBMQ1DvvIjmnIDlpKflhoXlrrnnu5jliLbvvInjgIJAZGVmYXVsdCB0cnVlICovXG4gIGxjcD86IGJvb2xlYW47XG4gIC8qKiDmmK/lkKbph4fpm4YgQ0xT77yI57Sv56ev5biD5bGA5YGP56e777yJ44CCQGRlZmF1bHQgdHJ1ZSAqL1xuICBjbHM/OiBib29sZWFuO1xuICAvKiog5piv5ZCm6YeH6ZuGIElOUO+8iOS6pOS6kuWIsOS4i+S4gOasoee7mOWItu+8ieOAgkBkZWZhdWx0IHRydWUgKi9cbiAgaW5wPzogYm9vbGVhbjtcbiAgLyoqIOaYr+WQpumHh+mbhiBUVEZC77yI6aaW5a2X6IqC5pe26Ze077yJ44CCQGRlZmF1bHQgdHJ1ZSAqL1xuICB0dGZiPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBCcm93c2VySW50ZWdyYXRpb24g5oC76YWN572u44CCXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQnJvd3NlckludGVncmF0aW9uT3B0aW9ucyB7XG4gIC8qKiDmmK/lkKblkK/nlKjmlbTkuKogQnJvd3NlckludGVncmF0aW9u44CCQGRlZmF1bHQgdHJ1ZSAqL1xuICBlbmFibGVkPzogYm9vbGVhbjtcbiAgLyoqIOmUmeivr+mHh+mbhuWtkOmFjee9ruOAgiBAZGVwcmVjYXRlZCovXG4gIGVycm9ycz86IEJyb3dzZXJFcnJvckNvbGxlY3Rpb25PcHRpb25zO1xuICAvKiog5oCn6IO95oyH5qCH6YeH6ZuG5a2Q6YWN572u44CCICovXG4gIHZpdGFscz86IEJyb3dzZXJWaXRhbHNDb2xsZWN0aW9uT3B0aW9ucztcbn1cbmV4cG9ydCB0eXBlIFJlc29sdmVkQnJvd3NlckVycm9yQ29sbGVjdGlvbk9wdGlvbnMgPVxuICBSZXF1aXJlZDxCcm93c2VyRXJyb3JDb2xsZWN0aW9uT3B0aW9ucz47XG5leHBvcnQgdHlwZSBSZXNvbHZlZEJyb3dzZXJWaXRhbHNDb2xsZWN0aW9uT3B0aW9ucyA9XG4gIFJlcXVpcmVkPEJyb3dzZXJWaXRhbHNDb2xsZWN0aW9uT3B0aW9ucz47XG5leHBvcnQgaW50ZXJmYWNlIFJlc29sdmVkQnJvd3NlckludGVncmF0aW9uT3B0aW9ucyB7XG4gIGVuYWJsZWQ6IGJvb2xlYW47XG4gIGVycm9yczogUmVzb2x2ZWRCcm93c2VyRXJyb3JDb2xsZWN0aW9uT3B0aW9ucztcbiAgdml0YWxzOiBSZXNvbHZlZEJyb3dzZXJWaXRhbHNDb2xsZWN0aW9uT3B0aW9ucztcbn1cblxuY29uc3QgREVGQVVMVF9FUlJPUl9PUFRJT05TOiBSZXNvbHZlZEJyb3dzZXJFcnJvckNvbGxlY3Rpb25PcHRpb25zID0ge1xuICBlbmFibGVkOiB0cnVlLFxuICBqc0Vycm9yOiB0cnVlLFxuICByZXNvdXJjZUVycm9yOiB0cnVlLFxuICB1bmhhbmRsZWRSZWplY3Rpb246IHRydWUsXG59O1xuXG5jb25zdCBERUZBVUxUX1ZJVEFMU19PUFRJT05TOiBSZXNvbHZlZEJyb3dzZXJWaXRhbHNDb2xsZWN0aW9uT3B0aW9ucyA9IHtcbiAgZW5hYmxlZDogdHJ1ZSxcbiAgcmVwb3J0QWxsQ2hhbmdlczogZmFsc2UsXG4gIGZjcDogdHJ1ZSxcbiAgbGNwOiB0cnVlLFxuICBjbHM6IHRydWUsXG4gIGlucDogdHJ1ZSxcbiAgdHRmYjogdHJ1ZSxcbn07XG5cbmNvbnN0IERFRkFVTFRfQlJPV1NFUl9PUFRJT05TOiBSZXNvbHZlZEJyb3dzZXJJbnRlZ3JhdGlvbk9wdGlvbnMgPSB7XG4gIGVuYWJsZWQ6IHRydWUsXG4gIGVycm9yczogREVGQVVMVF9FUlJPUl9PUFRJT05TLFxuICB2aXRhbHM6IERFRkFVTFRfVklUQUxTX09QVElPTlMsXG59O1xuXG5jb25zdCByZXNvbHZlRXJyb3JPcHRpb25zID0gKFxuICBvcHRpb25zOiBCcm93c2VyRXJyb3JDb2xsZWN0aW9uT3B0aW9ucyA9IHt9LFxuKTogUmVzb2x2ZWRCcm93c2VyRXJyb3JDb2xsZWN0aW9uT3B0aW9ucyA9PiB7XG4gIHJldHVybiB7XG4gICAgLi4uREVGQVVMVF9FUlJPUl9PUFRJT05TLFxuICAgIC4uLm9wdGlvbnMsXG4gIH07XG59O1xuXG5jb25zdCByZXNvbHZlVml0YWxzT3B0aW9ucyA9IChcbiAgb3B0aW9uczogQnJvd3NlclZpdGFsc0NvbGxlY3Rpb25PcHRpb25zID0ge30sXG4pOiBSZXNvbHZlZEJyb3dzZXJWaXRhbHNDb2xsZWN0aW9uT3B0aW9ucyA9PiB7XG4gIHJldHVybiB7XG4gICAgLi4uREVGQVVMVF9WSVRBTFNfT1BUSU9OUyxcbiAgICAuLi5vcHRpb25zLFxuICB9O1xufTtcblxuZXhwb3J0IGNvbnN0IHJlc29sdmVCcm93c2VySW50ZWdyYXRpb25PcHRpb25zID0gKFxuICBvcHRpb25zOiBCcm93c2VySW50ZWdyYXRpb25PcHRpb25zID0ge30sXG4pOiBSZXNvbHZlZEJyb3dzZXJJbnRlZ3JhdGlvbk9wdGlvbnMgPT4ge1xuICByZXR1cm4ge1xuICAgIGVuYWJsZWQ6IG9wdGlvbnMuZW5hYmxlZCA/PyBERUZBVUxUX0JST1dTRVJfT1BUSU9OUy5lbmFibGVkLFxuICAgIGVycm9yczogcmVzb2x2ZUVycm9yT3B0aW9ucyhvcHRpb25zLmVycm9ycyksXG4gICAgdml0YWxzOiByZXNvbHZlVml0YWxzT3B0aW9ucyhvcHRpb25zLnZpdGFscyksXG4gIH07XG59O1xuXG4vKipcbiAqIOWcqOiwg+eUqOWkhOaPkOS+m+abtOeos+WumueahOexu+Wei+aPkOekuuS4juagoemqjOOAglxuICpcbiAqIEBleGFtcGxlXG4gKiBjb25zdCBvcHRpb25zID0gZGVmaW5lQnJvd3NlckludGVncmF0aW9uT3B0aW9ucyh7XG4gKiAgIGVycm9yczogeyBqc0Vycm9yOiB0cnVlIH0sXG4gKiAgIHZpdGFsczogeyBmY3A6IHRydWUsIGxjcDogdHJ1ZSB9LFxuICogfSk7XG4gKi9cbmV4cG9ydCBjb25zdCBkZWZpbmVCcm93c2VySW50ZWdyYXRpb25PcHRpb25zID0gKFxuICBvcHRpb25zOiBCcm93c2VySW50ZWdyYXRpb25PcHRpb25zLFxuKTogQnJvd3NlckludGVncmF0aW9uT3B0aW9ucyA9PiBvcHRpb25zO1xuIiwiaW1wb3J0IHtcbiAgb25DTFMsXG4gIG9uRkNQLFxuICBvbklOUCxcbiAgb25MQ1AsXG4gIG9uVFRGQixcbiAgdHlwZSBNZXRyaWNUeXBlLFxuICB0eXBlIFJlcG9ydE9wdHMsXG59IGZyb20gXCJ3ZWItdml0YWxzXCI7XG5pbXBvcnQge1xuICBFVkVOVF9LSU5ELFxuICBFVkVOVF9UWVBFLFxuICB0eXBlIEV2ZW50TGV2ZWwsXG4gIHR5cGUgRXZlbnRUeXBlLFxuICB0eXBlIFRyYWNrZXJJbnN0YW5jZSxcbn0gZnJvbSBcIi4uLy4uL2NvcmUvdHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgUmVzb2x2ZWRCcm93c2VyVml0YWxzQ29sbGVjdGlvbk9wdGlvbnMgfSBmcm9tIFwiLi9vcHRpb25zXCI7XG5cbmNvbnN0IE1FVFJJQ19FVkVOVF9UWVBFX01BUDogUmVjb3JkPE1ldHJpY1R5cGVbXCJuYW1lXCJdLCBFdmVudFR5cGU+ID0ge1xuICBGQ1A6IEVWRU5UX1RZUEUuUEVSRl9GQ1AsXG4gIExDUDogRVZFTlRfVFlQRS5QRVJGX0xDUCxcbiAgQ0xTOiBFVkVOVF9UWVBFLlBFUkZfQ0xTLFxuICBJTlA6IEVWRU5UX1RZUEUuUEVSRl9JTlAsXG4gIFRURkI6IEVWRU5UX1RZUEUuUEVSRl9UVEZCLFxufTtcblxuZXhwb3J0IGNvbnN0IHNldHVwV2ViVml0YWxzQ29sbGVjdGlvbiA9IChcbiAgdHJhY2tlcjogVHJhY2tlckluc3RhbmNlLFxuICBvcHRpb25zOiBSZXNvbHZlZEJyb3dzZXJWaXRhbHNDb2xsZWN0aW9uT3B0aW9ucyxcbik6IHZvaWQgPT4ge1xuICBpZiAoIW9wdGlvbnMuZW5hYmxlZCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGNyZWF0ZVJlcG9ydE9wdGlvbnMgPSAoKTogUmVwb3J0T3B0cyA9PiAoe1xuICAgIHJlcG9ydEFsbENoYW5nZXM6IG9wdGlvbnMucmVwb3J0QWxsQ2hhbmdlcyxcbiAgfSk7XG5cbiAgY29uc3QgcmVwb3J0TWV0cmljID0gKG1ldHJpYzogTWV0cmljVHlwZSk6IHZvaWQgPT4ge1xuICAgIGNvbnNvbGUubG9nKG1ldHJpYyk7XG4gICAgXG4gICAgdHJhY2tlci5jYXB0dXJlRXZlbnQoe1xuICAgICAga2luZDogRVZFTlRfS0lORC5QRVJGT1JNQU5DRSxcbiAgICAgIHR5cGU6IE1FVFJJQ19FVkVOVF9UWVBFX01BUFttZXRyaWMubmFtZV0sXG4gICAgICBsZXZlbDogbWFwUmF0aW5nVG9MZXZlbChtZXRyaWMucmF0aW5nKSxcbiAgICAgIG1lc3NhZ2U6IGJ1aWxkTWV0cmljTWVzc2FnZShtZXRyaWMpLFxuICAgICAgZXh0cmE6IHtcbiAgICAgICAgbWV0cmljTmFtZTogbWV0cmljLm5hbWUsXG4gICAgICAgIHZhbHVlOiBtZXRyaWMudmFsdWUsXG4gICAgICAgIGRlbHRhOiBtZXRyaWMuZGVsdGEsXG4gICAgICAgIHJhdGluZzogbWV0cmljLnJhdGluZyxcbiAgICAgICAgbWV0cmljSWQ6IG1ldHJpYy5pZCxcbiAgICAgICAgbmF2aWdhdGlvblR5cGU6IG1ldHJpYy5uYXZpZ2F0aW9uVHlwZSxcbiAgICAgICAgZW50cmllc0NvdW50OiBtZXRyaWMuZW50cmllcy5sZW5ndGgsXG4gICAgICB9LFxuICAgIH0pO1xuICB9O1xuXG4gIGlmIChvcHRpb25zLmZjcCkge1xuICAgIG9uRkNQKHJlcG9ydE1ldHJpYywgY3JlYXRlUmVwb3J0T3B0aW9ucygpKTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLmxjcCkge1xuICAgIG9uTENQKHJlcG9ydE1ldHJpYywgY3JlYXRlUmVwb3J0T3B0aW9ucygpKTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLmNscykge1xuICAgIG9uQ0xTKHJlcG9ydE1ldHJpYywgY3JlYXRlUmVwb3J0T3B0aW9ucygpKTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLmlucCkge1xuICAgIG9uSU5QKHJlcG9ydE1ldHJpYywgY3JlYXRlUmVwb3J0T3B0aW9ucygpKTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLnR0ZmIpIHtcbiAgICBvblRURkIocmVwb3J0TWV0cmljLCBjcmVhdGVSZXBvcnRPcHRpb25zKCkpO1xuICB9XG59O1xuXG5jb25zdCBtYXBSYXRpbmdUb0xldmVsID0gKHJhdGluZzogTWV0cmljVHlwZVtcInJhdGluZ1wiXSk6IEV2ZW50TGV2ZWwgPT4ge1xuICBpZiAocmF0aW5nID09PSBcInBvb3JcIikge1xuICAgIHJldHVybiBcImVycm9yXCI7XG4gIH1cblxuICBpZiAocmF0aW5nID09PSBcIm5lZWRzLWltcHJvdmVtZW50XCIpIHtcbiAgICByZXR1cm4gXCJ3YXJuXCI7XG4gIH1cblxuICByZXR1cm4gXCJpbmZvXCI7XG59O1xuXG5jb25zdCBidWlsZE1ldHJpY01lc3NhZ2UgPSAobWV0cmljOiBNZXRyaWNUeXBlKTogc3RyaW5nID0+IHtcbiAgY29uc3QgdW5pdCA9IG1ldHJpYy5uYW1lID09PSBcIkNMU1wiID8gXCJcIiA6IFwibXNcIjtcbiAgcmV0dXJuIGAke21ldHJpYy5uYW1lfTogJHttZXRyaWMudmFsdWUudG9GaXhlZCgyKX0ke3VuaXR9YDtcbn07XG4iLCJpbXBvcnQgeyBCYXNlSW50ZWdyYXRpb24gfSBmcm9tIFwiLi4vY29yZS9CYXNlSW50ZWdyYXRpb25cIjtcbmltcG9ydCB7IEVWRU5UX0tJTkQsIEVWRU5UX1RZUEUgfSBmcm9tIFwiLi4vY29yZS90eXBlc1wiO1xuaW1wb3J0IHR5cGUgeyBUcmFja2VySW5zdGFuY2UgfSBmcm9tIFwiLi4vY29yZS90eXBlc1wiO1xuXG4vKipcbiAqIEZldGNoSW50ZWdyYXRpb24g6YWN572u6aG544CCXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRmV0Y2hJbnRlZ3JhdGlvbk9wdGlvbnMge1xuICAvKiog5piv5ZCm5ZCv55SoIGZldGNoIOivt+axguaLpuaIquOAgkBkZWZhdWx0IHRydWUgKi9cbiAgZW5hYmxlZD86IGJvb2xlYW47XG4gIC8qKiDlsIbnirbmgIHnoIHlpKfkuo7nrYnkuo7or6XpmIjlgLznmoTlk43lupTop4bkuLrplJnor6/jgIJAZGVmYXVsdCA0MDAgKi9cbiAgc3RhdHVzRXJyb3JUaHJlc2hvbGQ/OiBudW1iZXI7XG4gIC8qKiDmmK/lkKblnKggYGV4dHJhLnJlcXVlc3REYXRhYCDkuK3pmYTluKbor7fmsYLkvZPvvIjlj6/ojrflj5bml7bvvInjgIJAZGVmYXVsdCB0cnVlICovXG4gIGNhcHR1cmVSZXF1ZXN0Qm9keT86IGJvb2xlYW47XG4gIC8qKiDljLnphY3or6Xop4TliJnnmoQgVVJMIOWwhui3s+i/h+mHh+mbhuOAguaUr+aMgeWtl+espuS4suaIluato+WImeOAgiAqL1xuICBpZ25vcmVVcmxzPzogQXJyYXk8c3RyaW5nIHwgUmVnRXhwPjtcbn1cblxudHlwZSBSZXNvbHZlZEZldGNoSW50ZWdyYXRpb25PcHRpb25zID0gUmVxdWlyZWQ8XG4gIE9taXQ8RmV0Y2hJbnRlZ3JhdGlvbk9wdGlvbnMsIFwiaWdub3JlVXJsc1wiPlxuPiAmIHtcbiAgaWdub3JlVXJsczogQXJyYXk8c3RyaW5nIHwgUmVnRXhwPjtcbn07XG5cbmNvbnN0IHJlc29sdmVGZXRjaEludGVncmF0aW9uT3B0aW9ucyA9IChcbiAgb3B0aW9uczogRmV0Y2hJbnRlZ3JhdGlvbk9wdGlvbnMgPSB7fSxcbik6IFJlc29sdmVkRmV0Y2hJbnRlZ3JhdGlvbk9wdGlvbnMgPT4ge1xuICByZXR1cm4ge1xuICAgIGVuYWJsZWQ6IG9wdGlvbnMuZW5hYmxlZCA/PyB0cnVlLFxuICAgIHN0YXR1c0Vycm9yVGhyZXNob2xkOiBvcHRpb25zLnN0YXR1c0Vycm9yVGhyZXNob2xkID8/IDQwMCxcbiAgICBjYXB0dXJlUmVxdWVzdEJvZHk6IG9wdGlvbnMuY2FwdHVyZVJlcXVlc3RCb2R5ID8/IHRydWUsXG4gICAgaWdub3JlVXJsczogb3B0aW9ucy5pZ25vcmVVcmxzID8/IFtdLFxuICB9O1xufTtcblxuZXhwb3J0IGNsYXNzIEZldGNoSW50ZWdyYXRpb24gZXh0ZW5kcyBCYXNlSW50ZWdyYXRpb24ge1xuICBwdWJsaWMgcmVhZG9ubHkgbmFtZSA9IFwiRmV0Y2hJbnRlZ3JhdGlvblwiO1xuICBwcml2YXRlIHJlYWRvbmx5IG9wdGlvbnM6IFJlc29sdmVkRmV0Y2hJbnRlZ3JhdGlvbk9wdGlvbnM7XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBvcHRpb25zIGZldGNoIOivt+axgumHh+mbhumFjee9ruOAglxuICAgKi9cbiAgY29uc3RydWN0b3Iob3B0aW9uczogRmV0Y2hJbnRlZ3JhdGlvbk9wdGlvbnMgPSB7fSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5vcHRpb25zID0gcmVzb2x2ZUZldGNoSW50ZWdyYXRpb25PcHRpb25zKG9wdGlvbnMpO1xuICB9XG5cbiAgcHJvdGVjdGVkIHNldHVwQ29yZSh0cmFja2VyOiBUcmFja2VySW5zdGFuY2UpIHtcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5lbmFibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgPT09IFwidW5kZWZpbmVkXCIgfHwgdHlwZW9mIHdpbmRvdy5mZXRjaCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5pbnN0cnVtZW50RmV0Y2godHJhY2tlcik7XG4gIH1cblxuICBwcml2YXRlIGluc3RydW1lbnRGZXRjaCh0cmFja2VyOiBUcmFja2VySW5zdGFuY2UpIHtcbiAgICBjb25zdCBvcmlnaW5hbEZldGNoID0gd2luZG93LmZldGNoO1xuICAgIGNvbnN0IGRzbiA9IHRyYWNrZXIuZ2V0RHNuKCk7XG5cbiAgICB3aW5kb3cuZmV0Y2ggPSBhc3luYyAoXG4gICAgICAuLi5hcmdzOiBQYXJhbWV0ZXJzPHR5cGVvZiBmZXRjaD5cbiAgICApOiBQcm9taXNlPFJlc3BvbnNlPiA9PiB7XG4gICAgICBjb25zdCBbaW5wdXQsIGluaXRdID0gYXJncztcbiAgICAgIGNvbnN0IHN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cbiAgICAgIGNvbnN0IHVybCA9IHRoaXMucmVzb2x2ZVVybChpbnB1dCk7XG4gICAgICBjb25zdCBtZXRob2QgPSB0aGlzLnJlc29sdmVNZXRob2QoaW5wdXQsIGluaXQpO1xuICAgICAgY29uc3QgcmVxdWVzdEJvZHkgPSB0aGlzLnJlc29sdmVSZXF1ZXN0Qm9keShpbnB1dCwgaW5pdCwgbWV0aG9kKTtcblxuICAgICAgaWYgKHRoaXMuc2hvdWxkU2tpcFJlcXVlc3QodXJsLCBkc24sIGlucHV0LCBpbml0KSkge1xuICAgICAgICByZXR1cm4gb3JpZ2luYWxGZXRjaCguLi5hcmdzKTtcbiAgICAgIH1cblxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBvcmlnaW5hbEZldGNoKC4uLmFyZ3MpO1xuICAgICAgICBjb25zdCBkdXJhdGlvbiA9IHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnQ7XG5cbiAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA+PSB0aGlzLm9wdGlvbnMuc3RhdHVzRXJyb3JUaHJlc2hvbGQpIHtcbiAgICAgICAgICB0cmFja2VyLmNhcHR1cmVFdmVudCh7XG4gICAgICAgICAgICBraW5kOiBFVkVOVF9LSU5ELkhUVFAsXG4gICAgICAgICAgICB0eXBlOiBFVkVOVF9UWVBFLkhUVFBfRVJST1IsXG4gICAgICAgICAgICBsZXZlbDogXCJlcnJvclwiLFxuICAgICAgICAgICAgbWVzc2FnZTogYEZldGNoICR7bWV0aG9kfSAke3Jlc3BvbnNlLnN0YXR1c30gJHtyZXNwb25zZS5zdGF0dXNUZXh0fWAsXG4gICAgICAgICAgICBleHRyYToge1xuICAgICAgICAgICAgICB1cmwsXG4gICAgICAgICAgICAgIG1ldGhvZCxcbiAgICAgICAgICAgICAgc3RhdHVzOiByZXNwb25zZS5zdGF0dXMsXG4gICAgICAgICAgICAgIHN0YXR1c1RleHQ6IHJlc3BvbnNlLnN0YXR1c1RleHQsXG4gICAgICAgICAgICAgIGR1cmF0aW9uTXM6IE51bWJlcihkdXJhdGlvbi50b0ZpeGVkKDIpKSxcbiAgICAgICAgICAgICAgcmVxdWVzdERhdGE6IHJlcXVlc3RCb2R5LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yOiB1bmtub3duKSB7XG4gICAgICAgIGNvbnN0IGR1cmF0aW9uID0gcGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydDtcbiAgICAgICAgdHJhY2tlci5jYXB0dXJlRXZlbnQoe1xuICAgICAgICAgIGtpbmQ6IEVWRU5UX0tJTkQuSFRUUCxcbiAgICAgICAgICB0eXBlOiBFVkVOVF9UWVBFLkhUVFBfRVJST1IsXG4gICAgICAgICAgbGV2ZWw6IFwiZXJyb3JcIixcbiAgICAgICAgICBtZXNzYWdlOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFwiTmV0d29yayBFcnJvclwiLFxuICAgICAgICAgIGV4dHJhOiB7XG4gICAgICAgICAgICB1cmwsXG4gICAgICAgICAgICBtZXRob2QsXG4gICAgICAgICAgICBkdXJhdGlvbk1zOiBOdW1iZXIoZHVyYXRpb24udG9GaXhlZCgyKSksXG4gICAgICAgICAgICByZXF1ZXN0RGF0YTogcmVxdWVzdEJvZHksXG4gICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgICAgIHRocm93IGVycm9yO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIHJlc29sdmVVcmwoaW5wdXQ6IFJlcXVlc3RJbmZvIHwgVVJMKTogc3RyaW5nIHtcbiAgICBpZiAodHlwZW9mIGlucHV0ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICByZXR1cm4gaW5wdXQ7XG4gICAgfVxuXG4gICAgaWYgKGlucHV0IGluc3RhbmNlb2YgVVJMKSB7XG4gICAgICByZXR1cm4gaW5wdXQuaHJlZjtcbiAgICB9XG5cbiAgICByZXR1cm4gaW5wdXQudXJsO1xuICB9XG5cbiAgcHJpdmF0ZSByZXNvbHZlTWV0aG9kKFxuICAgIGlucHV0OiBSZXF1ZXN0SW5mbyB8IFVSTCxcbiAgICBpbml0PzogUmVxdWVzdEluaXQsXG4gICk6IHN0cmluZyB7XG4gICAgaWYgKGluaXQ/Lm1ldGhvZCkge1xuICAgICAgcmV0dXJuIGluaXQubWV0aG9kLnRvVXBwZXJDYXNlKCk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBSZXF1ZXN0ICE9PSBcInVuZGVmaW5lZFwiICYmIGlucHV0IGluc3RhbmNlb2YgUmVxdWVzdCkge1xuICAgICAgcmV0dXJuIGlucHV0Lm1ldGhvZC50b1VwcGVyQ2FzZSgpO1xuICAgIH1cblxuICAgIHJldHVybiBcIkdFVFwiO1xuICB9XG5cbiAgcHJpdmF0ZSByZXNvbHZlUmVxdWVzdEJvZHkoXG4gICAgaW5wdXQ6IFJlcXVlc3RJbmZvIHwgVVJMLFxuICAgIGluaXQ6IFJlcXVlc3RJbml0IHwgdW5kZWZpbmVkLFxuICAgIG1ldGhvZDogc3RyaW5nLFxuICApOiB1bmtub3duIHtcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5jYXB0dXJlUmVxdWVzdEJvZHkpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgaWYgKG1ldGhvZCA9PT0gXCJHRVRcIiB8fCBtZXRob2QgPT09IFwiSEVBRFwiKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBib2R5ID0gaW5pdD8uYm9keTtcbiAgICBpZiAoIWJvZHkgJiYgdHlwZW9mIFJlcXVlc3QgIT09IFwidW5kZWZpbmVkXCIgJiYgaW5wdXQgaW5zdGFuY2VvZiBSZXF1ZXN0KSB7XG4gICAgICByZXR1cm4gXCJbUmVxdWVzdEJvZHkgc3RyZWFtXVwiO1xuICAgIH1cblxuICAgIGlmIChib2R5IGluc3RhbmNlb2YgRm9ybURhdGEpIHtcbiAgICAgIHJldHVybiBcIltGb3JtRGF0YV1cIjtcbiAgICB9XG5cbiAgICBpZiAoYm9keSBpbnN0YW5jZW9mIEJsb2IpIHtcbiAgICAgIHJldHVybiBcIltCbG9iXVwiO1xuICAgIH1cblxuICAgIHJldHVybiBib2R5ID8/IG51bGw7XG4gIH1cblxuICBwcml2YXRlIHNob3VsZFNraXBSZXF1ZXN0KFxuICAgIHVybDogc3RyaW5nLFxuICAgIGRzbjogc3RyaW5nLFxuICAgIGlucHV0OiBSZXF1ZXN0SW5mbyB8IFVSTCxcbiAgICBpbml0PzogUmVxdWVzdEluaXQsXG4gICk6IGJvb2xlYW4ge1xuICAgIGlmICh1cmwuaW5jbHVkZXMoZHNuKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5pZ25vcmVVcmxzLnNvbWUoKHJ1bGUpID0+IHRoaXMubWF0Y2hlc1VybFJ1bGUodXJsLCBydWxlKSkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGluamVjdGVkSGVhZGVyID0gdGhpcy5leHRyYWN0SGVhZGVyKFwiWC1TREstSW5qZWN0ZWRcIiwgaW5pdD8uaGVhZGVycyk7XG4gICAgaWYgKGluamVjdGVkSGVhZGVyKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIFJlcXVlc3QgIT09IFwidW5kZWZpbmVkXCIgJiYgaW5wdXQgaW5zdGFuY2VvZiBSZXF1ZXN0KSB7XG4gICAgICBjb25zdCByZXF1ZXN0SW5qZWN0ZWRIZWFkZXIgPSBpbnB1dC5oZWFkZXJzLmdldChcIlgtU0RLLUluamVjdGVkXCIpO1xuICAgICAgaWYgKHJlcXVlc3RJbmplY3RlZEhlYWRlcikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIGV4dHJhY3RIZWFkZXIoXG4gICAga2V5OiBzdHJpbmcsXG4gICAgaGVhZGVycz86IEhlYWRlcnNJbml0LFxuICApOiBzdHJpbmcgfCBudWxsIHtcbiAgICBpZiAoIWhlYWRlcnMpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmIChoZWFkZXJzIGluc3RhbmNlb2YgSGVhZGVycykge1xuICAgICAgcmV0dXJuIGhlYWRlcnMuZ2V0KGtleSk7XG4gICAgfVxuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoaGVhZGVycykpIHtcbiAgICAgIGNvbnN0IG1hdGNoID0gaGVhZGVycy5maW5kKChbaGVhZGVyS2V5XSkgPT5cbiAgICAgICAgaGVhZGVyS2V5LnRvTG93ZXJDYXNlKCkgPT09IGtleS50b0xvd2VyQ2FzZSgpLFxuICAgICAgKTtcbiAgICAgIHJldHVybiBtYXRjaCA/IG1hdGNoWzFdIDogbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkZXJSZWNvcmQgPSBoZWFkZXJzIGFzIFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gICAgY29uc3QgbWF0Y2hlZEtleSA9IE9iamVjdC5rZXlzKGhlYWRlclJlY29yZCkuZmluZChcbiAgICAgIChoZWFkZXJLZXkpID0+IGhlYWRlcktleS50b0xvd2VyQ2FzZSgpID09PSBrZXkudG9Mb3dlckNhc2UoKSxcbiAgICApO1xuXG4gICAgcmV0dXJuIG1hdGNoZWRLZXkgPyBoZWFkZXJSZWNvcmRbbWF0Y2hlZEtleV0gOiBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBtYXRjaGVzVXJsUnVsZSh1cmw6IHN0cmluZywgcnVsZTogc3RyaW5nIHwgUmVnRXhwKTogYm9vbGVhbiB7XG4gICAgaWYgKHR5cGVvZiBydWxlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICByZXR1cm4gdXJsLmluY2x1ZGVzKHJ1bGUpO1xuICAgIH1cblxuICAgIHJldHVybiBydWxlLnRlc3QodXJsKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgQmFzZUludGVncmF0aW9uIH0gZnJvbSBcIi4uL2NvcmUvQmFzZUludGVncmF0aW9uXCI7XG5pbXBvcnQgeyBFVkVOVF9LSU5ELCBFVkVOVF9UWVBFIH0gZnJvbSBcIi4uL2NvcmUvdHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgVHJhY2tlckluc3RhbmNlIH0gZnJvbSBcIi4uL2NvcmUvdHlwZXNcIjtcblxuLyoqXG4gKiBYaHJJbnRlZ3JhdGlvbiDphY3nva7pobnjgIJcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBYaHJJbnRlZ3JhdGlvbk9wdGlvbnMge1xuICAvKiog5piv5ZCm5ZCv55SoIFhNTEh0dHBSZXF1ZXN0IOivt+axguaLpuaIquOAgkBkZWZhdWx0IHRydWUgKi9cbiAgZW5hYmxlZD86IGJvb2xlYW47XG4gIC8qKiDlsIbnirbmgIHnoIHlpKfkuo7nrYnkuo7or6XpmIjlgLznmoTlk43lupTop4bkuLrplJnor6/jgIJAZGVmYXVsdCA0MDAgKi9cbiAgc3RhdHVzRXJyb3JUaHJlc2hvbGQ/OiBudW1iZXI7XG4gIC8qKiDmmK/lkKblnKggYGV4dHJhLnJlcXVlc3REYXRhYCDkuK3pmYTluKbor7fmsYLkvZPjgIJAZGVmYXVsdCB0cnVlICovXG4gIGNhcHR1cmVSZXF1ZXN0Qm9keT86IGJvb2xlYW47XG4gIC8qKiDljLnphY3or6Xop4TliJnnmoQgVVJMIOWwhui3s+i/h+mHh+mbhuOAguaUr+aMgeWtl+espuS4suaIluato+WImeOAgiAqL1xuICBpZ25vcmVVcmxzPzogQXJyYXk8c3RyaW5nIHwgUmVnRXhwPjtcbn1cblxudHlwZSBSZXNvbHZlZFhockludGVncmF0aW9uT3B0aW9ucyA9IFJlcXVpcmVkPFxuICBPbWl0PFhockludGVncmF0aW9uT3B0aW9ucywgXCJpZ25vcmVVcmxzXCI+XG4+ICYge1xuICBpZ25vcmVVcmxzOiBBcnJheTxzdHJpbmcgfCBSZWdFeHA+O1xufTtcblxuY29uc3QgcmVzb2x2ZVhockludGVncmF0aW9uT3B0aW9ucyA9IChcbiAgb3B0aW9uczogWGhySW50ZWdyYXRpb25PcHRpb25zID0ge30sXG4pOiBSZXNvbHZlZFhockludGVncmF0aW9uT3B0aW9ucyA9PiB7XG4gIHJldHVybiB7XG4gICAgZW5hYmxlZDogb3B0aW9ucy5lbmFibGVkID8/IHRydWUsXG4gICAgc3RhdHVzRXJyb3JUaHJlc2hvbGQ6IG9wdGlvbnMuc3RhdHVzRXJyb3JUaHJlc2hvbGQgPz8gNDAwLFxuICAgIGNhcHR1cmVSZXF1ZXN0Qm9keTogb3B0aW9ucy5jYXB0dXJlUmVxdWVzdEJvZHkgPz8gdHJ1ZSxcbiAgICBpZ25vcmVVcmxzOiBvcHRpb25zLmlnbm9yZVVybHMgPz8gW10sXG4gIH07XG59O1xuXG50eXBlIFhock1ldGFkYXRhID0ge1xuICBtZXRob2Q6IHN0cmluZztcbiAgdXJsOiBzdHJpbmc7XG4gIHN0YXJ0OiBudW1iZXI7XG4gIHJlcXVlc3REYXRhPzogdW5rbm93bjtcbn07XG5cbmV4cG9ydCBjbGFzcyBYaHJJbnRlZ3JhdGlvbiBleHRlbmRzIEJhc2VJbnRlZ3JhdGlvbiB7XG4gIHB1YmxpYyByZWFkb25seSBuYW1lID0gXCJYaHJJbnRlZ3JhdGlvblwiO1xuICBwcml2YXRlIHJlYWRvbmx5IG9wdGlvbnM6IFJlc29sdmVkWGhySW50ZWdyYXRpb25PcHRpb25zO1xuXG4gIC8qKlxuICAgKiBAcGFyYW0gb3B0aW9ucyBYTUxIdHRwUmVxdWVzdCDor7fmsYLph4fpm4bphY3nva7jgIJcbiAgICovXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IFhockludGVncmF0aW9uT3B0aW9ucyA9IHt9KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLm9wdGlvbnMgPSByZXNvbHZlWGhySW50ZWdyYXRpb25PcHRpb25zKG9wdGlvbnMpO1xuICB9XG5cbiAgcHJvdGVjdGVkIHNldHVwQ29yZSh0cmFja2VyOiBUcmFja2VySW5zdGFuY2UpIHtcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5lbmFibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBYTUxIdHRwUmVxdWVzdCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuaW5zdHJ1bWVudFhocih0cmFja2VyKTtcbiAgfVxuXG4gIHByaXZhdGUgaW5zdHJ1bWVudFhocih0cmFja2VyOiBUcmFja2VySW5zdGFuY2UpIHtcbiAgICBjb25zdCBpbnRlZ3JhdGlvbiA9IHRoaXM7XG4gICAgY29uc3Qgb3JpZ2luYWxPcGVuID0gWE1MSHR0cFJlcXVlc3QucHJvdG90eXBlLm9wZW47XG4gICAgY29uc3Qgb3JpZ2luYWxTZW5kID0gWE1MSHR0cFJlcXVlc3QucHJvdG90eXBlLnNlbmQ7XG4gICAgY29uc3QgZHNuID0gdHJhY2tlci5nZXREc24oKTtcblxuICAgIFhNTEh0dHBSZXF1ZXN0LnByb3RvdHlwZS5vcGVuID0gZnVuY3Rpb24gKFxuICAgICAgbWV0aG9kOiBzdHJpbmcsXG4gICAgICB1cmw6IHN0cmluZyB8IFVSTCxcbiAgICAgIC4uLmFyZ3M6IHVua25vd25bXVxuICAgICkge1xuICAgICAgY29uc3QgeGhyID0gdGhpcyBhcyBYTUxIdHRwUmVxdWVzdCAmIHtcbiAgICAgICAgX21vbml0b3JNZXRhZGF0YT86IFhock1ldGFkYXRhO1xuICAgICAgfTtcblxuICAgICAgeGhyLl9tb25pdG9yTWV0YWRhdGEgPSB7XG4gICAgICAgIG1ldGhvZDogbWV0aG9kLnRvVXBwZXJDYXNlKCksXG4gICAgICAgIHVybDogdXJsLnRvU3RyaW5nKCksXG4gICAgICAgIHN0YXJ0OiBwZXJmb3JtYW5jZS5ub3coKSxcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBvcmlnaW5hbE9wZW4uYXBwbHkodGhpcywgW21ldGhvZCwgdXJsLCAuLi5hcmdzXSBhcyBhbnkpO1xuICAgIH07XG5cbiAgICBYTUxIdHRwUmVxdWVzdC5wcm90b3R5cGUuc2VuZCA9IGZ1bmN0aW9uIChib2R5PzogRG9jdW1lbnQgfCBYTUxIdHRwUmVxdWVzdEJvZHlJbml0IHwgbnVsbCkge1xuICAgICAgY29uc3QgeGhyID0gdGhpcyBhcyBYTUxIdHRwUmVxdWVzdCAmIHtcbiAgICAgICAgX21vbml0b3JNZXRhZGF0YT86IFhock1ldGFkYXRhO1xuICAgICAgfTtcblxuICAgICAgY29uc3QgbWV0YWRhdGEgPSB4aHIuX21vbml0b3JNZXRhZGF0YTtcbiAgICAgIGlmIChtZXRhZGF0YSkge1xuICAgICAgICBtZXRhZGF0YS5yZXF1ZXN0RGF0YSA9IGludGVncmF0aW9uLm9wdGlvbnMuY2FwdHVyZVJlcXVlc3RCb2R5XG4gICAgICAgICAgPyAoYm9keSA/PyBudWxsKVxuICAgICAgICAgIDogdW5kZWZpbmVkO1xuICAgICAgfVxuXG4gICAgICBpZiAobWV0YWRhdGEgJiYgaW50ZWdyYXRpb24uc2hvdWxkU2tpcFVybChtZXRhZGF0YS51cmwsIGRzbikpIHtcbiAgICAgICAgcmV0dXJuIG9yaWdpbmFsU2VuZC5hcHBseSh0aGlzLCBbYm9keV0gYXMgYW55KTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKFwibG9hZGVuZFwiLCAoKSA9PiB7XG4gICAgICAgIGlmICghbWV0YWRhdGEpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkdXJhdGlvbiA9IHBlcmZvcm1hbmNlLm5vdygpIC0gbWV0YWRhdGEuc3RhcnQ7XG4gICAgICAgIGNvbnN0IHN0YXR1cyA9IHRoaXMuc3RhdHVzO1xuXG4gICAgICAgIGlmIChcbiAgICAgICAgICBzdGF0dXMgPT09IDAgfHxcbiAgICAgICAgICBzdGF0dXMgPj0gaW50ZWdyYXRpb24ub3B0aW9ucy5zdGF0dXNFcnJvclRocmVzaG9sZFxuICAgICAgICApIHtcbiAgICAgICAgICB0cmFja2VyLmNhcHR1cmVFdmVudCh7XG4gICAgICAgICAgICBraW5kOiBFVkVOVF9LSU5ELkhUVFAsXG4gICAgICAgICAgICB0eXBlOiBFVkVOVF9UWVBFLkhUVFBfRVJST1IsXG4gICAgICAgICAgICBsZXZlbDogXCJlcnJvclwiLFxuICAgICAgICAgICAgbWVzc2FnZTogYFhIUiAke21ldGFkYXRhLm1ldGhvZH0gJHtzdGF0dXMgfHwgXCJGYWlsZWRcIn1gLFxuICAgICAgICAgICAgZXh0cmE6IHtcbiAgICAgICAgICAgICAgdXJsOiBtZXRhZGF0YS51cmwsXG4gICAgICAgICAgICAgIG1ldGhvZDogbWV0YWRhdGEubWV0aG9kLFxuICAgICAgICAgICAgICBzdGF0dXMsXG4gICAgICAgICAgICAgIGR1cmF0aW9uTXM6IE51bWJlcihkdXJhdGlvbi50b0ZpeGVkKDIpKSxcbiAgICAgICAgICAgICAgcmVxdWVzdERhdGE6IG1ldGFkYXRhLnJlcXVlc3REYXRhLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBvcmlnaW5hbFNlbmQuYXBwbHkodGhpcywgW2JvZHldIGFzIGFueSk7XG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgc2hvdWxkU2tpcFVybCh1cmw6IHN0cmluZywgZHNuOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBpZiAodXJsLmluY2x1ZGVzKGRzbikpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLm9wdGlvbnMuaWdub3JlVXJscy5zb21lKChydWxlKSA9PiB0aGlzLm1hdGNoZXNVcmxSdWxlKHVybCwgcnVsZSkpO1xuICB9XG5cbiAgcHJpdmF0ZSBtYXRjaGVzVXJsUnVsZSh1cmw6IHN0cmluZywgcnVsZTogc3RyaW5nIHwgUmVnRXhwKTogYm9vbGVhbiB7XG4gICAgaWYgKHR5cGVvZiBydWxlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICByZXR1cm4gdXJsLmluY2x1ZGVzKHJ1bGUpO1xuICAgIH1cblxuICAgIHJldHVybiBydWxlLnRlc3QodXJsKTtcbiAgfVxufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIGdldFBhZ2VVcmwoKTogc3RyaW5nIHtcclxuICAvLyDojrflj5bot6jnjq/looPnmoTpobbnuqflhajlsYDlr7nosaFcclxuICBjb25zdCBnbG9iYWxPYmogPSB0eXBlb2YgZ2xvYmFsVGhpcyAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWxUaGlzIDogc2VsZjtcclxuXHJcbiAgLy8g5L2/55SoIChnbG9iYWxPYmogYXMgYW55KSDnu5Xov4cgVFMg55qE5Lil5qC85qOA5p+lXHJcbiAgaWYgKHR5cGVvZiAoZ2xvYmFsT2JqIGFzIGFueSkud3ggIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiAoZ2xvYmFsT2JqIGFzIGFueSkuZ2V0Q3VycmVudFBhZ2VzID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBwYWdlcyA9IChnbG9iYWxPYmogYXMgYW55KS5nZXRDdXJyZW50UGFnZXMoKTtcclxuICAgICAgcmV0dXJuIHBhZ2VzLmxlbmd0aCA/IHBhZ2VzW3BhZ2VzLmxlbmd0aCAtIDFdLnJvdXRlIDogJ2FwcF9sYXVuY2gnO1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICByZXR1cm4gJ3Vua25vd25fd3hfcm91dGUnO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8g5rWP6KeI5Zmo5YWc5bqVXHJcbiAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5sb2NhdGlvbikge1xyXG4gICAgcmV0dXJuIHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuICd1bmtub3duX2Vudmlyb25tZW50JztcclxufSIsImxldCBlPS0xO2NvbnN0IHQ9dD0+e2FkZEV2ZW50TGlzdGVuZXIoXCJwYWdlc2hvd1wiLChuPT57bi5wZXJzaXN0ZWQmJihlPW4udGltZVN0YW1wLHQobikpfSksITApfSxuPShlLHQsbixpKT0+e2xldCBzLG87cmV0dXJuIHI9Pnt0LnZhbHVlPj0wJiYocnx8aSkmJihvPXQudmFsdWUtKHM/PzApLChvfHx2b2lkIDA9PT1zKSYmKHM9dC52YWx1ZSx0LmRlbHRhPW8sdC5yYXRpbmc9KChlLHQpPT5lPnRbMV0/XCJwb29yXCI6ZT50WzBdP1wibmVlZHMtaW1wcm92ZW1lbnRcIjpcImdvb2RcIikodC52YWx1ZSxuKSxlKHQpKSl9fSxpPWU9PntyZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCgpPT5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCgpPT5lKCkpKSkpfSxzPSgpPT57Y29uc3QgZT1wZXJmb3JtYW5jZS5nZXRFbnRyaWVzQnlUeXBlKFwibmF2aWdhdGlvblwiKVswXTtpZihlJiZlLnJlc3BvbnNlU3RhcnQ+MCYmZS5yZXNwb25zZVN0YXJ0PHBlcmZvcm1hbmNlLm5vdygpKXJldHVybiBlfSxvPSgpPT57Y29uc3QgZT1zKCk7cmV0dXJuIGU/LmFjdGl2YXRpb25TdGFydD8/MH0scj0odCxuPS0xKT0+e2NvbnN0IGk9cygpO2xldCByPVwibmF2aWdhdGVcIjtlPj0wP3I9XCJiYWNrLWZvcndhcmQtY2FjaGVcIjppJiYoZG9jdW1lbnQucHJlcmVuZGVyaW5nfHxvKCk+MD9yPVwicHJlcmVuZGVyXCI6ZG9jdW1lbnQud2FzRGlzY2FyZGVkP3I9XCJyZXN0b3JlXCI6aS50eXBlJiYocj1pLnR5cGUucmVwbGFjZSgvXy9nLFwiLVwiKSkpO3JldHVybntuYW1lOnQsdmFsdWU6bixyYXRpbmc6XCJnb29kXCIsZGVsdGE6MCxlbnRyaWVzOltdLGlkOmB2NS0ke0RhdGUubm93KCl9LSR7TWF0aC5mbG9vcig4OTk5OTk5OTk5OTk5Kk1hdGgucmFuZG9tKCkpKzFlMTJ9YCxuYXZpZ2F0aW9uVHlwZTpyfX0sYz1uZXcgV2Vha01hcDtmdW5jdGlvbiBhKGUsdCl7cmV0dXJuIGMuZ2V0KGUpfHxjLnNldChlLG5ldyB0KSxjLmdldChlKX1jbGFzcyBke3Q7aT0wO289W107aChlKXtpZihlLmhhZFJlY2VudElucHV0KXJldHVybjtjb25zdCB0PXRoaXMub1swXSxuPXRoaXMuby5hdCgtMSk7dGhpcy5pJiZ0JiZuJiZlLnN0YXJ0VGltZS1uLnN0YXJ0VGltZTwxZTMmJmUuc3RhcnRUaW1lLXQuc3RhcnRUaW1lPDVlMz8odGhpcy5pKz1lLnZhbHVlLHRoaXMuby5wdXNoKGUpKToodGhpcy5pPWUudmFsdWUsdGhpcy5vPVtlXSksdGhpcy50Py4oZSl9fWNvbnN0IGg9KGUsdCxuPXt9KT0+e3RyeXtpZihQZXJmb3JtYW5jZU9ic2VydmVyLnN1cHBvcnRlZEVudHJ5VHlwZXMuaW5jbHVkZXMoZSkpe2NvbnN0IGk9bmV3IFBlcmZvcm1hbmNlT2JzZXJ2ZXIoKGU9PntQcm9taXNlLnJlc29sdmUoKS50aGVuKCgoKT0+e3QoZS5nZXRFbnRyaWVzKCkpfSkpfSkpO3JldHVybiBpLm9ic2VydmUoe3R5cGU6ZSxidWZmZXJlZDohMCwuLi5ufSksaX19Y2F0Y2h7fX0sZj1lPT57bGV0IHQ9ITE7cmV0dXJuKCk9Pnt0fHwoZSgpLHQ9ITApfX07bGV0IHU9LTE7Y29uc3QgbD1uZXcgU2V0LG09KCk9PlwiaGlkZGVuXCIhPT1kb2N1bWVudC52aXNpYmlsaXR5U3RhdGV8fGRvY3VtZW50LnByZXJlbmRlcmluZz8xLzA6MCxwPWU9PntpZihcImhpZGRlblwiPT09ZG9jdW1lbnQudmlzaWJpbGl0eVN0YXRlKXtpZihcInZpc2liaWxpdHljaGFuZ2VcIj09PWUudHlwZSlmb3IoY29uc3QgZSBvZiBsKWUoKTtpc0Zpbml0ZSh1KXx8KHU9XCJ2aXNpYmlsaXR5Y2hhbmdlXCI9PT1lLnR5cGU/ZS50aW1lU3RhbXA6MCxyZW1vdmVFdmVudExpc3RlbmVyKFwicHJlcmVuZGVyaW5nY2hhbmdlXCIscCwhMCkpfX0sdj0oKT0+e2lmKHU8MCl7Y29uc3QgZT1vKCksbj1kb2N1bWVudC5wcmVyZW5kZXJpbmc/dm9pZCAwOmdsb2JhbFRoaXMucGVyZm9ybWFuY2UuZ2V0RW50cmllc0J5VHlwZShcInZpc2liaWxpdHktc3RhdGVcIikuZmlsdGVyKCh0PT5cImhpZGRlblwiPT09dC5uYW1lJiZ0LnN0YXJ0VGltZT5lKSlbMF0/LnN0YXJ0VGltZTt1PW4/P20oKSxhZGRFdmVudExpc3RlbmVyKFwidmlzaWJpbGl0eWNoYW5nZVwiLHAsITApLGFkZEV2ZW50TGlzdGVuZXIoXCJwcmVyZW5kZXJpbmdjaGFuZ2VcIixwLCEwKSx0KCgoKT0+e3NldFRpbWVvdXQoKCgpPT57dT1tKCl9KSl9KSl9cmV0dXJue2dldCBmaXJzdEhpZGRlblRpbWUoKXtyZXR1cm4gdX0sb25IaWRkZW4oZSl7bC5hZGQoZSl9fX0sZz1lPT57ZG9jdW1lbnQucHJlcmVuZGVyaW5nP2FkZEV2ZW50TGlzdGVuZXIoXCJwcmVyZW5kZXJpbmdjaGFuZ2VcIiwoKCk9PmUoKSksITApOmUoKX0seT1bMTgwMCwzZTNdLEU9KGUscz17fSk9PntnKCgoKT0+e2NvbnN0IGM9digpO2xldCBhLGQ9cihcIkZDUFwiKTtjb25zdCBmPWgoXCJwYWludFwiLChlPT57Zm9yKGNvbnN0IHQgb2YgZSlcImZpcnN0LWNvbnRlbnRmdWwtcGFpbnRcIj09PXQubmFtZSYmKGYuZGlzY29ubmVjdCgpLHQuc3RhcnRUaW1lPGMuZmlyc3RIaWRkZW5UaW1lJiYoZC52YWx1ZT1NYXRoLm1heCh0LnN0YXJ0VGltZS1vKCksMCksZC5lbnRyaWVzLnB1c2godCksYSghMCkpKX0pKTtmJiYoYT1uKGUsZCx5LHMucmVwb3J0QWxsQ2hhbmdlcyksdCgodD0+e2Q9cihcIkZDUFwiKSxhPW4oZSxkLHkscy5yZXBvcnRBbGxDaGFuZ2VzKSxpKCgoKT0+e2QudmFsdWU9cGVyZm9ybWFuY2Uubm93KCktdC50aW1lU3RhbXAsYSghMCl9KSl9KSkpfSkpfSxiPVsuMSwuMjVdLEw9KGUscz17fSk9Pntjb25zdCBvPXYoKTtFKGYoKCgpPT57bGV0IGMsZj1yKFwiQ0xTXCIsMCk7Y29uc3QgdT1hKHMsZCksbD1lPT57Zm9yKGNvbnN0IHQgb2YgZSl1LmgodCk7dS5pPmYudmFsdWUmJihmLnZhbHVlPXUuaSxmLmVudHJpZXM9dS5vLGMoKSl9LG09aChcImxheW91dC1zaGlmdFwiLGwpO20mJihjPW4oZSxmLGIscy5yZXBvcnRBbGxDaGFuZ2VzKSxvLm9uSGlkZGVuKCgoKT0+e2wobS50YWtlUmVjb3JkcygpKSxjKCEwKX0pKSx0KCgoKT0+e3UuaT0wLGY9cihcIkNMU1wiLDApLGM9bihlLGYsYixzLnJlcG9ydEFsbENoYW5nZXMpLGkoKCgpPT5jKCkpKX0pKSxzZXRUaW1lb3V0KGMpKX0pKSl9O2xldCBQPTAsVD0xLzAsXz0wO2NvbnN0IE09ZT0+e2Zvcihjb25zdCB0IG9mIGUpdC5pbnRlcmFjdGlvbklkJiYoVD1NYXRoLm1pbihULHQuaW50ZXJhY3Rpb25JZCksXz1NYXRoLm1heChfLHQuaW50ZXJhY3Rpb25JZCksUD1fPyhfLVQpLzcrMTowKX07bGV0IHc7Y29uc3QgQz0oKT0+dz9QOnBlcmZvcm1hbmNlLmludGVyYWN0aW9uQ291bnQ/PzAsST0oKT0+e1wiaW50ZXJhY3Rpb25Db3VudFwiaW4gcGVyZm9ybWFuY2V8fHd8fCh3PWgoXCJldmVudFwiLE0se3R5cGU6XCJldmVudFwiLGJ1ZmZlcmVkOiEwLGR1cmF0aW9uVGhyZXNob2xkOjB9KSl9O2xldCBGPTA7Y2xhc3Mga3t1PVtdO2w9bmV3IE1hcDttO3A7digpe0Y9QygpLHRoaXMudS5sZW5ndGg9MCx0aGlzLmwuY2xlYXIoKX1MKCl7Y29uc3QgZT1NYXRoLm1pbih0aGlzLnUubGVuZ3RoLTEsTWF0aC5mbG9vcigoQygpLUYpLzUwKSk7cmV0dXJuIHRoaXMudVtlXX1oKGUpe2lmKHRoaXMubT8uKGUpLCFlLmludGVyYWN0aW9uSWQmJlwiZmlyc3QtaW5wdXRcIiE9PWUuZW50cnlUeXBlKXJldHVybjtjb25zdCB0PXRoaXMudS5hdCgtMSk7bGV0IG49dGhpcy5sLmdldChlLmludGVyYWN0aW9uSWQpO2lmKG58fHRoaXMudS5sZW5ndGg8MTB8fGUuZHVyYXRpb24+dC5QKXtpZihuP2UuZHVyYXRpb24+bi5QPyhuLmVudHJpZXM9W2VdLG4uUD1lLmR1cmF0aW9uKTplLmR1cmF0aW9uPT09bi5QJiZlLnN0YXJ0VGltZT09PW4uZW50cmllc1swXS5zdGFydFRpbWUmJm4uZW50cmllcy5wdXNoKGUpOihuPXtpZDplLmludGVyYWN0aW9uSWQsZW50cmllczpbZV0sUDplLmR1cmF0aW9ufSx0aGlzLmwuc2V0KG4uaWQsbiksdGhpcy51LnB1c2gobikpLHRoaXMudS5zb3J0KCgoZSx0KT0+dC5QLWUuUCkpLHRoaXMudS5sZW5ndGg+MTApe2NvbnN0IGU9dGhpcy51LnNwbGljZSgxMCk7Zm9yKGNvbnN0IHQgb2YgZSl0aGlzLmwuZGVsZXRlKHQuaWQpfXRoaXMucD8uKG4pfX19Y29uc3QgQT1lPT57Y29uc3QgdD1nbG9iYWxUaGlzLnJlcXVlc3RJZGxlQ2FsbGJhY2t8fHNldFRpbWVvdXQ7XCJoaWRkZW5cIj09PWRvY3VtZW50LnZpc2liaWxpdHlTdGF0ZT9lKCk6KGU9ZihlKSxhZGRFdmVudExpc3RlbmVyKFwidmlzaWJpbGl0eWNoYW5nZVwiLGUse29uY2U6ITAsY2FwdHVyZTohMH0pLHQoKCgpPT57ZSgpLHJlbW92ZUV2ZW50TGlzdGVuZXIoXCJ2aXNpYmlsaXR5Y2hhbmdlXCIsZSx7Y2FwdHVyZTohMH0pfSkpKX0sQj1bMjAwLDUwMF0sUz0oZSxpPXt9KT0+e2lmKCFnbG9iYWxUaGlzLlBlcmZvcm1hbmNlRXZlbnRUaW1pbmd8fCEoXCJpbnRlcmFjdGlvbklkXCJpbiBQZXJmb3JtYW5jZUV2ZW50VGltaW5nLnByb3RvdHlwZSkpcmV0dXJuO2NvbnN0IHM9digpO2coKCgpPT57SSgpO2xldCBvLGM9cihcIklOUFwiKTtjb25zdCBkPWEoaSxrKSxmPWU9PntBKCgoKT0+e2Zvcihjb25zdCB0IG9mIGUpZC5oKHQpO2NvbnN0IHQ9ZC5MKCk7dCYmdC5QIT09Yy52YWx1ZSYmKGMudmFsdWU9dC5QLGMuZW50cmllcz10LmVudHJpZXMsbygpKX0pKX0sdT1oKFwiZXZlbnRcIixmLHtkdXJhdGlvblRocmVzaG9sZDppLmR1cmF0aW9uVGhyZXNob2xkPz80MH0pO289bihlLGMsQixpLnJlcG9ydEFsbENoYW5nZXMpLHUmJih1Lm9ic2VydmUoe3R5cGU6XCJmaXJzdC1pbnB1dFwiLGJ1ZmZlcmVkOiEwfSkscy5vbkhpZGRlbigoKCk9PntmKHUudGFrZVJlY29yZHMoKSksbyghMCl9KSksdCgoKCk9PntkLnYoKSxjPXIoXCJJTlBcIiksbz1uKGUsYyxCLGkucmVwb3J0QWxsQ2hhbmdlcyl9KSkpfSkpfTtjbGFzcyBOe207aChlKXt0aGlzLm0/LihlKX19Y29uc3QgcT1bMjUwMCw0ZTNdLHg9KGUscz17fSk9PntnKCgoKT0+e2NvbnN0IGM9digpO2xldCBkLHU9cihcIkxDUFwiKTtjb25zdCBsPWEocyxOKSxtPWU9PntzLnJlcG9ydEFsbENoYW5nZXN8fChlPWUuc2xpY2UoLTEpKTtmb3IoY29uc3QgdCBvZiBlKWwuaCh0KSx0LnN0YXJ0VGltZTxjLmZpcnN0SGlkZGVuVGltZSYmKHUudmFsdWU9TWF0aC5tYXgodC5zdGFydFRpbWUtbygpLDApLHUuZW50cmllcz1bdF0sZCgpKX0scD1oKFwibGFyZ2VzdC1jb250ZW50ZnVsLXBhaW50XCIsbSk7aWYocCl7ZD1uKGUsdSxxLHMucmVwb3J0QWxsQ2hhbmdlcyk7Y29uc3Qgbz1mKCgoKT0+e20ocC50YWtlUmVjb3JkcygpKSxwLmRpc2Nvbm5lY3QoKSxkKCEwKX0pKSxjPWU9PntlLmlzVHJ1c3RlZCYmKEEobykscmVtb3ZlRXZlbnRMaXN0ZW5lcihlLnR5cGUsYyx7Y2FwdHVyZTohMH0pKX07Zm9yKGNvbnN0IGUgb2ZbXCJrZXlkb3duXCIsXCJjbGlja1wiLFwidmlzaWJpbGl0eWNoYW5nZVwiXSlhZGRFdmVudExpc3RlbmVyKGUsYyx7Y2FwdHVyZTohMH0pO3QoKHQ9Pnt1PXIoXCJMQ1BcIiksZD1uKGUsdSxxLHMucmVwb3J0QWxsQ2hhbmdlcyksaSgoKCk9Pnt1LnZhbHVlPXBlcmZvcm1hbmNlLm5vdygpLXQudGltZVN0YW1wLGQoITApfSkpfSkpfX0pKX0sSD1bODAwLDE4MDBdLE89ZT0+e2RvY3VtZW50LnByZXJlbmRlcmluZz9nKCgoKT0+TyhlKSkpOlwiY29tcGxldGVcIiE9PWRvY3VtZW50LnJlYWR5U3RhdGU/YWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwoKCk9Pk8oZSkpLCEwKTpzZXRUaW1lb3V0KGUpfSwkPShlLGk9e30pPT57bGV0IGM9cihcIlRURkJcIiksYT1uKGUsYyxILGkucmVwb3J0QWxsQ2hhbmdlcyk7TygoKCk9Pntjb25zdCBkPXMoKTtkJiYoYy52YWx1ZT1NYXRoLm1heChkLnJlc3BvbnNlU3RhcnQtbygpLDApLGMuZW50cmllcz1bZF0sYSghMCksdCgoKCk9PntjPXIoXCJUVEZCXCIsMCksYT1uKGUsYyxILGkucmVwb3J0QWxsQ2hhbmdlcyksYSghMCl9KSkpfSkpfTtleHBvcnR7YiBhcyBDTFNUaHJlc2hvbGRzLHkgYXMgRkNQVGhyZXNob2xkcyxCIGFzIElOUFRocmVzaG9sZHMscSBhcyBMQ1BUaHJlc2hvbGRzLEggYXMgVFRGQlRocmVzaG9sZHMsTCBhcyBvbkNMUyxFIGFzIG9uRkNQLFMgYXMgb25JTlAseCBhcyBvbkxDUCwkIGFzIG9uVFRGQn07XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdGlmICghKG1vZHVsZUlkIGluIF9fd2VicGFja19tb2R1bGVzX18pKSB7XG5cdFx0ZGVsZXRlIF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdFx0dmFyIGUgPSBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiICsgbW9kdWxlSWQgKyBcIidcIik7XG5cdFx0ZS5jb2RlID0gJ01PRFVMRV9OT1RfRk9VTkQnO1xuXHRcdHRocm93IGU7XG5cdH1cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiaW1wb3J0IHsgTW9uaXRvclNESyB9IGZyb20gXCIuL2NvcmUvY29yZVwiO1xuaW1wb3J0IHsgQnJvd3NlckludGVncmF0aW9uLCBkZWZpbmVCcm93c2VySW50ZWdyYXRpb25PcHRpb25zIH0gZnJvbSBcIi4vaW50ZXJncmF0aW9ucy9icm93c2VyXCI7XG5pbXBvcnQgeyBGZXRjaEludGVncmF0aW9uIH0gZnJvbSBcIi4vaW50ZXJncmF0aW9ucy9mZXRjaFwiO1xuaW1wb3J0IHsgWGhySW50ZWdyYXRpb24gfSBmcm9tIFwiLi9pbnRlcmdyYXRpb25zL3hoclwiO1xuXG5jb25zdCBtb25pdG9yID0gbmV3IE1vbml0b3JTREsoe1xuICBkc246IFwiaHR0cDovLzE3Mi4xOC4yMS4xNTAvZGVuZ2NodWFuL3NlcnZlL2xvZ2luXCIsXG4gIGludGVncmF0aW9uczogW1xuICAgIG5ldyBCcm93c2VySW50ZWdyYXRpb24oXG4gICAgICBkZWZpbmVCcm93c2VySW50ZWdyYXRpb25PcHRpb25zKHtcbiAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgZXJyb3JzOiB7fSxcbiAgICAgICAgdml0YWxzOiB7fSxcbiAgICAgIH0pLFxuICAgICksXG4gICAgbmV3IEZldGNoSW50ZWdyYXRpb24oKSxcbiAgICBuZXcgWGhySW50ZWdyYXRpb24oKSxcbiAgXSxcbn0pO1xuXG4vLyBtb25pdG9yLmNhcHR1cmVNZXNzYWdlKFwiTW9uaXRvciBTREsgaW5pdGlhbGl6ZWRcIiwgeyBtb2R1bGU6IFwiYm9vdHN0cmFwXCIgfSk7XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=