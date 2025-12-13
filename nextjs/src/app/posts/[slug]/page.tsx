import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug } from "@/lib/posts";
import { MarkdownContent } from "@/components/markdown-content";
import { formatDate } from "@/lib/date";

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) {
    return {
      title: "文章未找到",
    };
  }
  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function PostDetail({ params }: Props) {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="mx-auto w-full max-w-3xl space-y-10 px-6 py-12">
      <Link
        href="/"
        className="text-sm font-medium text-muted-foreground transition hover:text-primary"
      >
        ← 返回首页
      </Link>

      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
          {post.tags.join(" / ")}
        </p>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-foreground">
          {post.title}
        </h1>
        <p className="text-muted-foreground">{post.excerpt}</p>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span>{post.author.name}</span>
          <span>·</span>
          <span>{formatDate(post.publishedAt)}</span>
          <span>·</span>
          <span>{post.readingTime}</span>
        </div>
      </header>

      {post.coverImage && (
        <div
          className="h-72 w-full rounded-3xl bg-cover bg-center"
          style={{ backgroundImage: `url(${post.coverImage})` }}
        />
      )}

      <MarkdownContent content={post.content} />
    </article>
  );
}
