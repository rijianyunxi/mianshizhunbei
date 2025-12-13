"use client";

import clsx from "clsx";
import type { Post } from "@/lib/types";
import { formatDate } from "@/lib/date";

type PostTableProps = {
  posts?: Post[];
  loading: boolean;
  error?: boolean;
};

export function PostTable({ posts, loading, error }: PostTableProps) {
  return (
    <section
      id="posts"
      className="space-y-4 rounded-3xl border border-border/70 bg-card/90 p-6"
    >
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
          文章管理
        </p>
        <h2 className="text-2xl font-semibold text-foreground">内容列表</h2>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border/70">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">标题</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">发布日期</th>
              <th className="px-4 py-3 font-medium">阅读时间</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                  加载中...
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-red-500">
                  无法获取文章列表
                </td>
              </tr>
            )}
            {posts?.map((post) => (
              <tr key={post.id} className="border-t border-border/60">
                <td className="px-4 py-3 text-foreground">{post.title}</td>
                <td className="px-4 py-3">
                  <span
                    className={clsx(
                      "rounded-full px-3 py-1 text-xs font-medium",
                      post.status === "published" &&
                        "bg-emerald-500/10 text-emerald-600",
                      post.status === "draft" &&
                        "bg-amber-500/10 text-amber-600",
                      post.status === "archived" &&
                        "bg-slate-500/10 text-slate-400"
                    )}
                  >
                    {post.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(post.publishedAt)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{post.readingTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
