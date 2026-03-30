declare module "web-vitals" {
  export interface MetricType {
    name: "CLS" | "FCP" | "INP" | "LCP" | "TTFB";
    value: number;
    delta: number;
    rating: "good" | "needs-improvement" | "poor";
    id: string;
    navigationType?: string;
    entries: PerformanceEntry[];
  }

  export interface ReportOpts {
    reportAllChanges?: boolean;
  }

  export function onCLS(
    callback: (metric: MetricType) => void,
    opts?: ReportOpts,
  ): void;

  export function onFCP(
    callback: (metric: MetricType) => void,
    opts?: ReportOpts,
  ): void;

  export function onINP(
    callback: (metric: MetricType) => void,
    opts?: ReportOpts,
  ): void;

  export function onLCP(
    callback: (metric: MetricType) => void,
    opts?: ReportOpts,
  ): void;

  export function onTTFB(
    callback: (metric: MetricType) => void,
    opts?: ReportOpts,
  ): void;
}
