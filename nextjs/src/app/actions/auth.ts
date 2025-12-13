"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  AUTH_COOKIE_NAME,
  AUTH_SESSION_VALUE,
  ROLE_COOKIE_NAME,
  USER_NAME_COOKIE,
  getAdminPassword,
} from "@/lib/auth";

export type LoginState = {
  error?: string;
};

const adminLoginSchema = z.object({
  password: z.string().min(4),
  redirectTo: z.string().default("/admin"),
});

const registerSchema = z.object({
  name: z.string().min(2, "请输入昵称"),
  email: z.string().email("请输入合法邮箱"),
  redirectTo: z.string().default("/"),
});

export async function adminLoginAction(
  _: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = adminLoginSchema.safeParse({
    password: formData.get("password"),
    redirectTo: formData.get("redirectTo"),
  });

  if (!parsed.success) {
    return { error: "请输入正确的口令" };
  }

  const redirectTo =
    typeof parsed.data.redirectTo === "string" &&
    parsed.data.redirectTo.startsWith("/")
      ? parsed.data.redirectTo
      : "/admin";

  if (parsed.data.password !== getAdminPassword()) {
    return { error: "口令错误，请重试" };
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, AUTH_SESSION_VALUE, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
  });
  cookieStore.set(ROLE_COOKIE_NAME, "admin", { maxAge: 60 * 60 * 24 });

  redirect(redirectTo);
}

export async function registerAction(
  _: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    redirectTo: formData.get("redirectTo"),
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ?? "请输入合法信息",
    };
  }

  const redirectTo =
    typeof parsed.data.redirectTo === "string" &&
    parsed.data.redirectTo.startsWith("/")
      ? parsed.data.redirectTo
      : "/";

  const cookieStore = await cookies();
  cookieStore.set(ROLE_COOKIE_NAME, "user", { maxAge: 60 * 60 * 24 * 7 });
  cookieStore.set(USER_NAME_COOKIE, parsed.data.name, {
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect(redirectTo);
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  cookieStore.delete(ROLE_COOKIE_NAME);
  cookieStore.delete(USER_NAME_COOKIE);
  redirect("/");
}
