import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/forms/admin-login-form";

export const metadata: Metadata = {
  title: "管理员登录",
  description: "输入密钥即可进入后台发布与 Dashboard。",
};

type LoginPageProps = {
  searchParams?: { redirect?: string };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const redirectParam = searchParams?.redirect ?? "/admin";
  const redirectTo = redirectParam.startsWith("/")
    ? redirectParam
    : "/admin";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-6 py-16">
      <AdminLoginForm redirectTo={redirectTo} />
      <p className="text-center text-sm text-muted-foreground">
        没有密钥？可先完成{" "}
        <a className="text-primary underline" href="/register">
          用户注册
        </a>
        了解社区体验。
      </p>
    </div>
  );
}
