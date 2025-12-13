import type { Metadata } from "next";
import { requireAdminAccess } from "@/lib/auth";
import { getAnalyticsSummary } from "@/lib/posts";

export const metadata: Metadata = {
  title: "控制台",
  description: "登录后查看系统接口、写作体验与发布统计。",
};

export default async function ConsolePage() {
  await requireAdminAccess("/console");
  const metrics = await getAnalyticsSummary();

  const sections = [
    {
      title: "API 接口",
      description: "RESTful 设计，可无缝迁移至 Server Actions / Edge Functions。",
      items: [
        "GET /api/posts · 列表",
        "POST /api/posts · 新建",
        "GET /api/posts/[slug] · 详情",
        "PUT /api/posts/[slug] · 更新",
        "DELETE /api/posts/[slug] · 删除",
      ],
    },
    {
      title: "写作体验",
      description: "富文本 Markdown + 代码高亮，实时预览，一键生成摘要。",
      items: [
        "@uiw/react-md-editor",
        "remark-gfm / rehype-highlight",
        "Dashboard 里管理草稿 / 发布 / 归档",
      ],
    },
    {
      title: "系统亮点",
      description: "明暗同源主题、玻璃态 UI、API + 数据层抽象，适合扩展。",
      items: ["next-themes", "Tailwind v4 tokens", "模块化 posts service"],
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
          Secure Console
        </p>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight">
          系统与后台信息
        </h1>
        <p className="text-muted-foreground">
          当前共有 {metrics.totalPosts} 篇文章（{metrics.publishedPosts} 发布 /
          {metrics.draftPosts} 草稿 / {metrics.archivedPosts} 归档），累计{" "}
          {metrics.totalViews.toLocaleString()} 次浏览、{metrics.totalComments} 条评论。
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        {sections.map((block) => (
          <div key={block.title} className="glass-panel space-y-3 p-6">
            <h3 className="text-lg font-semibold">{block.title}</h3>
            <p className="text-sm text-muted-foreground">{block.description}</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {block.items.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="glass-panel space-y-5 p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
              Dashboard Summary
            </p>
            <h2 className="text-2xl font-semibold">关键指标</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            发布频率 {metrics.publishFrequency}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border/60 p-5">
            <p className="text-sm text-muted-foreground">浏览量</p>
            <p className="text-3xl font-semibold">
              {metrics.totalViews.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              覆盖 {metrics.monthlyTrend.length} 个月
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 p-5">
            <p className="text-sm text-muted-foreground">评论数</p>
            <p className="text-3xl font-semibold">
              {metrics.totalComments.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">与社区互动</p>
          </div>
        </div>
      </section>
    </div>
  );
}
