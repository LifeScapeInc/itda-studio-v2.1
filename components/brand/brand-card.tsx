"use client";
import { useCallback, useState } from "react";
import { ContextMenu } from "@/components/ui/context-menu";
import Link from "next/link";
import { ArrowUpRight, ImageIcon, Trash2 } from "lucide-react";
import styled from "styled-components";
import { EditableTitle } from "@/components/ui/editable-title";
import { LoadingImage } from "@/components/ui/loading-image";
import type { BrandCollection } from "@/system/brand/brand-library";
const Card = styled.article`
 display: flex; width: min(100%, 336px); aspect-ratio: 3 / 2; flex-direction: column; padding: var(--space-xs);
 border: 1px solid var(--color-border); border-radius: var(--radius-panel); background: var(--color-surface); overflow: hidden;
 &:hover { background: var(--color-main-neutral-light); }
 &:hover img { transform: scale(1.035); }
`;
const Preview = styled(Link)`
 display: grid; min-height: 0; flex: 1; grid-template-columns: 1.75fr 1fr; grid-template-rows: repeat(2, minmax(0, 1fr)); gap: 8px;
`;
const Frame = styled.div`
 position: relative; display: grid; min-height: 0; place-items: center; overflow: hidden; border-radius: 4px;
 background: var(--color-main-neutral); color: var(--color-label-studio-comment);
 &:first-child { grid-row: 1 / 3; }
 img { object-fit: cover; transition: transform 300ms ease; }
`;
const Footer = styled.div`
 display: flex; height: 58px; flex: 0 0 58px; align-items: center; justify-content: space-between; gap: 8px; padding-top: 8px;
 > div { display: flex; min-width: 0; flex: 1; flex-direction: column; align-items: stretch; font-size: 14px; font-weight: 500; --editable-title-height: 24px; }
 small { padding-left: 4px; color: var(--color-label-studio-comment); font-size: 11px; font-weight: 400; }
 > a { display: grid; width: 28px; height: 28px; place-items: center; }
`;
export function BrandCard({ brand, onRename, onDelete }: { brand: BrandCollection; onRename: (value: string) => void; onDelete: () => void }) {
 const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
 const closeMenu = useCallback(() => setMenu(null), []);
 const href = `/brand/${brand.id}`;
 return <><Card onContextMenu={event => { event.preventDefault(); setMenu({ x: event.clientX, y: event.clientY }); }} onKeyDown={event => {
   if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
     event.preventDefault(); const rect = event.currentTarget.getBoundingClientRect(); setMenu({ x: rect.left + 16, y: rect.top + 16 });
   }
 }}><Preview href={href} aria-label={`${brand.name} 브랜드 열기`}>{[0, 1, 2].map(index => <Frame key={index}>{brand.images[index] ? <LoadingImage src={brand.images[index].imageUrl} alt="" fill unoptimized sizes="220px" /> : <ImageIcon size={24} strokeWidth={1.4} />}</Frame>)}</Preview>
 <Footer><div><EditableTitle value={brand.name} onSave={onRename} label="브랜드 이름" /><small>{brand.images.length}장</small></div><Link href={href} aria-label={`${brand.name} 브랜드 열기`}><ArrowUpRight size={16} /></Link></Footer></Card>{menu && <ContextMenu x={menu.x} y={menu.y} height={42} label="브랜드 메뉴" onClose={closeMenu}>
 <button type="button" role="menuitem" onClick={() => { closeMenu(); onDelete(); }}><Trash2 />삭제</button>
 </ContextMenu>}</>;
}
