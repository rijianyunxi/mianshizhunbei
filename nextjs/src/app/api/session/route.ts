import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionName, getSessionRole } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const role = getSessionRole(cookieStore);
  const name = getSessionName(cookieStore);
  return NextResponse.json({
    role,
    name,
  });
}
