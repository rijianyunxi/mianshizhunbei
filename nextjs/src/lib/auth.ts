import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

export const AUTH_COOKIE_NAME = "song-auth-token";
export const AUTH_SESSION_VALUE = "verified";
export const ROLE_COOKIE_NAME = "song-role";
export const USER_NAME_COOKIE = "song-user-name";

export type SessionRole = "guest" | "user" | "admin";

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() ?? "song-admin-2024";
}

export function isAdminSession(cookiesStore: ReadonlyRequestCookies) {
  return cookiesStore.get(AUTH_COOKIE_NAME)?.value === AUTH_SESSION_VALUE;
}

export function getSessionRole(cookiesStore: ReadonlyRequestCookies): SessionRole {
  if (isAdminSession(cookiesStore)) return "admin";
  const role = cookiesStore.get(ROLE_COOKIE_NAME)?.value;
  if (role === "user") return "user";
  return "guest";
}

export function getSessionName(cookiesStore: ReadonlyRequestCookies) {
  return cookiesStore.get(USER_NAME_COOKIE)?.value ?? "";
}

export async function requireAdminAccess(redirectPath = "/admin") {
  const cookieStore = await cookies();
  if (!isAdminSession(cookieStore)) {
    redirect(`/portal?redirect=${encodeURIComponent(redirectPath)}`);
  }
  return cookieStore;
}
