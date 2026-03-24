import {
  onCLS,
  onFCP,
  onINP,
  onLCP,
  onTTFB,
  type MetricType,
  type ReportOpts,
} from "web-vitals";
import {
  EVENT_KIND,
  EVENT_TYPE,
  type EventLevel,
  type EventType,
  type TrackerInstance,
} from "../../core/types";
import type { ResolvedBrowserVitalsCollectionOptions } from "./options";

const METRIC_EVENT_TYPE_MAP: Record<MetricType["name"], EventType> = {
  FCP: EVENT_TYPE.PERF_FCP,
  LCP: EVENT_TYPE.PERF_LCP,
  CLS: EVENT_TYPE.PERF_CLS,
  INP: EVENT_TYPE.PERF_INP,
  TTFB: EVENT_TYPE.PERF_TTFB,
};

export const setupWebVitalsCollection = (
  tracker: TrackerInstance,
  options: ResolvedBrowserVitalsCollectionOptions,
): void => {
  if (!options.enabled) {
    return;
  }

  const createReportOptions = (): ReportOpts => ({
    reportAllChanges: options.reportAllChanges,
  });

  const reportMetric = (metric: MetricType): void => {
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
    onFCP(reportMetric, createReportOptions());
  }

  if (options.lcp) {
    onLCP(reportMetric, createReportOptions());
  }

  if (options.cls) {
    onCLS(reportMetric, createReportOptions());
  }

  if (options.inp) {
    onINP(reportMetric, createReportOptions());
  }

  if (options.ttfb) {
    onTTFB(reportMetric, createReportOptions());
  }
};

const mapRatingToLevel = (rating: MetricType["rating"]): EventLevel => {
  if (rating === "poor") {
    return "error";
  }

  if (rating === "needs-improvement") {
    return "warn";
  }

  return "info";
};

const buildMetricMessage = (metric: MetricType): string => {
  const unit = metric.name === "CLS" ? "" : "ms";
  return `${metric.name}: ${metric.value.toFixed(2)}${unit}`;
};
