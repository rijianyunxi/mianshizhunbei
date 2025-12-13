"use client";

import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          Song · Journal
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/register"
            className="hidden rounded-full border border-border/70 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-primary sm:inline-flex"
          >
            加入社区
          </Link>
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
