"use client";
import { create } from "zustand";
import { cloudRequest } from "@/system/cloud/client";
import { loadBookmarkedImages, type LibraryGenerationShot } from "@/system/create/generation-library";
import { useCreateStore } from "./useCreateStore";
import { reportCloudError } from "./useCloudSyncStore";
type Store = { rows: LibraryGenerationShot[]; loaded: boolean; hydrate: () => Promise<void>; remove: (id: string) => void };
const removing = new Set<string>();
let epoch = 0;
export const useBookmarkStore = create<Store>((set, get) => ({
 rows: [], loaded: false,
 hydrate: async () => {
   const started = epoch;
   // Reflect bookmarked/unbookmarked results from the active client state while
   // the save queue and the remote bookmark listing are still in flight.
   const create = useCreateStore.getState();
   const live = new Map<string, LibraryGenerationShot>();
   for (const shot of [...create.generationHistory.flatMap(history => history.shots), ...create.generationShots]) {
     const asset = shot.imageUrl?.match(/^\/api\/assets\/([0-9a-f-]{36})$/)?.[1];
     if (asset && shot.status === "done") live.set(`bookmark:${asset}`, shot as LibraryGenerationShot);
   }
   if (live.size) set(state => {
     const rows = new Map(state.rows.map(row => [row.id, row]));
     for (const [id, shot] of live) { if (shot.bookmarked && !removing.has(id)) rows.set(id, { ...shot, id }); else rows.delete(id); }
     return { rows: [...rows.values()] };
   });
   try { const rows = await loadBookmarkedImages(); if (started === epoch) set({ rows: rows.filter(row => !removing.has(row.id)), loaded: true }); }
   catch (error) { reportCloudError(error); }
 },
 remove: id => {
   if (removing.has(id)) return;
   const row = get().rows.find(item => item.id === id);
   if (!row) return;
   const index = get().rows.indexOf(row);
   epoch++; removing.add(id);
   set(state => ({ rows: state.rows.filter(item => item.id !== id) }));
   void cloudRequest("delete-bookmark", { id: id.replace("bookmark:", "") }).then(async () => {
     removing.delete(id); epoch++;
     await useCreateStore.getState().hydrateLibrary(true);
   }).catch(error => {
     removing.delete(id); epoch++;
     set(state => { const rows = [...state.rows]; if (!rows.some(item => item.id === id)) rows.splice(Math.min(index, rows.length), 0, row); return { rows }; });
     reportCloudError(error);
   });
 },
}));
