"use client";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { useCreateStore } from "@/stores/useCreateStore";
import { loadBrands, type BrandCollection } from "@/system/brand/brand-library";
import { LoadingImage } from "@/components/ui/loading-image";
import { MaterialPreparationSection } from "./material-preparation-layout";
const Body = styled.div`
 display: flex; min-width: 0; flex-direction: column; gap: 8px;
 select { width: 100%; height: 32px; padding: 0 8px; border: 1px solid var(--color-border); border-radius: 4px; background: var(--color-main-neutral-light); color: var(--color-label-studio-black); font: inherit; font-size: 12px; }
 p { font-size: 11px; line-height: 1.6; color: var(--color-label-studio-comment); }
`;
const Preview = styled.div`
 display: flex; width: 100%; gap: 6px;
 > div { flex: 1; min-width: 0; position: relative; aspect-ratio: 1; border-radius: 4px; overflow: hidden; background: var(--color-main-neutral-light); }
 img { object-fit: cover; }
`;
export function BrandAssignment() {
 const [brands, setBrands] = useState<BrandCollection[]>([]);
 const [loaded, setLoaded] = useState(false);
 const [failed, setFailed] = useState(false);
 const selected = useCreateStore(state => state.brandSelection);
 const setSelected = useCreateStore(state => state.setBrandSelection);
 useEffect(() => {
   let active = true;
   const refresh = () => { void loadBrands().then(value => { if (active) { setBrands(value); setLoaded(true); setFailed(false); } }).catch(() => { if (active) { setLoaded(true); setFailed(true); } }); };
   refresh();
   window.addEventListener("focus", refresh);
   return () => { active = false; window.removeEventListener("focus", refresh); };
 }, []);
 const brand = brands.find(item => item.id === selected?.id);
 const previewImages = brand?.images.filter(image => image.caseType !== "negative").slice(0, 3) ?? [];
 return <MaterialPreparationSection index={3} title="브랜드 지정"><Body>
   <select aria-label="브랜드 자료 모음 선택" value={selected?.id ?? ""} disabled={!loaded || failed} onChange={event => {
     const next = brands.find(item => item.id === event.target.value);
     setSelected(next ? { id: next.id, name: next.name, version: next.version } : null);
   }}>
     <option value="">{loaded ? "브랜드 지정 안 함" : "브랜드 불러오는 중"}</option>
     {selected && !brand && <option value={selected.id}>{selected.name} · 저장된 지정</option>}
     {brands.map(item => <option key={item.id} value={item.id}>{item.name} · {item.images.length}장</option>)}
   </select>
   {previewImages.length > 0 && <Preview>{previewImages.map(image => <div key={image.id}><LoadingImage src={image.imageUrl} alt={image.name} fill unoptimized sizes="(max-width: 1200px) 120px, 160px" /></div>)}</Preview>}
   {failed ? <p role="alert">브랜드 자료를 불러오지 못했습니다.</p> : loaded && !brands.length && !selected ? <p>등록된 브랜드가 없습니다. 브랜드 페이지에서 자료 모음을 추가해 주세요.</p> : null}
 </Body></MaterialPreparationSection>;
}
