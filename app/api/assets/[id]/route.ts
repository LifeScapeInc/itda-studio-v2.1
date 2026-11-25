import { z } from "zod";
import { requireCloudSession, cloudResponseError } from "@/system/server/cloud-db";
import { getAsset } from "@/system/server/cloud-assets";
import { r2Request } from "@/system/server/r2";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: {
    params: Promise<{
        id: string;
    }>;
}) {
    try {
        await requireCloudSession();
        const { id } = await params;
        if (!z.uuid().safeParse(id).success)
            return new Response(null, { status: 404 });
        const asset = await getAsset(id);
        const response = await r2Request("GET", asset.bucket, asset.object_key);
        return new Response(response.body, { headers: { "Content-Type": asset.mime_type, "Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff",
                ...(!asset.mime_type.startsWith("image/") ? { "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(asset.filename)}` } : {}) } });
    }
    catch (error) {
        return cloudResponseError(error);
    }
}
