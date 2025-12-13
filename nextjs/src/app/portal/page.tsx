import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AdminLoginForm } from "@/components/forms/admin-login-form";
import { AUTH_COOKIE_NAME, AUTH_SESSION_VALUE } from "@/lib/auth";

export const metadata: Metadata = {
  title: "安全入口",
  description: "输入口令后即可进入控制台与后台管理。",
};

type PortalPageProps = {
  searchParams?: { redirect?: string };
};

export default async function PortalPage({ searchParams }: PortalPageProps) {
  const redirectParam = searchParams?.redirect ?? "/console";
  const redirectTo = redirectParam.startsWith("/")
    ? redirectParam
    : "/console";

  const session = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (session === AUTH_SESSION_VALUE) {
    redirect(redirectTo);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-6 py-16">
      <AdminLoginForm redirectTo={redirectTo} />
      <p className="text-center text-sm text-muted-foreground">
        登录口令通过 <code>.env.local</code> 中的 <code>ADMIN_PASSWORD</code> 定义。
      </p>
    </div>
  );
}
