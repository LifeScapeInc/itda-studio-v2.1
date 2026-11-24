"use client";
import { Fragment, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { ImagePlus } from "lucide-react";
import styled from "styled-components";
import { LoadingImage } from "@/components/ui/loading-image";
import { MoodboardDetailViewer } from "@/components/moodboard/moodboard-detail-viewer";
import type { BrandCase, BrandImage } from "@/system/brand/brand-library";
const Root = styled.div`
 display: grid; min-height: 0; flex: 1; grid-template-columns: minmax(0, calc((100% - 12px) * var(--brand-positive-ratio, .5))) 12px minmax(0, 1fr); overflow: hidden; margin-top: 24px;
`;
const Section = styled.section`
 display: flex; min-width: 0; min-height: 0; flex-direction: column; overflow: hidden; border: 0;
 & + & { border: 0; padding-top: 0; }
 h2 { margin: 0; font-size: 14px; font-weight: 500; }
 header { flex-shrink: 0; display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
 span { color: var(--color-label-studio-comment); font-size: 12px; }

`;
const Grid = styled.div`
 min-width: 0; min-height: 0; flex: 1; overflow-y: auto; padding-bottom: 4px; display: grid; grid-template-columns: repeat(auto-fill, 132px); align-content: start; gap: 12px;
`;
const Divider = styled.div`
 position: relative; cursor: col-resize; touch-action: none; user-select: none;
 &::after { content: ""; position: absolute; top: 50%; left: 50%; width: 2px; height: 32px; border-radius: 2px; background: var(--color-label-disabled); transform: translate(-50%, -50%); }
 &:hover::after, &:active::after, &:focus-visible::after { background: var(--color-main-primary); }
`;
const Photo = styled.button<{ $selected: boolean }>`
 position: relative; width: 132px; height: 132px; padding: 0;
 border: 2px solid ${({ $selected }) => $selected ? "var(--color-main-primary)" : "transparent"};
 border-radius: var(--radius-panel); overflow: hidden; background: var(--color-main-neutral-light); cursor: pointer;
 img { object-fit: contain; }
`;
const Upload = styled.button<{ $dragging: boolean }>`
 display: flex; width: 100%; height: 112px; flex: 0 0 112px; margin-top: 16px; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
 border: 1px dashed ${({ $dragging }) => $dragging ? "var(--color-main-primary)" : "var(--color-border)"}; border-radius: var(--radius-panel); background: ${({ $dragging }) => $dragging ? "var(--color-main-neutral)" : "transparent"};
 color: var(--color-label-studio-comment); font-size: 12px; cursor: pointer;
 small { font-size: 11px; line-height: 1.4; }
 &:hover:not(:disabled) { background: var(--color-main-neutral-light); }
 &:disabled { opacity: .5; cursor: default; }
`;
export function BrandImages({ images, busy, onAdd }: { images: BrandImage[]; busy: boolean; onAdd: (files: File[], caseType: BrandCase) => void }) {
 const root = useRef<HTMLDivElement>(null);
 const [ratio, setRatio] = useState(.5);
 const liveRatio = useRef(.5);
 const setSplit = (value: number) => {
   const width = Math.max(1, (root.current?.clientWidth ?? 600) - 12);
   const minimum = Math.min(.4, 156 / width);
   liveRatio.current = Math.max(minimum, Math.min(1 - minimum, value));
   root.current?.style.setProperty("--brand-positive-ratio", String(liveRatio.current));
 };
 const [selected, setSelected] = useState<string[]>([]);
 const [anchor, setAnchor] = useState<string | null>(null);
 const [dragging, setDragging] = useState<BrandCase | null>(null);
 const [viewing, setViewing] = useState<string | null>(null);
 const input = useRef<HTMLInputElement>(null);
 const uploadCase = useRef<BrandCase>("positive");
 const ordered = [...images.filter(image => image.caseType !== "negative"), ...images.filter(image => image.caseType === "negative")];
 const clickImage = (event: MouseEvent<HTMLButtonElement>, image: BrandImage) => {
   const additive = event.ctrlKey || event.metaKey;
   if (event.shiftKey) {
     const start = ordered.findIndex(item => item.id === (anchor ?? image.id));
     const end = ordered.findIndex(item => item.id === image.id);
     const range = ordered.slice(Math.min(start < 0 ? end : start, end), Math.max(start, end) + 1).map(item => item.id);
     setSelected(previous => additive ? [...new Set([...previous, ...range])] : range);
     if (!anchor) setAnchor(image.id);
   } else {
     setSelected(previous => additive ? previous.includes(image.id) ? previous.filter(id => id !== image.id) : [...previous, image.id] : [image.id]);
     setAnchor(image.id);
   }
   if (!additive && !event.shiftKey) setViewing(image.id);
 };
 return <><Root ref={root} style={{ "--brand-positive-ratio": ratio } as CSSProperties} onDragOver={event => { if (event.dataTransfer.types.includes("Files") && !event.defaultPrevented) { event.preventDefault(); event.dataTransfer.dropEffect = "none"; } }} onDrop={event => { if (event.dataTransfer.types.includes("Files")) event.preventDefault(); setDragging(null); }}>
   {(["positive", "negative"] as const).map(caseType => {
     const group = ordered.filter(image => (image.caseType ?? "positive") === caseType);
     const label = caseType === "positive" ? "긍정 사례" : "부정 사례";
     return <Fragment key={caseType}><Section id={`brand-${caseType}`} aria-label={label}><header><h2>{label}</h2><span>{group.length}장</span></header><Grid>
       {group.map(image => <Photo key={image.id} type="button" $selected={selected.includes(image.id)} aria-pressed={selected.includes(image.id)} aria-label={`${image.name} 크게 보기`} onClick={event => clickImage(event, image)} onMouseDown={event => { if (event.shiftKey) event.preventDefault(); }}><LoadingImage src={image.imageUrl} alt={image.name} fill unoptimized sizes="132px" /></Photo>)}
     </Grid>
       <Upload type="button" $dragging={!busy && dragging === caseType} disabled={busy}
         onDragEnter={event => { if (!busy && event.dataTransfer.types.includes("Files")) { event.preventDefault(); setDragging(caseType); } }}
         onDragOver={event => { if (!event.dataTransfer.types.includes("Files")) return; event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = busy ? "none" : "copy"; if (!busy) setDragging(caseType); }}
         onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(null); }}
         onDrop={event => { event.preventDefault(); event.stopPropagation(); setDragging(null); if (!busy) onAdd(Array.from(event.dataTransfer.files), caseType); }} aria-label={`${label} 이미지 추가`} onClick={() => { uploadCase.current = caseType; input.current?.click(); }}><ImagePlus size={24} strokeWidth={1.4} /><span>{!busy && dragging === caseType ? "여기에 놓기" : "이미지 추가"}</span><small>또는 여기로 드래그</small></Upload>
     </Section>{caseType === "positive" && <Divider role="separator" tabIndex={0} aria-label="긍정 사례와 부정 사례 너비 조절" aria-orientation="vertical" aria-controls="brand-positive brand-negative" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(ratio * 100)}
       onPointerDown={event => { if (event.button !== 0) return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); }}
       onPointerMove={event => { if (!event.currentTarget.hasPointerCapture(event.pointerId) || !root.current) return; const rect = root.current.getBoundingClientRect(); setSplit((event.clientX - rect.left - 6) / Math.max(1, rect.width - 12)); }}
       onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) { event.currentTarget.releasePointerCapture(event.pointerId); setRatio(liveRatio.current); } }}
       onPointerCancel={() => setSplit(ratio)}
       onDoubleClick={() => { setSplit(.5); setRatio(.5); }}
       onKeyDown={event => { if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return; event.preventDefault(); setSplit(event.key === "Home" ? 0 : event.key === "End" ? 1 : ratio + (event.key === "ArrowLeft" ? -.05 : .05)); setRatio(liveRatio.current); }}
     />}</Fragment>;
   })}
 </Root>
 <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" multiple hidden onChange={event => { onAdd(Array.from(event.target.files ?? []), uploadCase.current); event.target.value = ""; }} />
 {viewing && <MoodboardDetailViewer key={viewing} name="브랜드 사례" images={ordered.map(image => image.imageUrl)} initialIndex={Math.max(0, ordered.findIndex(image => image.id === viewing))} isOpen onClose={() => setViewing(null)} />}
 </>;
}
