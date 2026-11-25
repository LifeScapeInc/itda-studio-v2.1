import "server-only";
import { list } from "./cloud-db";
import { readAsset } from "./cloud-assets";
import { stableId } from "./cloud-studio";
import { isTokenUsageRecord, type TokenUsageRecord, type TokenUsageContext } from "@/system/usage/token-usage";
type UsageRow = {
    id: string;
    occurred_at: string;
    total: number;
    input_text: number;
    input_image: number;
    output_text: number;
    output_image: number;
    model: string;
    context: TokenUsageContext;
};
export async function loadUsage(): Promise<TokenUsageRecord[]> {
    const [rows, archives] = await Promise.all([
        list<UsageRow>("usage_records", "order=occurred_at,id"),
        list<{
            id: string;
        }>("assets", "filename=eq.browser-local-state.json&mime_type=eq.application%2Fjson&status=eq.ready&deleted_at=is.null&select=id&order=created_at.desc,id")
    ]);
    const old: TokenUsageRecord[] = [];
    if (archives[0]) {
        // The initial import retained unlinked historical calls in this private R2
        // archive. Read those records without inventing AI runs or duplicating them.
        const { bytes } = await readAsset(archives[0].id);
        const archive = JSON.parse(bytes.toString("utf8")) as {
            local?: Record<string, string | null>;
        };
        const records: unknown = JSON.parse(archive.local?.["itda-studio-v2.1:token-usage-records"] ?? "[]");
        if (Array.isArray(records))
            for (const record of records)
                if (isTokenUsageRecord(record))
                    old.push({ ...record, id: stableId(`usage:${record.id}`) });
    }
    const current = rows.map(r => ({ id: r.id, occurredAt: r.occurred_at, usage: { total: Number(r.total), inputText: Number(r.input_text), inputImage: Number(r.input_image), outputText: Number(r.output_text), outputImage: Number(r.output_image) }, context: { ...r.context, model: r.model } }));
    return [...new Map([...old, ...current].map(r => [r.id, r])).values()].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
}
