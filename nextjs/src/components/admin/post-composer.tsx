"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import clsx from "clsx";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import { postInputSchema } from "@/lib/validators";
import type { PostInput } from "@/lib/validators";
import type { PostStatus } from "@/lib/types";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
});
const MarkdownPreview = dynamic(
  () => import("@uiw/react-markdown-preview"),
  { ssr: false }
);

type FormState = {
  title: string;
  excerpt: string;
  coverImage: string;
  tags: string;
  content: string;
  status: PostStatus;
  publishedAt: string;
};

const defaultForm: FormState = {
  title: "",
  excerpt: "",
  coverImage: "",
  tags: "设计,架构,Next.js",
  content: "",
  status: "draft",
  publishedAt: new Date().toISOString().slice(0, 10),
};

type PostComposerProps = {
  onPublished?: () => void;
};

export function PostComposer({ onPublished }: PostComposerProps) {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const parsedPreview = useMemo(() => form.content, [form.content]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const payload: PostInput = postInputSchema.parse({
        title: form.title,
        excerpt: form.excerpt,
        coverImage: form.coverImage || undefined,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        content: form.content,
        status: form.status,
        publishedAt: form.publishedAt
          ? new Date(form.publishedAt).toISOString()
          : undefined,
      });

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message ?? "发布失败");
      }

      setMessage("发布成功，可前往文章列表查看。");
      setForm(defaultForm);
      onPublished?.();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "未知错误");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="composer" className="space-y-8">
      <div className="rounded-3xl bg-gradient-to-r from-primary/10 via-primary/20 to-secondary/60 p-8 text-foreground shadow-inner">
        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
          Creator Studio
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">
          发布一篇拥有灵魂的文章
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          支持 Markdown、实时预览、封面设置与多标签。灵感就绪时，一键发布至首页与订阅渠道。
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <form
          className="space-y-6 rounded-3xl border border-border/70 bg-card/95 p-6 shadow-lg shadow-black/5"
          onSubmit={handleSubmit}
        >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-foreground">
            标题
            <input
              type="text"
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full rounded-2xl border border-border/70 bg-background px-4 py-2 text-base"
              required
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-foreground">
            发布日期
            <input
              type="date"
              value={form.publishedAt}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, publishedAt: e.target.value }))
              }
              className="w-full rounded-2xl border border-border/70 bg-background px-4 py-2 text-base"
            />
          </label>
        </div>
        <label className="space-y-2 text-sm font-medium text-foreground">
          摘要
          <textarea
            value={form.excerpt}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, excerpt: e.target.value }))
            }
            className="min-h-[80px] w-full rounded-2xl border border-border/70 bg-background px-4 py-2 text-base"
            required
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-foreground">
          封面图 URL
          <input
            type="url"
            placeholder="https://images.unsplash.com/..."
            value={form.coverImage}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, coverImage: e.target.value }))
            }
            className="w-full rounded-2xl border border-border/70 bg-background px-4 py-2 text-base"
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-foreground">
            标签（逗号分隔）
            <input
              type="text"
              value={form.tags}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, tags: e.target.value }))
              }
              className="w-full rounded-2xl border border-border/70 bg-background px-4 py-2 text-base"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-foreground">
            状态
            <select
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  status: e.target.value as PostStatus,
                }))
              }
              className="w-full rounded-2xl border border-border/70 bg-background px-4 py-2 text-base"
            >
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
              <option value="archived">归档</option>
            </select>
          </label>
        </div>

        <div data-color-mode="dark" className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            正文（Markdown + 代码高亮）
          </p>
          <div className="overflow-hidden rounded-3xl border border-border/60 shadow-inner">
            <MDEditor
              value={form.content}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, content: value ?? "" }))
              }
              height={400}
              preview="edit"
              textareaProps={{ placeholder: "开始创作..." }}
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-2xl bg-primary/90 py-3 text-base font-semibold text-primary-foreground transition hover:bg-primary"
          disabled={submitting}
        >
          {submitting ? "发布中..." : "发布文章"}
        </button>
        </form>

        <div className="space-y-6">
          <div className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-inner">
            <p className="text-sm font-semibold text-foreground">发布清单</p>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>• 标题不少于 6 个字，突出价值。</li>
              <li>• 摘要作为 SEO 描述，40-60 字最佳。</li>
              <li>• 封面建议使用 3:2 的高清图。</li>
              <li>• 标签限定 3-5 个，便于归档。</li>
            </ul>
          </div>

          {parsedPreview ? (
            <div className="rounded-3xl border border-border/60 bg-card/90 p-4 text-sm">
              <p className="mb-2 font-medium text-foreground">实时预览</p>
              <div data-color-mode="dark">
                <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted/30 p-4">
                  <MarkdownPreview source={parsedPreview} />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
              正文内容将实时渲染在这里，方便校对排版与代码高亮。
            </div>
          )}

          {message && (
            <p
              className={clsx(
                "rounded-2xl border px-4 py-3 text-sm",
                message.includes("成功")
                  ? "border-emerald-500 text-emerald-600"
                  : "border-red-500 text-red-500"
              )}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
