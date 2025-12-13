"use client";

import { useMemo } from "react";
import type { AnalyticsSummary } from "@/lib/types";

type DashboardSectionProps = {
  metrics?: AnalyticsSummary;
  loading: boolean;
};

export function DashboardSection({ metrics, loading }: DashboardSectionProps) {
  const trend = useMemo(
    () => metrics?.monthlyTrend ?? [],
    [metrics?.monthlyTrend]
  );
  const chartPoints = useMemo(() => {
    if (!trend.length) return [];
    const maxViews = Math.max(...trend.map((item) => item.views), 1);
    const denominator = Math.max(trend.length - 1, 1);
    return trend.map((item, index) => {
      const x = (index / denominator) * 440;
      const y = 160 - (item.views / maxViews) * 150;
      return { ...item, x, y };
    });
  }, [trend]);

  const chartLinePath = chartPoints
    .map((point, index) =>
      `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`
    )
    .join(" ");

  const chartAreaPath = chartPoints.length
    ? `${chartLinePath} L${
        chartPoints[chartPoints.length - 1].x.toFixed(2)
      },160 L0,160 Z`
    : "";

  const cards = [
    {
      label: "已发布",
      value: metrics?.publishedPosts ?? "0",
      accent: "from-[#152238] via-[#1e293b] to-[#0f172a]",
      border: "border-white/10",
      sub: "公开可见内容",
    },
    {
      label: "草稿",
      value: metrics?.draftPosts ?? "0",
      accent: "from-[#bda26b] via-[#c6ad78] to-[#d1bb8e]",
      border: "border-white/30",
      sub: "等待上线",
    },
    {
      label: "浏览量",
      value: metrics?.totalViews
        ? metrics.totalViews.toLocaleString()
        : "0",
      accent: "from-[#1d4ed8] via-[#2563eb] to-[#38bdf8]",
      border: "border-white/15",
      sub: "累计阅读",
    },
    {
      label: "评论",
      value: metrics?.totalComments ?? "0",
      accent: "from-[#7c3aed] via-[#a855f7] to-[#c084fc]",
      border: "border-white/20",
      sub: "互动反馈",
    },
  ];

  return (
    <section id="dashboard" className="space-y-8">
      <div className="glass-panel grid gap-8 overflow-hidden p-6 md:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Live Dashboard
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            洞察趋势，掌控内容
          </h1>
          <p className="text-muted-foreground">
            当前共 {metrics?.totalPosts ?? 0} 篇文章 · 发布频率{" "}
            {metrics?.publishFrequency ?? "-"} · 最新数据{" "}
            {trend.at(-1)?.label ?? "--"}
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <a
              href="#composer"
              className="rounded-full bg-primary px-5 py-2 font-semibold text-primary-foreground transition hover:opacity-90"
            >
              去发布
            </a>
            <a
              href="#posts"
              className="rounded-full border border-border/70 px-5 py-2 font-semibold text-foreground transition hover:border-primary hover:text-primary"
            >
              查看列表
            </a>
          </div>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-[#111827] via-[#0f172a] to-[#1f2937] p-6 text-white">
          <p className="text-xs uppercase tracking-[0.4em] text-white/60">
            Trend
          </p>
          <h3 className="text-2xl font-semibold">近月访问曲线</h3>
          {chartPoints.length ? (
            <svg viewBox="0 0 440 200" className="mt-4 w-full">
              <defs>
                <linearGradient id="dashboard-trend" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgba(56,189,248,0.7)" />
                  <stop offset="100%" stopColor="rgba(15,23,42,0)" />
                </linearGradient>
              </defs>
              <path d={chartAreaPath} fill="url(#dashboard-trend)" stroke="none" />
              <path
                d={chartLinePath}
                fill="none"
                stroke="rgba(255,255,255,0.9)"
                strokeWidth={3}
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <p className="mt-6 text-sm text-white/70">
              暂无数据，发布内容后即可看到走势。
            </p>
          )}
          <p className="mt-4 text-xs text-white/60">
            数据实时更新 · 当前统计 {trend.length} 个月
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="glass-panel overflow-hidden">
            <div
              className={`border-b ${card.border} bg-gradient-to-br ${card.accent} p-5 text-white`}
            >
              <p className="text-xs uppercase tracking-[0.4em] text-white/70">
                {card.label}
              </p>
              <p className="mt-2 text-3xl font-semibold">{card.value}</p>
              <p className="text-xs text-white/70">{card.sub}</p>
            </div>
          </div>
        ))}
        {loading &&
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`loading-${index}`}
              className="glass-panel h-36 animate-pulse bg-muted/60"
            />
          ))}
      </div>
    </section>
  );
}
