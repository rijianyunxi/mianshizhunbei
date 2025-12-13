import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import { PostCard } from "@/components/post-card";
import { formatDate } from "@/lib/date";

export default async function Home() {
  const posts = await getAllPosts();
  const featured = posts[0];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-12">
      <section className="glass-panel overflow-hidden px-8 py-12">
        <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
              Modern Writing Toolkit
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl">
              Song 的极简主义博客，沉浸写作、持续发布、稳固运营。
            </h1>
            <p className="text-lg text-muted-foreground">
              这里专注于设计、系统与创造力，文章使用 Markdown 写作流+代码高亮，后台通过
              Dashboard 监管内容表现。
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href={featured ? `/posts/${featured.slug}` : "/"}
                className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                阅读最新文章
              </Link>
              <Link
                href="/login?redirect=%2Fadmin"
                className="rounded-full border border-border/70 px-6 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
              >
                管理入口
              </Link>
            </div>
          </div>
          {featured && (
            <div className="space-y-4 rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-transparent to-secondary/40 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Featured
              </p>
              <Link href={`/posts/${featured.slug}`} className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground">
                  {featured.title}
                </h2>
                <p className="text-muted-foreground">{featured.excerpt}</p>
              </Link>
              <div className="flex gap-2">
                {featured.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatDate(featured.publishedAt)} · {featured.readingTime}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
              Stories
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              最新文章
            </h2>
          </div>
          <div className="flex gap-3 text-sm font-medium text-muted-foreground">
            <Link href="/register" className="transition hover:text-primary">
              加入社区
            </Link>
            <span>/</span>
            <Link
              href="/login?redirect=%2Fadmin"
              className="transition hover:text-primary"
            >
              管理员发布
            </Link>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}
