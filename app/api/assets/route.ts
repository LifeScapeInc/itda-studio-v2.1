import { requireCloudSession, checkMutationOrigin, cloudResponseError } from "@/system/server/cloud-db";
import { storeAsset } from "@/system/server/cloud-assets";
export const runtime = "nodejs";
export async function POST(request: Request) {
    try {
        await requireCloudSession();
        checkMutationOrigin(request);
        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File))
            return Response.json({ error: "파일이 필요합니다." }, { status: 400 });
        if (file.size > 25 * 1024 * 1024)
            return Response.json({ error: "파일은 25MB 이하여야 합니다." }, { status: 413 });
        const url = await storeAsset(Buffer.from(await file.arrayBuffer()), file.type, file.name);
        return Response.json({ url });
    }
    catch (error) {
        return cloudResponseError(error);
    }
}
