import { cloudRequest, cloudImage } from "@/system/cloud/client";
export type BrandCase = "positive" | "negative";
export type BrandImage = {
    id: string;
    name: string;
    imageUrl: string;
    caseType?: BrandCase;
};
export type BrandCollection = {
    id: string;
    name: string;
    version: number;
    createdAt: string;
    updatedAt: string;
    images: BrandImage[];
};
export type BrandSelection = Pick<BrandCollection, "id" | "name" | "version">;
export async function loadBrands(): Promise<BrandCollection[]> { return cloudRequest<BrandCollection[]>("brands"); }
const brandQueues = new Map<string, Promise<void>>();
export function updateBrand(id: string, update: (current: BrandCollection | undefined) => BrandCollection | null): Promise<void> {
    const task = (brandQueues.get(id) ?? Promise.resolve()).catch(() => undefined).then(async () => {
        const current = (await loadBrands()).find(b => b.id === id);
        const next = update(current);
        if (!next) {
            if (current)
                await cloudRequest("delete-brand", { id, version: current.version });
            return;
        }
        const images = await Promise.all(next.images.map(async (i) => ({ ...i, imageUrl: await cloudImage(i.imageUrl) })));
        await cloudRequest("brands", { brand: { ...next, images }, expectedVersion: current?.version ?? 0 });
    });
    brandQueues.set(id, task);
    return task;
}
export async function createBrand(name: string): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await updateBrand(id, () => ({ id, name: name.trim().slice(0, 120) || "새 브랜드", version: 1, createdAt: now, updatedAt: now, images: [] }));
    return id;
}
export function reviseBrand(brand: BrandCollection, changes: Partial<Pick<BrandCollection, "name" | "images">>): BrandCollection {
    return { ...brand, ...changes, version: brand.version + 1, updatedAt: new Date().toISOString() };
}
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
export async function readBrandImages(files: File[]): Promise<BrandImage[]> {
    if (files.some(file => !IMAGE_TYPES.has(file.type)))
        throw new Error("JPG, PNG, WEBP, AVIF 또는 GIF 이미지만 추가할 수 있습니다.");
    return Promise.all(files.map(file => new Promise<BrandImage>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const imageUrl = reader.result as string;
            const image = new Image();
            image.onload = () => resolve({ id: crypto.randomUUID(), name: file.name, imageUrl });
            image.onerror = () => reject(new Error(`‘${file.name}’ 파일을 이미지로 열 수 없습니다.`));
            image.src = imageUrl;
        };
        reader.onerror = () => reject(new Error("이미지를 읽지 못했습니다. 다시 시도해 주세요."));
        reader.readAsDataURL(file);
    })));
}
