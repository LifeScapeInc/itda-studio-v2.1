"use client";

import { useEffect, useRef, useState } from "react";
import { ChartNoAxesCombined, Images, Plus } from "lucide-react";
import { LibraryDetailHeader } from "@/components/references/library-detail-header";
import styled from "styled-components";
import { NavigationLeft } from "@/components/layout/navigation-left";
import { NavigationTop } from "@/components/layout/navigation-top";
import { BrandCard } from "./brand-card";
import { EditableTitle } from "@/components/ui/editable-title";
import { LabelTitle } from "@/components/ui/label-title";
import { BrandImages } from "./brand-images";
import { StudioShell, WorkspaceContent } from "@/system/styles/layout";
import { createBrand, loadBrands, readBrandImages, reviseBrand, updateBrand, type BrandCollection, type BrandCase } from "@/system/brand/brand-library";

const Workspace = styled(WorkspaceContent)<{ $detail: boolean }>`background: var(--color-background-workspace); padding-top: ${({ $detail }) => $detail ? "60px" : "64px"};`;
const Toolbar = styled.div`
 display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-shrink: 0;
 > header { min-width: 0; flex: 1; }
`;
const Action = styled.button`
 display: inline-flex; height: 32px; align-items: center; justify-content: center; gap: 8px;
 padding: 0 12px; flex-shrink: 0; border: 1px solid var(--color-border); border-radius: 4px;
 background: var(--color-surface); color: var(--color-label-studio-black); font-size: 12px; cursor: pointer;
 &:hover:not(:disabled) { background: var(--color-main-neutral); }
 &:disabled { opacity: .5; cursor: default; }
`;
const Grid = styled.section`
 display: grid; min-height: 0; margin-top: 32px; padding-block: 4px; grid-template-columns: repeat(auto-fill, minmax(280px, 336px));
 align-content: start; gap: var(--space-lg); overflow-y: auto;
`;
const Empty = styled.div`
 display: flex; flex: 1; min-height: 200px; align-items: center; justify-content: center; flex-direction: column; gap: 16px;
 color: var(--color-label-studio-comment); font-size: 13px;
 p { max-width: 520px; text-align: center; line-height: 1.6; }
`;
const DetailContent = styled.div`
 display: grid; min-height: 0; flex: 1; grid-template-rows: minmax(0, 1fr) minmax(0, 4fr); gap: 16px; margin-top: 24px;
`;
const BrandAnalysis = styled.section`
 display: flex; min-width: 0; min-height: 0; align-items: center; justify-content: center; gap: 12px; padding: 16px;
 border: 1px solid var(--color-border); border-radius: var(--radius-panel); background: var(--color-surface);
 color: var(--color-label-studio-comment);
 svg { flex-shrink: 0; }
 p { margin: 0; font-size: 13px; line-height: 1.6; }
`;
const Description = styled.p`margin-top: 8px; color: var(--color-label-studio-comment); font-size: 12px; line-height: 1.6;`;
const ErrorMessage = styled.p`margin-top: 16px; font-size: 13px; line-height: 1.6; color: var(--color-label-studio-black);`;

export function BrandWorkspace({ id }: { id?: string }) {
 const [brands, setBrands] = useState<BrandCollection[]>([]);
 const [loaded, setLoaded] = useState(false);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState("");
 const writes = useRef<Promise<void>>(Promise.resolve());
 const pending = useRef(0);
 const brand = brands.find(item => item.id === id);
 useEffect(() => {
   let active = true;
   loadBrands().then(value => { if (active) { setBrands(value); setLoaded(true); } }).catch(() => { if (active) { setError("브랜드 자료를 불러오지 못했습니다. 페이지를 새로고침해 주세요."); setLoaded(true); } });
   return () => { active = false; };
 }, []);
 const perform = (operation: () => Promise<void>) => {
   pending.current += 1;
   setBusy(true);
   const job = writes.current.then(async () => {
     setError("");
     try { await operation(); setBrands(await loadBrands()); }
     catch (reason) { setError(reason instanceof Error ? reason.message : "저장하지 못했습니다. 다시 시도해 주세요."); }
     finally { pending.current -= 1; setBusy(pending.current > 0); }
   });
   writes.current = job;
   return job;
 };
 const rename = (value: string) => { if (id) void perform(() => updateBrand(id, current => current ? reviseBrand(current, { name: value }) : null)); };
 const addImages = (files: File[], caseType: BrandCase) => {
   if (!id || !files.length) return;
   void perform(async () => {
     const images = (await readBrandImages(files)).map(image => ({ ...image, caseType }));
     await updateBrand(id, current => current ? reviseBrand(current, { images: [...current.images, ...images] }) : null);
   });
 };
 return <StudioShell><NavigationTop /><NavigationLeft /><Workspace $detail={Boolean(id)}>
   {!id ? <>
     <Toolbar><LabelTitle title="브랜드" description="브랜드별 제품과 연출 이미지를 모아 브랜드 적합성 평가의 기준으로 사용합니다." /><Action disabled={!loaded || busy} onClick={() => void perform(async () => { await createBrand("새 브랜드"); })}><Plus size={16} />브랜드 추가</Action></Toolbar>
     {loaded && brands.length > 0 ? <Grid aria-label="브랜드 자료 모음 목록">{brands.map(item => <BrandCard key={item.id} brand={item} onDelete={() => {
       if (window.confirm(`‘${item.name}’ 브랜드와 등록된 이미지를 삭제할까요?`)) void perform(() => updateBrand(item.id, () => null));
     }} onRename={value => void perform(() => updateBrand(item.id, current => current ? reviseBrand(current, { name: value }) : null))} />)}</Grid> : <Empty><Images size={36} strokeWidth={1.4} /><p>{loaded ? "등록된 브랜드가 없습니다. 브랜드를 추가하고 기준 이미지를 모아 보세요." : "브랜드를 불러오는 중입니다."}</p></Empty>}
   </> : <>
     {brand ? <>
       <LibraryDetailHeader href="/brand" backLabel="브랜드 목록" title={<EditableTitle value={brand.name} onSave={rename} label="브랜드 이름" />} description={`${brand.images.length}장의 이미지`} />
       <DetailContent>
         <BrandAnalysis aria-label="브랜드 분석"><ChartNoAxesCombined size={28} strokeWidth={1.4} aria-hidden="true" /><p>아직 충분한 자료가 모이지 않아 분석을 실행하지 않았습니다</p></BrandAnalysis>
         <BrandImages key={brand.id} images={brand.images} busy={busy} onAdd={addImages} />
       </DetailContent>
     </> : <Empty><p>{loaded ? "브랜드를 찾을 수 없습니다." : "브랜드를 불러오는 중입니다."}</p></Empty>}
   </>}
   {busy && <Description role="status">저장하는 중입니다.</Description>}
   {error && <ErrorMessage role="alert">{error}</ErrorMessage>}
 </Workspace></StudioShell>;
}
