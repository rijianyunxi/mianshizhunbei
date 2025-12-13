"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

const sidebarItems = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "文章管理", href: "/admin/posts" },
  { label: "发布文章", href: "/admin/publish" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-full max-w-[15rem] flex-shrink-0 flex-col rounded-3xl border border-border/70 bg-card/70 p-4 backdrop-blur lg:flex">
      <p className="px-2 text-xs uppercase tracking-[0.4em] text-muted-foreground">
        控制台
      </p>
      <div className="mt-4 flex flex-1 flex-col gap-1 text-sm font-medium text-muted-foreground">
        {sidebarItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "rounded-2xl px-3 py-2 transition",
              pathname === item.href
                ? "bg-primary/20 text-primary"
                : "hover:bg-muted/80 hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="rounded-2xl border border-border/60 p-4 text-xs text-muted-foreground">
        提示：Dashboard 显示实时趋势，文章管理可快速定位草稿。
      </div>
    </aside>
  );
}
