import Link from "next/link";
import type { Post } from "@/lib/types";
import clsx from "clsx";
import { formatDate } from "@/lib/date";

type PostCardProps = {
  post: Post;
};

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="glass-panel flex flex-col justify-between gap-6 p-6 transition hover:-translate-y-1 hover:shadow-2xl">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <span>{formatDate(post.publishedAt)}</span>
          <span>·</span>
          <span>{post.readingTime}</span>
        </div>
        <Link href={`/posts/${post.slug}`} className="group space-y-2">
          <h3 className="text-xl font-semibold tracking-tight text-foreground group-hover:text-primary">
            {post.title}
          </h3>
          <p className="text-sm text-muted-foreground">{post.excerpt}</p>
        </Link>
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className={clsx(
                "rounded-full border border-border/70 px-3 py-1 text-xs font-medium text-muted-foreground",
                post.status === "draft" && "border-dashed"
              )}
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between pt-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/15" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {post.author.name}
            </p>
            <p className="text-xs">{post.author.role}</p>
          </div>
        </div>
        <Link
          href={`/posts/${post.slug}`}
          className="text-sm font-medium text-primary transition hover:underline"
        >
          阅读 →
        </Link>
      </div>
    </article>
  );
}
