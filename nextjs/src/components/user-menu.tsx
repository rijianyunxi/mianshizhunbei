"use client";

import { useState } from "react";
import useSWR from "swr";
import { logoutAction } from "@/app/actions/auth";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type SessionInfo = {
  role: "guest" | "user" | "admin";
  name?: string;
};

export function UserMenu() {
  const { data } = useSWR<SessionInfo>("/api/session", fetcher);
  const [open, setOpen] = useState(false);

  const role = data?.role ?? "guest";
  const initials =
    role === "admin"
      ? "A"
      : data?.name?.[0]?.toUpperCase() ?? "G";

  const menuItems = {
    guest: (
      <div className="flex flex-col gap-1">
        <Link
          href="/login"
          className="rounded-xl px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted/80"
        >
          管理员登录
        </Link>
        <Link
          href="/register"
          className="rounded-xl px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted/80"
        >
          用户注册
        </Link>
      </div>
    ),
    user: (
      <div className="flex flex-col gap-1">
        <p className="px-3 py-2 text-xs uppercase tracking-[0.4em] text-muted-foreground">
          {data?.name}
        </p>
        <Link
          href="/register"
          className="rounded-xl px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted/80"
        >
          查看会员权益
        </Link>
        <Link
          href="/login"
          className="rounded-xl px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted/80"
        >
          升级为管理员
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full rounded-xl px-3 py-2 text-left text-sm text-muted-foreground transition hover:bg-muted/80"
          >
            退出
          </button>
        </form>
      </div>
    ),
    admin: (
      <div className="flex flex-col gap-1">
        <p className="px-3 py-2 text-xs uppercase tracking-[0.4em] text-muted-foreground">
          ADMIN
        </p>
        <Link
          href="/admin"
          className="rounded-xl px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted/80"
        >
          后台管理
        </Link>
        <Link
          href="/console"
          className="rounded-xl px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted/80"
        >
          系统控制台
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full rounded-xl px-3 py-2 text-left text-sm text-muted-foreground transition hover:bg-muted/80"
          >
            退出登录
          </button>
        </form>
      </div>
    ),
  } as const;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-card text-sm font-semibold text-foreground"
        aria-label="User menu"
      >
        {initials}
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-56 rounded-2xl border border-border/60 bg-card/95 p-2 shadow-2xl backdrop-blur">
          {role === "admin"
            ? menuItems.admin
            : role === "user"
              ? menuItems.user
              : menuItems.guest}
        </div>
      )}
    </div>
  );
}
