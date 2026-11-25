import "server-only";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { cloudConfig, CloudError, db, list } from "./cloud-db";
import { r2Request } from "./r2";
export type AssetRow = {
    id: string;
    bucket: string;
    object_key: string;
    filename: string;
    mime_type: string;
    byte_size: number;
    width: number | null;
    height: number | null;
};
export const assetUrl = (id: string) => `/api/assets/${id}`;
export function assetId(source: string) { return /^\/api\/assets\/([0-9a-f-]{36})$/.exec(source)?.[1] ?? null; }
export async function getAsset(id: string) {
    const rows = await list<AssetRow>("assets", `id=eq.${id}&status=eq.ready&deleted_at=is.null`);
    if (!rows[0])
        throw new CloudError("파일을 찾을 수 없습니다.", 404);
    return rows[0];
}
export async function readAsset(id: string) {
    const row = await getAsset(id);
    const response = await r2Request("GET", row.bucket, row.object_key);
    return { row, bytes: Buffer.from(await response.arrayBuffer()) };
}
export async function storeAsset(bytes: Buffer, mimeType: string, filename: string) {
    const { workspace, owner } = cloudConfig();
    if (bytes.length > 25 * 1024 * 1024)
        throw new CloudError("파일은 25MB 이하여야 합니다.", 413);
    let width: number | null = null, height: number | null = null;
    if (mimeType.startsWith("image/")) {
        try {
            const metadata = await sharp(bytes, { limitInputPixels: 50000000 }).metadata();
            width = metadata.width ?? null;
            height = metadata.height ?? null;
            // Rasterize SVGs, including mock output; never serve uploaded active SVG content.
            if (metadata.format === "svg") {
                bytes = await sharp(bytes).webp().toBuffer();
                mimeType = "image/webp";
                filename = "image.webp";
            }
            else
                mimeType = ({ jpeg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif", gif: "image/gif" } as Record<string, string>)[metadata.format ?? ""] ?? "";
            if (!mimeType)
                throw new Error("Unsupported image");
        }
        catch {
            throw new CloudError("지원하는 이미지 파일을 확인해 주세요.", 400);
        }
    }
    else if (!["application/pdf", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"].includes(mimeType)) {
        throw new CloudError("지원하지 않는 파일 형식입니다.", 400);
    }
    const checksum = createHash("sha256").update(bytes).digest("hex");
    const existing = await list<AssetRow>("assets", `checksum=eq.${checksum}&status=eq.ready&deleted_at=is.null`);
    if (existing[0])
        return assetUrl(existing[0].id);
    const id = crypto.randomUUID();
    const bucket = process.env.R2_BUCKET_NAME;
    if (!bucket)
        throw new CloudError("R2_BUCKET_NAME 환경 변수가 필요합니다.", 503);
    const objectKey = `workspaces/${workspace}/assets/${id}/original`;
    await db("assets", { method: "POST", body: JSON.stringify({ id, workspace_id: workspace, created_by: owner, bucket, object_key: objectKey, filename, mime_type: mimeType, byte_size: bytes.length, width, height, checksum, status: "pending" }) });
    try {
        await r2Request("PUT", bucket, objectKey, bytes, mimeType);
        const head = await r2Request("HEAD", bucket, objectKey);
        if (Number(head.headers.get("content-length")) !== bytes.length)
            throw new CloudError("업로드한 파일 크기를 확인하지 못했습니다.", 502);
        await db(`assets?id=eq.${id}&workspace_id=eq.${workspace}`, { method: "PATCH", body: JSON.stringify({ status: "ready" }) });
    }
    catch (error) {
        await db(`assets?id=eq.${id}&workspace_id=eq.${workspace}`, { method: "PATCH", body: JSON.stringify({ status: "failed" }) }).catch(() => undefined);
        throw error;
    }
    return assetUrl(id);
}
export async function persistImage(source: string) {
    const id = assetId(source);
    if (id) {
        await getAsset(id);
        return source;
    }
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/.exec(source);
    if (!match)
        throw new CloudError("클라우드에 저장한 이미지 또는 업로드 이미지가 필요합니다.", 400);
    return storeAsset(Buffer.from(match[2], "base64"), match[1], "image");
}
export async function imageDataUrl(source: string) {
    const id = assetId(source);
    if (!id)
        return source;
    const { row, bytes } = await readAsset(id);
    if (!row.mime_type.startsWith("image/"))
        throw new CloudError("이미지 파일이 필요합니다.", 400);
    return `data:${row.mime_type};base64,${bytes.toString("base64")}`;
}
