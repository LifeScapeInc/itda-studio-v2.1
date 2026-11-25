"use client";
export async function cloudRequest<T>(resource: string, body?: unknown, method = "POST"): Promise<T> {
    const response = await fetch(`/api/studio/${resource}`, { method: body === undefined ? "GET" : method, cache: "no-store", headers: body === undefined ? {} : { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok)
        throw new Error(data.error || "클라우드 저장에 실패했습니다.");
    return data as T;
}
const fileUploads = new WeakMap<Blob, Promise<string>>();
export async function uploadFile(file: Blob, name = "image.webp"): Promise<string> {
    if (fileUploads.has(file))
        return fileUploads.get(file)!;
    const task = (async () => {
        const form = new FormData();
        form.append("file", file, name);
        const response = await fetch("/api/assets", { method: "POST", body: form });
        const data = await response.json();
        if (!response.ok)
            throw new Error(data.error || "파일 업로드에 실패했습니다.");
        return data.url as string;
    })();
    fileUploads.set(file, task);
    void task.catch(() => fileUploads.delete(file));
    return task;
}
const uploads = new Map<string, Promise<string>>();
export async function cloudImage(source: string) {
    if (/^\/api\/assets\/[0-9a-f-]{36}$/.test(source))
        return source;
    if (!source.startsWith("data:image/") && !source.startsWith("blob:"))
        return source;
    if (!uploads.has(source))
        uploads.set(source, (async () => {
            try {
                const response = await fetch(source);
                return await uploadFile(await response.blob());
            }
            catch (error) {
                uploads.delete(source);
                throw error;
            }
        })());
    return uploads.get(source)!;
}
export async function portableState(value: unknown): Promise<unknown> {
    if (value instanceof File)
        return { __cloudFile: true, name: value.name, type: value.type, size: value.size, url: await uploadFile(value, value.name) };
    if (typeof value === "string")
        return cloudImage(value);
    if (Array.isArray(value))
        return Promise.all(value.map(portableState));
    if (value && typeof value === "object")
        return Object.fromEntries(await Promise.all(Object.entries(value).filter(([, v]) => typeof v !== "function").map(async ([k, v]) => [k, await portableState(v)])));
    return value;
}
export async function restoreState(value: unknown): Promise<unknown> {
    if (value && typeof value === "object" && "__cloudFile" in value) {
        const v = value as unknown as {
            url: string;
            name: string;
            type: string;
        };
        const response = await fetch(v.url);
        if (!response.ok)
            throw new Error("저장된 첨부 파일을 불러오지 못했습니다.");
        const file = new File([await response.blob()], v.name, { type: v.type });
        fileUploads.set(file, Promise.resolve(v.url));
        return file;
    }
    if (Array.isArray(value))
        return Promise.all(value.map(restoreState));
    if (value && typeof value === "object")
        return Object.fromEntries(await Promise.all(Object.entries(value).map(async ([k, v]) => [k, await restoreState(v)])));
    return value;
}
