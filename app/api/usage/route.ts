import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/system/auth/session";
import { readOrganizationUsage, usageApiError } from "@/system/server/openai-usage";
import { utcMonthKey } from "@/system/usage/organization-usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value)) {
    return NextResponse.json({ code: "AUTH_REQUIRED", error: "로그인이 필요합니다." }, { status: 401, headers });
  }
  try {
    const month = request.nextUrl.searchParams.get("month") ?? utcMonthKey();
    return NextResponse.json(await readOrganizationUsage(month), { headers });
  } catch (error) {
    const result = usageApiError(error);
    return NextResponse.json(result.body, { status: result.status, headers });
  }
}
