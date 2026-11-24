"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styled from "styled-components";
import type { ReactNode } from "react";
import { ReferenceDetailTitle } from "./reference-detail-title";
const Header = styled.header`
  display: flex; flex: 0 0 auto; min-width: 0; flex-direction: column; gap: var(--space-sm);
  > a { display: inline-flex; align-items: center; gap: 8px; align-self: flex-start; color: var(--color-label-studio-comment); font-size: 12px; text-decoration: none; }
  > a:hover { color: var(--color-main-primary); }
`;
export function LibraryDetailHeader({ href, backLabel, title, description }: { href: string; backLabel: string; title: ReactNode; description: string }) {
 return <Header><Link href={href}><ArrowLeft size={16} />{backLabel}</Link><ReferenceDetailTitle title={title} description={description} /></Header>;
}
