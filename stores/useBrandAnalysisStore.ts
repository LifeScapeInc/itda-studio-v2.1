"use client";
import { create } from "zustand";
import { cloudRequest } from "@/system/cloud/client";
import { brandAnalysisSchema, analysisIsPending, type BrandAnalysis } from "@/system/brand/brand-analysis";
type Entry = { analysis?: BrandAnalysis; loading: boolean; error: string | null };
type Store = { entries: Record<string, Entry>; load: (id: string) => Promise<void>; run: (id: string, trigger: "initial" | "manual") => Promise<void> };
const requests = new Map<string, Promise<void>>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const tokens = new Map<string, number>();
export const useBrandAnalysisStore = create<Store>((set, get) => {
 const poll = (id: string) => {
   if (timers.has(id)) clearTimeout(timers.get(id));
   timers.delete(id);
   if (!analysisIsPending(get().entries[id]?.analysis)) return;
   timers.set(id, setTimeout(() => { timers.delete(id); void get().load(id); }, 2500));
 };
 const update = (id: string, changes: Partial<Entry>) => set(state => ({ entries: { ...state.entries, [id]: { ...(state.entries[id] ?? { loading: false, error: null }), ...changes } } }));
 return {
   entries: {},
   load: id => {
     if (requests.has(id)) return requests.get(id)!;
     const token = tokens.get(id) ?? 0;
     if (!get().entries[id]?.analysis) update(id, { loading: true });
     const task = cloudRequest<unknown>(`brand-analysis/${id}`).then(data => {
       if ((tokens.get(id) ?? 0) !== token) return;
       update(id, { analysis: brandAnalysisSchema.parse(data), loading: false, error: null });
     }).catch(error => { if ((tokens.get(id) ?? 0) === token) update(id, { loading: false, error: error instanceof Error ? error.message : "브랜드 분석을 불러오지 못했습니다." }); })
       .finally(() => { if (requests.get(id) === task) requests.delete(id); poll(id); });
     requests.set(id, task); return task;
   },
   run: async (id, trigger) => {
     const token = (tokens.get(id) ?? 0) + 1; tokens.set(id, token);
     const previous = get().entries[id]?.analysis;
     update(id, { loading: true, error: null, analysis: { ...previous, status: "queued" } });
     try {
       const analysis = brandAnalysisSchema.parse(await cloudRequest(`brand-analysis/${id}`, { trigger }));
       if (tokens.get(id) === token) update(id, { analysis, loading: false });
     } catch (error) {
       if (tokens.get(id) === token) update(id, { analysis: previous, loading: false, error: error instanceof Error ? error.message : "브랜드 분석 요청에 실패했습니다." });
     } finally { poll(id); }
   },
 };
});
