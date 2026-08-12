import { NextResponse } from "next/server";
import { isCasesResponse } from "@/system/integrations/cases";
export const dynamic = "force-dynamic";
const DEFAULT_ITDA_NEO_URL = "http://localhost:3002";
export async function GET() {
  const secret = process.env.INTEGRATION_API_SECRET;
  const baseUrl = (process.env.ITDA_NEO_BASE_URL || DEFAULT_ITDA_NEO_URL).replace(/\/$/, "");
  if (!secret) {
    return NextResponse.json({
      error: "INTEGRATION_API_SECRET 환경 변수가 설정되지 않았습니다."
    }, {
      status: 503
    });
  }
  try {
    const response = await fetch(`${baseUrl}/api/integrations/cases`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${secret}`
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000)
    });
    if (!response.ok) {
      return NextResponse.json({
        error: `ITDA NEO에서 case 정보를 가져오지 못했습니다. (${response.status})`
      }, {
        status: 502
      });
    }
    const data: unknown = await response.json();
    if (!isCasesResponse(data)) {
      return NextResponse.json({
        error: "ITDA NEO의 case 응답 형식이 올바르지 않습니다."
      }, {
        status: 502
      });
    }
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    const message = error instanceof Error && error.name === "TimeoutError" ? "ITDA NEO case 요청 시간이 초과되었습니다." : "ITDA NEO case 엔드포인트에 연결할 수 없습니다.";
    return NextResponse.json({
      error: message
    }, {
      status: 502
    });
  }
}
