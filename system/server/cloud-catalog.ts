import "server-only";
import { list, cloudConfig } from "./cloud-db";
import { assetUrl } from "./cloud-assets";
import type { Moodboard } from "@/system/moodboard/moodboards";
import type { FurnitureCategory } from "@/system/furniture/furniture-catalog";
import { MOODBOARD_CANVAS, type MoodboardLayoutManifest, type MoodboardLayoutItem } from "@/system/moodboard/moodboard-layout";
import { createMoodboardLayoutManifest } from "@/system/moodboard/moodboard-layout";
type MoodRow = {
    id: string;
    slug: string;
    name: string;
    description: string;
    created_at: string;
};
type MoodItem = {
    moodboard_id: string;
    asset_id: string;
    position: number;
    layout: Partial<MoodboardLayoutItem>;
};
export async function cloudMoodboards(): Promise<Moodboard[]> {
    const [moods, items] = await Promise.all([list<MoodRow>("moodboards", "deleted_at=is.null&order=slug,id"), list<MoodItem>("moodboard_items", "order=position,id")]);
    return moods.map(m => ({ slug: m.slug, name: m.name, description: m.description, previewImages: items.filter(i => i.moodboard_id === m.id).slice(0, 3).map(i => assetUrl(i.asset_id)) }));
}
export async function cloudMoodboardDetail(slug: string) {
    const moods = await list<MoodRow>("moodboards", `slug=eq.${encodeURIComponent(slug)}&deleted_at=is.null`);
    const mood = moods[0];
    if (!mood)
        return null;
    const items = await list<MoodItem>("moodboard_items", `moodboard_id=eq.${mood.id}&order=position,id`);
    const sources = items.map(i => ({ src: assetUrl(i.asset_id), fileName: i.layout.fileName ?? i.asset_id, width: i.layout.width ?? 1024, height: i.layout.height ?? 1024, colorEmbedding: i.layout.colorEmbedding ?? [0, 0, 0, 0, 0] as [
            number,
            number,
            number,
            number,
            number
        ], colorDistance: i.layout.colorDistance ?? 0, weight: i.layout.weight ?? 1 }));
    let manifest: MoodboardLayoutManifest;
    if (items.every(i => i.layout.rect))
        manifest = { version: 1, style: slug, generatedAt: mood.created_at, seed: 1, canvas: MOODBOARD_CANVAS, items: sources.map((s, index) => ({ ...s, rect: items[index].layout.rect! })) };
    else
        manifest = createMoodboardLayoutManifest(slug, sources);
    return { moodboard: { slug, name: mood.name, description: mood.description, previewImages: sources.slice(0, 3).map(s => s.src) }, manifest };
}
export async function cloudFurniture(): Promise<FurnitureCategory[]> {
    const [categories, items] = await Promise.all([list<{
            id: string;
            slug: string;
            name: string;
            description: string;
        }>("furniture_categories", "order=slug,id"), list<{
            id: string;
            category_id: string;
            images: {
                asset_id: string;
                position: number;
            }[];
        }>("furniture_items", "deleted_at=is.null&order=name,id")]);
    return categories.map(c => { const images = items.filter(i => i.category_id === c.id).flatMap(i => i.images.sort((a, b) => a.position - b.position).map(a => assetUrl(a.asset_id))); return { slug: c.slug, name: c.name, description: c.description, images, previewImages: images.slice(0, 3) }; });
}
export async function cloudReferenceLibrary() {
    const [furniture, moods, items, bookmarks] = await Promise.all([cloudFurniture(), cloudMoodboards(), list<MoodItem>("moodboard_items", "order=position,id"), list<{
            asset_id: string;
        }>("bookmarks", `user_id=eq.${cloudConfig().owner}&order=created_at.desc,asset_id`)]);
    const moodRows = await list<MoodRow>("moodboards", "deleted_at=is.null&order=slug,id");
    return { furniture: furniture.map(c => ({ id: c.slug, name: c.name, description: c.description, previewImages: c.previewImages, images: c.images })), mood: moods.map(m => ({ id: m.slug, name: m.name, description: m.description, previewImages: m.previewImages, images: items.filter(i => i.moodboard_id === moodRows.find(r => r.slug === m.slug)?.id).map(i => assetUrl(i.asset_id)) })), bookmarks: bookmarks.length ? [{ id: "bookmarks", name: "북마크", description: "저장한 이미지", images: bookmarks.map(b => assetUrl(b.asset_id)), previewImages: bookmarks.slice(0, 3).map(b => assetUrl(b.asset_id)) }] : [] };
}
