"use client";
import { useCloudSyncStore } from "@/stores/useCloudSyncStore";
export function CloudSyncStatus() {
    const { error, retry, clear, restoring } = useCloudSyncStore();
    if (restoring)
        return <div role="status" style={{ position: "fixed", inset: 0, zIndex: 9999, display: "grid", placeItems: "center", background: "rgba(127,127,127,.12)", backdropFilter: "blur(2px)" }}>저장된 작업을 불러오는 중…</div>;
    if (!error)
        return null;
    return <aside role="alert" style={{ position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)", zIndex: 10000, background: "var(--surface-1, #fff)", color: "var(--text-primary, #222)", border: "1px solid #be453c", borderRadius: 8, padding: "12px 16px", maxWidth: 640 }}>
    <span>{error}</span> {retry && <button onClick={() => void retry().then(clear).catch(() => undefined)}>다시 저장</button>} <button onClick={clear} aria-label="저장 알림 닫기">닫기</button>
  </aside>;
}
