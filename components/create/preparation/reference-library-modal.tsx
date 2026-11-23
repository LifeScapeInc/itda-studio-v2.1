"use client";

import { useRef, useState } from "react";
import { ChevronDown, ChevronRight, Images, Search, X } from "lucide-react";
import styled from "styled-components";
import type { ReferenceLibraryData, ReferenceLibraryTab } from "@/system/create/reference-library";
import { useCreateStore } from "@/stores/useCreateStore";
import { ReferenceLibraryImageItem } from "./reference-library-image-item";
import { ModalCloseAction } from "@/components/ui/workbench";
import { useDialogFocus } from "@/components/ui/use-dialog-focus";

const Backdrop = styled.div`position: fixed; z-index: 100; inset: 0; display: grid; place-items: center; padding: 32px; background: rgb(32 29 23 / 32%);`;
const Modal = styled.section`display: flex; width: min(1120px, 100%); height: min(720px, calc(100dvh - 64px)); min-height: 360px; flex-direction: column; border: 1px solid var(--color-border); border-radius: 7px; background: var(--color-surface); box-shadow: 0 16px 48px rgb(32 29 23 / 18%); overflow: hidden;`;
const Header = styled.header`display: flex; min-height: 45px; flex: 0 0 45px; align-items: center; justify-content: space-between; padding: 0 16px; background: var(--color-main-neutral-light); border-bottom: 1px solid var(--color-border); h2 { font-size: 16px; font-weight: 500; }`;
const SearchBox = styled.label`display: flex; height: 34px; flex: 0 0 34px; align-items: center; gap: 8px; margin: 16px; padding: 0 12px; border: 1px solid var(--color-border); border-radius: 4px; color: var(--color-label-studio-comment); input { flex: 1; min-width: 0; border: 0; background: transparent; font-size: 13px; outline: none; }`;
const Body = styled.div`display: grid; min-height: 0; flex: 1; grid-template-columns: 208px minmax(0, 1fr); margin: 0 16px 16px;`;
const Nav = styled.nav`min-height: 0; padding-right: 12px; overflow-y: auto; border-right: 1px solid var(--color-border);`;
const Category = styled.button`display: flex; align-items: center; gap: 8px; width: 100%; height: 34px; padding: 0 8px; border: 0; border-radius: 4px; background: transparent; text-align: left; font-size: 14px; font-weight: 700; cursor: pointer; &:hover { background: var(--color-main-neutral-light); } svg { width: 14px; height: 14px; color: var(--color-label-studio-comment); }`;
const Child = styled.button<{ $active: boolean; }>`display: block; width: 100%; min-height: 30px; padding: 6px 8px 6px 30px; border: 0; border-radius: 4px; background: ${({ $active }) => $active ? "var(--color-main-neutral)" : "transparent"}; color: ${({ $active }) => $active ? "var(--color-label-studio-black)" : "var(--color-label-studio-comment)"}; font-size: 13px; text-align: left; overflow-wrap: anywhere; cursor: pointer; &:hover { background: var(--color-main-neutral-light); }`;
const Gallery = styled.div`display: flex; flex-direction: column; min-height: 0; padding-left: 24px;`;
const GalleryHead = styled.div`display: flex; align-items: center; justify-content: space-between; min-height: 40px; padding-bottom: 12px; h3 { margin: 0; font-size: 18px; font-weight: 500; } span { color: var(--color-label-studio-comment); font-size: 11px; }`;
const Grid = styled.div`
  display: grid;
  flex: 1;
  min-height: 0;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-auto-rows: max-content;
  align-content: start;
  align-items: start;
  gap: 12px;
  overflow-y: auto;
  scrollbar-gutter: stable;
  padding: 2px;
  @media(max-width: 900px) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
`;
const Empty = styled.div`display: flex; flex: 1; flex-direction: column; align-items: center; justify-content: center; gap: 16px; color: var(--color-label-studio-comment); font-size: 13px;`;
const tabs = [{ id: "furniture", label: "가구" }, { id: "mood", label: "무드보드" }, { id: "bookmarks", label: "북마크" }] as const;

export function ReferenceLibraryModal({ library, selectedImage, onClose, onSelect }: { library: ReferenceLibraryData; selectedImage?: string | null; onClose: () => void; onSelect: (image: string) => void; }) {
  const ref = useRef<HTMLElement>(null);
  useDialogFocus(ref, onClose);
  const history = useCreateStore(s => s.generationHistory);
  const bookmarks = history.flatMap(set => set.shots.filter(shot => shot.bookmarked && shot.status === "done" && shot.imageUrl).map(shot => ({ id: shot.id, name: shot.label, images: [shot.imageUrl!] })));
  const data = { ...library, bookmarks: [...library.bookmarks, ...bookmarks] };
  const initialTab = tabs.find(tab => data[tab.id].some(group => group.images.includes(selectedImage ?? "")))?.id ?? "furniture";
  const [activeTab, setActiveTab] = useState<ReferenceLibraryTab>(initialTab);
  const [groupId, setGroupId] = useState<string | null>(data[initialTab].find(group => group.images.includes(selectedImage ?? ""))?.id ?? null);
  const [collapsed, setCollapsed] = useState<ReferenceLibraryTab[]>([]);
  const [query, setQuery] = useState("");
  const groups = data[activeTab].filter(group => group.name.toLowerCase().includes(query.trim().toLowerCase()));
  const selected = groups.find(group => group.id === groupId);
  const images = [...new Set((selected ? [selected] : groups).flatMap(group => group.images))];
  return <Backdrop onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><Modal ref={ref} role="dialog" aria-modal="true" aria-labelledby="reference-library-title">
    <Header><h2 id="reference-library-title">레퍼런스 DB</h2><ModalCloseAction title="닫기" aria-label="레퍼런스 DB 닫기" onClick={onClose}><X /></ModalCloseAction></Header>
    <SearchBox><Search size={15} /><input type="search" aria-label="레퍼런스 검색" placeholder="가구, 무드보드 또는 북마크 검색" value={query} onChange={e => setQuery(e.target.value)} /></SearchBox>
    <Body><Nav aria-label="레퍼런스 탐색기">{tabs.map(tab => <section key={tab.id}><Category aria-expanded={!collapsed.includes(tab.id)} onClick={() => { setActiveTab(tab.id); setGroupId(null); setCollapsed(values => values.includes(tab.id) ? values.filter(v => v !== tab.id) : [...values, tab.id]); }}>{collapsed.includes(tab.id) ? <ChevronRight /> : <ChevronDown />}{tab.label}</Category>{!collapsed.includes(tab.id) && data[tab.id].filter(group => group.name.toLowerCase().includes(query.trim().toLowerCase())).map(group => <Child key={group.id} $active={activeTab === tab.id && groupId === group.id} onClick={() => { setActiveTab(tab.id); setGroupId(group.id); }}>{group.name}</Child>)}</section>)}</Nav>
      <Gallery><GalleryHead><h3>{selected?.name ?? tabs.find(tab => tab.id === activeTab)?.label}</h3><span>{images.length}장</span></GalleryHead>{images.length ? <Grid aria-label="레퍼런스 사진">{images.map((image, index) => <ReferenceLibraryImageItem key={image} src={image} index={index} selected={image === selectedImage} onSelect={() => { onSelect(image); onClose(); }} />)}</Grid> : <Empty><Images size={32} />{query ? "검색 결과가 없습니다." : "등록된 이미지가 없습니다."}</Empty>}</Gallery>
    </Body>
  </Modal></Backdrop>;
}
