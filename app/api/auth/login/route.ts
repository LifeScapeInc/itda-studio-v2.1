import { NextResponse } from "next/server";
import {
  createSessionToken,
  isSessionAuthConfigured,
  SESSION_COOKIE_NAME,
} from "@/system/auth/session";
import {
  isLoginPasswordConfigured,
  verifyLoginPassword,
} from "@/system/server/login-password";

export const runtime = "nodejs";

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!isLoginPasswordConfigured() || !isSessionAuthConfigured()) {
    return NextResponse.json(
      {
        error: "로그인 환경변수가 설정되지 않았습니다.",
      },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null) as {
    password?: unknown;
  } | null;
  const password = typeof body?.password === "string"
    ? body.password
    : "";

  if (!verifyLoginPassword(password)) {
    await delay(350);

    return NextResponse.json(
      { error: "비밀번호가 올바르지 않습니다." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: await createSessionToken(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return response;
}
