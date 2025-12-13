"use client";

import { useFormState } from "react-dom";
import { adminLoginAction, type LoginState } from "@/app/actions/auth";

const initialState: LoginState = {};

type AdminLoginFormProps = {
  redirectTo?: string;
};

export function AdminLoginForm({ redirectTo = "/admin" }: AdminLoginFormProps) {
  const [state, formAction] = useFormState(adminLoginAction, initialState);

  return (
    <form
      action={formAction}
      className="glass-panel mx-auto flex w-full max-w-lg flex-col gap-6 p-8"
    >
      <div className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
          Admin Console
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          后台登录
        </h1>
        <p className="text-sm text-muted-foreground">
          输入管理员密钥以访问 Dashboard 与发布工具。
        </p>
      </div>

      <input type="hidden" name="redirectTo" value={redirectTo} />

      <label className="space-y-2 text-sm font-medium text-foreground">
        管理口令
        <input
          type="password"
          name="password"
          placeholder="••••••••"
          className="w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-base"
          required
        />
      </label>

      {state.error && (
        <p className="rounded-xl border border-red-500/60 bg-red-500/5 px-4 py-3 text-sm text-red-500">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        className="w-full rounded-2xl bg-primary py-3 text-base font-semibold text-primary-foreground transition hover:opacity-90"
      >
        进入后台
      </button>
    </form>
  );
}
