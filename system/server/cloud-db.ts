import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/system/auth/session";
export class CloudError extends Error {
    constructor(message: string, public status = 500) { super(message); }
}
export function cloudConfig() {
    const required = (key: string) => {
        const value = process.env[key]?.trim();
        if (!value)
            throw new CloudError(`${key} 환경 변수가 필요합니다.`, 503);
        return value;
    };
    return { url: required("SUPABASE_URL"), key: required("SUPABASE_SECRET_KEY"), workspace: required("STUDIO_WORKSPACE_ID"), owner: required("STUDIO_OWNER_USER_ID") };
}
export async function requireCloudSession() {
    if (!await verifySessionToken((await cookies()).get(SESSION_COOKIE_NAME)?.value))
        throw new CloudError("로그인이 필요합니다.", 401);
    return cloudConfig();
}
export function checkMutationOrigin(request: Request) {
    if (request.headers.get("origin") !== new URL(request.url).origin)
        throw new CloudError("허용되지 않은 요청입니다.", 403);
}
export async function db<T>(resource: string, init: RequestInit = {}): Promise<T> {
    const config = cloudConfig();
    const response = await fetch(`${config.url.replace(/\/$/, "")}/rest/v1/${resource}`, {
        ...init, cache: "no-store", signal: AbortSignal.timeout(30000),
        headers: { apikey: config.key, Authorization: `Bearer ${config.key}`, "Content-Type": "application/json", ...init.headers },
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (error.code === "40001")
            throw new CloudError("다른 화면에서 수정되었습니다. 새로고침 후 다시 저장해 주세요.", 409);
        // Do not expose database payloads or credentials in API responses.
        console.error("Cloud database request failed", { resource: resource.split("?")[0], status: response.status, code: error.code });
        throw new CloudError("클라우드 데이터 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.", 502);
    }
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
}
export async function list<T>(table: string, query = ""): Promise<T[]> {
    const { workspace } = cloudConfig();
    const result: T[] = [];
    for (let offset = 0;; offset += 500) {
        const page = await db<T[]>(`${table}?workspace_id=eq.${workspace}&${query}&limit=500&offset=${offset}`);
        result.push(...page);
        if (page.length < 500)
            return result;
    }
}
export async function rpc<T>(name: string, payload: unknown): Promise<T> {
    return db<T>(`rpc/${name}`, { method: "POST", body: JSON.stringify(payload) });
}
export function cloudResponseError(error: unknown) {
    return Response.json({ error: error instanceof CloudError ? error.message : "클라우드 요청을 처리하지 못했습니다." }, { status: error instanceof CloudError ? error.status : 500 });
}
