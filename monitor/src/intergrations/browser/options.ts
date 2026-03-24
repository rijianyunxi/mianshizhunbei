/**
 * 浏览器全局错误采集配置。
 */
export interface BrowserErrorCollectionOptions {
  /** 是否启用该模块下全部错误监听。@default true */
  enabled?: boolean;
  /** 是否采集 `window.onerror` 产生的 JS 运行时错误。@default true */
  jsError?: boolean;
  /** 是否采集静态资源加载错误（img/script/link）。@default true */
  resourceError?: boolean;
  /** 是否采集未处理的 Promise 拒绝。@default true */
  unhandledRejection?: boolean;
}

/**
 * 基于 `web-vitals` 的性能指标采集配置。
 */
export interface BrowserVitalsCollectionOptions {
  /** 是否启用该模块下全部 vitals 监听。@default true */
  enabled?: boolean;
  /** 是否上报每一次指标变化（否则只上报稳定/最终值）。@default false */
  reportAllChanges?: boolean;
  /** 是否采集 FCP（首次内容绘制）。@default true */
  fcp?: boolean;
  /** 是否采集 LCP（最大内容绘制）。@default true */
  lcp?: boolean;
  /** 是否采集 CLS（累积布局偏移）。@default true */
  cls?: boolean;
  /** 是否采集 INP（交互到下一次绘制）。@default true */
  inp?: boolean;
  /** 是否采集 TTFB（首字节时间）。@default true */
  ttfb?: boolean;
}

/**
 * BrowserIntegration 总配置。
 */
export interface BrowserIntegrationOptions {
  /** 是否启用整个 BrowserIntegration。@default true */
  enabled?: boolean;
  /** 错误采集子配置。 @deprecated*/
  errors?: BrowserErrorCollectionOptions;
  /** 性能指标采集子配置。 */
  vitals?: BrowserVitalsCollectionOptions;
}
export type ResolvedBrowserErrorCollectionOptions =
  Required<BrowserErrorCollectionOptions>;
export type ResolvedBrowserVitalsCollectionOptions =
  Required<BrowserVitalsCollectionOptions>;
export interface ResolvedBrowserIntegrationOptions {
  enabled: boolean;
  errors: ResolvedBrowserErrorCollectionOptions;
  vitals: ResolvedBrowserVitalsCollectionOptions;
}

const DEFAULT_ERROR_OPTIONS: ResolvedBrowserErrorCollectionOptions = {
  enabled: true,
  jsError: true,
  resourceError: true,
  unhandledRejection: true,
};

const DEFAULT_VITALS_OPTIONS: ResolvedBrowserVitalsCollectionOptions = {
  enabled: true,
  reportAllChanges: false,
  fcp: true,
  lcp: true,
  cls: true,
  inp: true,
  ttfb: true,
};

const DEFAULT_BROWSER_OPTIONS: ResolvedBrowserIntegrationOptions = {
  enabled: true,
  errors: DEFAULT_ERROR_OPTIONS,
  vitals: DEFAULT_VITALS_OPTIONS,
};

const resolveErrorOptions = (
  options: BrowserErrorCollectionOptions = {},
): ResolvedBrowserErrorCollectionOptions => {
  return {
    ...DEFAULT_ERROR_OPTIONS,
    ...options,
  };
};

const resolveVitalsOptions = (
  options: BrowserVitalsCollectionOptions = {},
): ResolvedBrowserVitalsCollectionOptions => {
  return {
    ...DEFAULT_VITALS_OPTIONS,
    ...options,
  };
};

export const resolveBrowserIntegrationOptions = (
  options: BrowserIntegrationOptions = {},
): ResolvedBrowserIntegrationOptions => {
  return {
    enabled: options.enabled ?? DEFAULT_BROWSER_OPTIONS.enabled,
    errors: resolveErrorOptions(options.errors),
    vitals: resolveVitalsOptions(options.vitals),
  };
};


