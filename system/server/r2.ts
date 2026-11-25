import "server-only";
import { createHash, createHmac } from "node:crypto";
import { CloudError } from "./cloud-db";
const hash = (value: Buffer | string) => createHash("sha256").update(value).digest("hex");
const hmac = (key: Buffer | string, value: string) => createHmac("sha256", key).update(value).digest();
const encode = (value: string) => encodeURIComponent(value).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
export async function r2Request(method: "GET" | "PUT" | "HEAD", bucket: string, objectKey: string, body?: Buffer, mimeType?: string) {
    const endpoint = process.env.R2_ENDPOINT;
    const access = process.env.R2_ACCESS_KEY_ID;
    const secret = process.env.R2_SECRET_ACCESS_KEY;
    if (!endpoint || !access || !secret)
        throw new CloudError("R2 환경 변수를 확인해 주세요.", 503);
    const origin = new URL(endpoint).origin;
    const region = process.env.R2_REGION || "auto";
    const uri = "/" + [bucket, ...objectKey.split("/")].map(encode).join("/");
    const url = new URL(uri, origin);
    const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
    const day = timestamp.slice(0, 8);
    const payloadHash = hash(body ?? "");
    const scope = `${day}/${region}/s3/aws4_request`;
    const headers = `host:${url.host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${timestamp}\n`;
    const signed = "host;x-amz-content-sha256;x-amz-date";
    const canonical = [method, uri, "", headers, signed, payloadHash].join("\n");
    const signingKey = hmac(hmac(hmac(hmac(`AWS4${secret}`, day), region), "s3"), "aws4_request");
    const signature = createHmac("sha256", signingKey).update(`AWS4-HMAC-SHA256\n${timestamp}\n${scope}\n${hash(canonical)}`).digest("hex");
    const response = await fetch(url, { method, cache: "no-store", signal: AbortSignal.timeout(90000),
        headers: { "Accept-Encoding": "identity", "x-amz-date": timestamp, "x-amz-content-sha256": payloadHash,
            Authorization: `AWS4-HMAC-SHA256 Credential=${access}/${scope}, SignedHeaders=${signed}, Signature=${signature}`,
            ...(mimeType ? { "Content-Type": mimeType } : {}) }, body: body as BodyInit | undefined });
    if (!response.ok)
        throw new CloudError("R2 파일 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.", 502);
    return response;
}
