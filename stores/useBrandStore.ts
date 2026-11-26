"use client";
import { create } from "zustand";
import { cloudImage, cloudRequest } from "@/system/cloud/client";
import { createOptimisticRecord } from "@/system/cloud/optimistic-record";
import { loadBrands, type BrandCollection } from "@/system/brand/brand-library";
import { reportCloudError } from "./useCloudSyncStore";
type BrandStore = {
 pendingIds: string[]; brands: BrandCollection[]; loaded: boolean; error: string | null;
 hydrate: (force?: boolean) => Promise<void>;
 change: (id: string, update: (brand: BrandCollection | null) => BrandCollection | null) => Promise<void>;
 add: () => void;
};
const queues = new Map<string, ReturnType<typeof createOptimisticRecord<BrandCollection>>>();
let loading: Promise<void> | null = null;
let epoch = 0;
export const useBrandStore = create<BrandStore>((set, get) => ({
 pendingIds: [], brands: [], loaded: false, error: null,
 hydrate: (force = false) => {
   if (loading) return loading;
   if (get().loaded && !force) return Promise.resolve();
   const started = epoch;
   loading = loadBrands().then(brands => { if (started === epoch && !queues.size) set({ brands, error: null }); set({ loaded: true }); })
     .catch(error => { set({ loaded: true, error: error instanceof Error ? error.message : "브랜드를 불러오지 못했습니다." }); })
     .finally(() => { loading = null; });
   return loading;
 },
 change: async (id, update) => {
   epoch++; set({ error: null });
   if (!queues.has(id)) {
     const initial = get().brands.find(brand => brand.id === id) ?? null;
     queues.set(id, createOptimisticRecord(initial, (value, pending) => {
       epoch++;
       set(state => ({ pendingIds: pending ? [...new Set([...state.pendingIds, id])] : state.pendingIds.filter(item => item !== id), brands: value ? state.brands.some(brand => brand.id === id) ? state.brands.map(brand => brand.id === id ? value : brand) : [value, ...state.brands] : state.brands.filter(brand => brand.id !== id) }));
       if (!pending) queues.delete(id);
     }));
   }
   try {
     await queues.get(id)!.enqueue(update, async (next, previous) => {
       if (!next) { if (previous) await cloudRequest("delete-brand", { id, version: previous.version }); return null; }
       const images = await Promise.all(next.images.map(async image => ({ ...image, imageUrl: await cloudImage(image.imageUrl) })));
       const result = await cloudRequest<{ version: number }>("brands", { brand: { ...next, images }, expectedVersion: previous?.version ?? 0 });
       return { ...next, images, version: result.version };
     });
   } catch (error) { set({ error: error instanceof Error ? error.message : "브랜드를 저장하지 못했습니다." }); reportCloudError(error); }
 },
 add: () => {
   const id = crypto.randomUUID(), now = new Date().toISOString();
   void get().change(id, () => ({ id, name: "새 브랜드", version: 1, createdAt: now, updatedAt: now, images: [] }));
 },
}));
