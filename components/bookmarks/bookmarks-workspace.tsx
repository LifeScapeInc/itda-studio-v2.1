"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LibraryDetailHeader } from "@/components/references/library-detail-header";
import { ImageIcon } from "lucide-react";
import styled from "styled-components";
import { NavigationLeft } from "@/components/layout/navigation-left";
import { NavigationTop } from "@/components/layout/navigation-top";
import { LabelTitle } from "@/components/ui/label-title";
import { LoadingImage } from "@/components/ui/loading-image";
import { GenerationInputImages } from "@/components/ui/generation-input-images";
import { useCreateStore } from "@/stores/useCreateStore";
import { cloudRequest } from "@/system/cloud/client";
import { reportCloudError } from "@/stores/useCloudSyncStore";
import {
  loadBookmarkedImages,
  type LibraryGenerationShot,
} from "@/system/create/generation-library";
import { StudioShell } from "@/system/styles/layout";
import { ItemBookmark } from "./item-bookmark";

const Workspace = styled.main`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  min-height: 0;
  margin-left: var(--navigation-left-width, 54px);
  padding-top: 36px;
  background: var(--color-background-workspace);
  overflow: hidden;
  transition: margin-left 220ms ease;
`;

const Content = styled.section`
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  padding: 24px 28px 16px;
  overflow: hidden;
`;

const Grid = styled.section`
  display: grid;
  min-height: 0;
  flex: 1;
  margin-top: 24px;
  padding-block: var(--space-3xs);
  grid-template-columns: repeat(auto-fill, minmax(280px, 336px));
  align-content: start;
  gap: var(--space-lg);
  overflow-y: auto;
`;

const Details = styled.section`
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  margin: 0 28px 28px;
  border-radius: var(--radius-panel);
  background: var(--color-surface);
  overflow: hidden;
`;

const DetailHeader = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px 16px;


  strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; font-weight: 500; }

  button {
    border: 0;
    background: transparent;
    cursor: pointer;
  }
`;

const DetailPreview = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 180px;
  flex-shrink: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  background: var(--color-main-neutral-light);
  overflow: hidden;
  img { object-fit: contain; }
  @media (max-width: 900px) { height: 300px; }
`;
const DetailBody = styled.div`
  display: grid; min-height: 0; flex: 1;
  grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr);
  gap: 24px; padding: 16px 20px; overflow: hidden;
  @media (max-width: 900px) { grid-template-columns: 1fr; overflow-y: auto; }
`;
const MetadataContent = styled.div`
  display: flex; min-width: 0; min-height: 0; flex-direction: column; gap: 24px;
  overflow-y: auto; padding-right: 8px;
  @media (max-width: 900px) { overflow: visible; }
`;
const MetadataSection = styled.section`
  min-width: 0;
  h3 { margin: 0 0 12px; font-size: 13px; font-weight: 500; }
`;
const Inputs = styled.div`
  > div { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  figure { width: 100%; gap: 6px; }
  figure > div { width: 100%; height: 132px; aspect-ratio: auto; border-radius: 4px; background: var(--color-main-neutral-light); }
  img { object-fit: contain; }
  figcaption { font-size: 11px; line-height: 1.5; }
`;
const Metadata = styled.dl`
  display: grid; margin: 0; grid-template-columns: 104px minmax(0, 1fr);
  align-content: start; gap: 12px 16px; font-size: 12px; line-height: 1.6;
  dt { color: var(--color-label-studio-comment); }
  dd { min-width: 0; margin: 0; overflow-wrap: anywhere; white-space: pre-wrap; }
`;
const PromptDetails = styled.details`
  border-top: 1px solid var(--color-border); padding-top: 16px;
  summary { cursor: pointer; font-size: 13px; font-weight: 500; }
  pre { margin: 12px 0 0; padding: 12px; border-radius: 4px; background: var(--color-main-neutral-light); white-space: pre-wrap; overflow-wrap: anywhere; font: inherit; font-size: 12px; line-height: 1.7; }
`;
const DetailFooter = styled.div`display: flex; justify-content: flex-end; flex-shrink: 0; border-top: 1px solid var(--color-border);`;

const Remove = styled.button`
  display: block;
  width: 160px;
  height: 32px;
  margin: 8px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  background: var(--color-surface);
  cursor: pointer;
`;

const Empty = styled.div`
  display: flex;
  min-height: 280px;
  grid-column: 1 / -1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  color: var(--color-label-studio-comment);
`;

function MetadataList({ shot }: { shot: LibraryGenerationShot }) {
  const metadata = shot.metadata;
  const entries = [
    ["생성 시각", new Date(metadata.generatedAt).toLocaleString("ko-KR")],
    ["AI 모델", metadata.aiModel],
    ["생성 종류", metadata.variationType],
    ["품질", metadata.quality],
    ["AI 편집", metadata.editMode || "기본"],
    ["채광/시간대", metadata.light],
    ["인테리어 무드", metadata.mood],
    ["연출 소품", metadata.props.length ? metadata.props.join(", ") : "없음"],
    ["추가 디렉션", metadata.additionalDirection || "없음"],
    ["이미지 크기", metadata.imageSize],
  ];

  return (
    <>
      {metadata.inputImages?.length ? <MetadataSection><h3>입력 이미지</h3><Inputs><GenerationInputImages images={metadata.inputImages} /></Inputs></MetadataSection> : null}
      <MetadataSection><h3>생성 정보</h3><Metadata>
      {entries.map(([label, value]) => (
        <div style={{ display: "contents" }} key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </Metadata></MetadataSection>
      <PromptDetails><summary>최종 프롬프트</summary><pre>{metadata.finalPrompt}</pre></PromptDetails>
    </>
  );
}

export function BookmarksWorkspace({ detailId }: { detailId?: string }) {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const history = useCreateStore((state) => state.generationHistory);
  const [bookmarks,setBookmarks]=useState<LibraryGenerationShot[]>([]);
  const selected = bookmarks.find((shot) => shot.id === detailId) ?? null;

  useEffect(() => {
    let active=true;
    void loadBookmarkedImages().then(rows=>{if(active){setBookmarks(rows);setLoaded(true);}}).catch(error=>{if(active)reportCloudError(error);});
    return()=>{active=false;};
  }, [history]);

  return (
    <StudioShell>
      <NavigationTop />
      <NavigationLeft />
      <Workspace>
        {!detailId && <Content>
          <LabelTitle
            title="북마크"
            description="생성 결과에서 저장한 이미지와 생성 메타데이터를 한곳에서 확인합니다."
          />
          <Grid aria-label="북마크 이미지 목록">
            {bookmarks.length ? bookmarks.map((shot) => (
              <ItemBookmark
                shot={shot}
                active={shot.id === detailId}
                onClick={() => router.push(`/bookmarks/${encodeURIComponent(shot.id)}`)}
                key={shot.id}
              />
            )) : (
              <Empty>
                <ImageIcon size={40} strokeWidth={1.3} />
                <strong>북마크한 이미지가 없습니다.</strong>
                <span className="type-xsmall-thin">
                  생성 결과에서 이미지를 선택한 뒤 북마크해 보세요.
                </span>
              </Empty>
            )}
          </Grid>
        </Content>}
        {detailId && <DetailHeader><LibraryDetailHeader href="/bookmarks" backLabel="북마크 목록" title={selected?.label ?? "북마크"} description="저장한 이미지와 생성 정보" /></DetailHeader>}
        {detailId && !selected && <Empty>{loaded ? "북마크를 찾을 수 없습니다." : "북마크를 불러오는 중입니다."}</Empty>}
        {selected && <Details aria-label="북마크 상세 정보">
              <DetailBody>
                <DetailPreview>
                  <LoadingImage
                    src={selected.imageUrl!}
                    alt={selected.label}
                    fill
                    unoptimized
                    sizes="(max-width: 900px) 90vw, 45vw"
                  />
                </DetailPreview>
                <MetadataContent><MetadataList shot={selected} /></MetadataContent>
              </DetailBody>
              <DetailFooter>
                  <Remove
                    type="button"
                    onClick={async () => {
                      try { await cloudRequest("delete-bookmark",{id:selected.id.replace("bookmark:","")});setBookmarks(rows=>rows.filter(r=>r.id!==selected.id));await useCreateStore.getState().hydrateLibrary(true);router.push("/bookmarks"); }
                      catch(error){reportCloudError(error);}
                    }}
                  >
                    북마크 해제
                  </Remove>
              </DetailFooter>
        </Details>}
      </Workspace>
    </StudioShell>
  );
}
