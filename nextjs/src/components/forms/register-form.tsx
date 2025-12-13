"use client";

import { useFormState } from "react-dom";
import { registerAction, type LoginState } from "@/app/actions/auth";

const initialState: LoginState = {};

type RegisterFormProps = {
  redirectTo?: string;
};

export function RegisterForm({ redirectTo = "/" }: RegisterFormProps) {
  const [state, formAction] = useFormState(registerAction, initialState);

  return (
    <form
      action={formAction}
      className="glass-panel mx-auto flex w-full max-w-lg flex-col gap-6 p-8"
    >
      <div className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
          Join Club
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          注册账户
        </h1>
        <p className="text-sm text-muted-foreground">
          成为社区成员，第一时间获取新文章、活动与私享内容。
        </p>
      </div>
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <label className="space-y-2 text-sm font-medium text-foreground">
        昵称
        <input
          type="text"
          name="name"
          placeholder="你的中文或英文名"
          className="w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-base"
          required
        />
      </label>
      <label className="space-y-2 text-sm font-medium text-foreground">
        邮箱
        <input
          type="email"
          name="email"
          placeholder="hi@example.com"
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
        className="w-full rounded-2xl bg-foreground py-3 text-base font-semibold text-background transition hover:opacity-90"
      >
        完成注册
      </button>
    </form>
  );
}
