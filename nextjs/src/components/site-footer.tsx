export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} Song. Crafted with Next.js 16.</p>
        <div className="flex gap-4">
          <a
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-primary"
          >
            GitHub
          </a>
          <a
            href="mailto:hi@example.com"
            className="transition hover:text-primary"
          >
            hi@example.com
          </a>
          <a href="/admin" className="transition hover:text-primary">
            后台入口
          </a>
        </div>
      </div>
    </footer>
  );
}
