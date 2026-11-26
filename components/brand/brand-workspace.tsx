"use client";

import { useEffect, useState } from "react";
import { Images, Plus } from "lucide-react";
import { LibraryDetailHeader } from "@/components/references/library-detail-header";
import styled from "styled-components";
import { NavigationLeft } from "@/components/layout/navigation-left";
import { NavigationTop } from "@/components/layout/navigation-top";
import { BrandCard } from "./brand-card";
import { EditableTitle } from "@/components/ui/editable-title";
import { LabelTitle } from "@/components/ui/label-title";
import { BrandAnalysisPanel } from "./brand-analysis-panel";
import { BrandImages } from "./brand-images";
import { StudioShell, WorkspaceContent } from "@/system/styles/layout";
import { useBrandStore } from "@/stores/useBrandStore";
import { readBrandImages, reviseBrand, type BrandCase } from "@/system/brand/brand-library";

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
const ErrorMessage = styled.p`margin-top: 16px; font-size: 13px; line-height: 1.6; color: var(--color-label-studio-black);`;

export function BrandWorkspace({ id }: { id?: string }) {
 const brands = useBrandStore(state => state.brands);
 const loaded = useBrandStore(state => state.loaded);
 const pendingIds = useBrandStore(state => state.pendingIds);
 const storedError = useBrandStore(state => state.error);
 const hydrate = useBrandStore(state => state.hydrate);
 const change = useBrandStore(state => state.change);
 const addBrand = useBrandStore(state => state.add);
 const [error, setError] = useState("");
 const brand = brands.find(item => item.id === id);
 useEffect(() => { void hydrate(); }, [hydrate]);
 const rename = (value: string) => { if (id) void change(id, current => current ? reviseBrand(current, { name: value }) : null); };
 const addImages = (files: File[], caseType: BrandCase) => {
   if (!id || !files.length) return;
   setError("");
   void readBrandImages(files).then(rows => {
     const images = rows.map(image => ({ ...image, caseType }));
     return change(id, current => current ? reviseBrand(current, { images: [...current.images, ...images] }) : null);
   }).catch(reason => setError(reason instanceof Error ? reason.message : "이미지를 읽지 못했습니다."));
 };
 return <StudioShell><NavigationTop /><NavigationLeft /><Workspace $detail={Boolean(id)}>
   {!id ? <>
     <Toolbar><LabelTitle title="브랜드" description="브랜드별 제품과 연출 이미지를 모아 브랜드 적합성 평가의 기준으로 사용합니다." /><Action disabled={!loaded} onClick={addBrand}><Plus size={16} />브랜드 추가</Action></Toolbar>
     {loaded && brands.length > 0 ? <Grid aria-label="브랜드 자료 모음 목록">{brands.map(item => <BrandCard key={item.id} brand={item} onDelete={() => {
       if (window.confirm(`‘${item.name}’ 브랜드와 등록된 이미지를 삭제할까요?`)) void change(item.id, () => null);
     }} onRename={value => void change(item.id, current => current ? reviseBrand(current, { name: value }) : null)} />)}</Grid> : <Empty><Images size={36} strokeWidth={1.4} /><p>{loaded ? "등록된 브랜드가 없습니다. 브랜드를 추가하고 기준 이미지를 모아 보세요." : "브랜드를 불러오는 중입니다."}</p></Empty>}
   </> : <>
     {brand ? <>
       <LibraryDetailHeader href="/brand" backLabel="브랜드 목록" title={<EditableTitle value={brand.name} onSave={rename} label="브랜드 이름" />} description={`${brand.images.length}장의 이미지`} />
       <DetailContent>
         <BrandAnalysisPanel brandId={brand.id} revision={brand.version} positiveCount={brand.images.filter(image => image.caseType !== "negative").length} pendingWrite={pendingIds.includes(brand.id)} />
         <BrandImages key={brand.id} images={brand.images} busy={false} onAdd={addImages}
           onMove={(ids, caseType) => { void change(brand.id, current => current ? reviseBrand(current, { images: current.images.map(image => ids.includes(image.id) ? { ...image, caseType } : image) }) : null); }}
           onRemove={ids => { void change(brand.id, current => current ? reviseBrand(current, { images: current.images.filter(image => !ids.includes(image.id)) }) : null); }}
         />
       </DetailContent>
     </> : <Empty><p>{loaded ? "브랜드를 찾을 수 없습니다." : "브랜드를 불러오는 중입니다."}</p></Empty>}
   </>}
   {(error || storedError) && <ErrorMessage role="alert">{error || storedError}</ErrorMessage>}
 </Workspace></StudioShell>;
}
