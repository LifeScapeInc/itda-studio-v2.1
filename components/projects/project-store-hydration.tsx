"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useProjectStore } from "@/stores/useProjectStore";
import { useCreateStore } from "@/stores/useCreateStore";
import { installWorkspaceSync } from "@/system/cloud/workspace-sync";
import { saveGenerationHistory } from "@/system/create/generation-library";
import { reportCloudError, useCloudSyncStore } from "@/stores/useCloudSyncStore";
export function ProjectStoreHydration() {
    const authenticatedPage = usePathname() !== "/login";
    const hydrateProjects=useProjectStore(state=>state.hydrate);
    const hydrateLibrary=useCreateStore(state=>state.hydrateLibrary);
    useEffect(() => {
        if (!authenticatedPage)
            return;
        let active = true;
        let unsubscribe: (() => void) | undefined;
        const start = async () => {
            useCloudSyncStore.setState(s => ({ restoring: s.restoring + 1 }));
            try {
                // Only tab IDs are browser preferences; projects come from the API.
                await Promise.resolve(useProjectStore.persist.rehydrate());
                await Promise.all([hydrateProjects(), hydrateLibrary()]);
                if (active) {
                    const stopWorkspace = installWorkspaceSync();
                    let timer: ReturnType<typeof setTimeout> | undefined;
                    const stopHistory = useCreateStore.subscribe((state, previous) => {
                        if (state.generationHistory === previous.generationHistory)
                            return;
                        if (timer)
                            clearTimeout(timer);
                        timer = setTimeout(() => void saveGenerationHistory(useCreateStore.getState().generationHistory).catch(() => undefined), 400);
                    });
                    unsubscribe = () => { if (timer)
                        clearTimeout(timer); stopHistory(); stopWorkspace(); };
                }
            }
            catch (error) {
                reportCloudError(error, start);
                throw error;
            }
            finally {
                useCloudSyncStore.setState(s => ({ restoring: Math.max(0, s.restoring - 1) }));
            }
        };
        void start().catch(() => undefined);
        return () => { active = false; unsubscribe?.(); };
    }, [authenticatedPage,hydrateProjects,hydrateLibrary]);
    return null;
}
