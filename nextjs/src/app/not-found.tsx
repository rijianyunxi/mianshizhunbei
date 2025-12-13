import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-sm uppercase tracking-[0.4em] text-muted-foreground">
        404
      </p>
      <h1 className="text-3xl font-semibold">页面被折叠到宇宙深处了</h1>
      <p className="text-muted-foreground">
        你要找的文章暂时不存在，或者需要在后台先发布。
      </p>
      <Link
        href="/"
        className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
      >
        返回首页
      </Link>
    </div>
  );
}
