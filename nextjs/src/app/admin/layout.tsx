import type { ReactNode } from "react";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin/sidebar";
import { requireAdminAccess } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdminAccess("/admin");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 lg:flex-row">
      <AdminSidebar />
      <div className="flex-1 space-y-8">
        <div className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-muted/30 px-6 py-5 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em]">Admin Mode</p>
            <p className="text-base text-foreground">
              欢迎回来，Dashboard 数据实时更新。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/dashboard"
              className="rounded-full border border-border/70 px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
            >
              Dashboard
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-full border border-border/70 px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
              >
                退出登录
              </button>
            </form>
          </div>
        </div>
        <main className="space-y-8">{children}</main>
      </div>
    </div>
  );
}
