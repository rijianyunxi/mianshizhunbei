import type { Metadata } from "next";
import { RegisterForm } from "@/components/forms/register-form";

export const metadata: Metadata = {
  title: "注册账号",
  description: "加入博客社区，解锁订阅、收藏等功能。",
};

type RegisterPageProps = {
  searchParams?: { redirect?: string };
};

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  const redirectParam = searchParams?.redirect ?? "/";
  const redirectTo = redirectParam.startsWith("/")
    ? redirectParam
    : "/";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-6 py-16">
      <RegisterForm redirectTo={redirectTo} />
      <p className="text-center text-sm text-muted-foreground">
        管理员请使用 <a className="text-primary underline" href="/login">单独入口</a> 登录后台。
      </p>
    </div>
  );
}
