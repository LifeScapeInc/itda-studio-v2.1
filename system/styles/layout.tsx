"use client";

import type { PropsWithChildren } from "react";
import styled from "styled-components";
import { useWorkspaceLayoutStore } from "@/stores/useWorkspaceLayoutStore";

const Shell = styled.div<{ $navigationCollapsed: boolean }>`
  --navigation-left-width: ${({ $navigationCollapsed }) => (
    $navigationCollapsed ? "0px" : "203px"
  )};
  height: 100vh;
  height: 100dvh;
  min-height: 0;
  min-width: 1024px;
  overflow: hidden;
  background: var(--color-main-neutral-light);
`;

export function StudioShell({ children }: PropsWithChildren) {
  const navigationCollapsed = useWorkspaceLayoutStore(
    (state) => state.navigationCollapsed,
  );

  return (
    <Shell $navigationCollapsed={navigationCollapsed}>
      {children}
    </Shell>
  );
}

export const WorkspaceContent = styled.main<{ $surface?: boolean }>`
  position: relative;
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  margin-left: var(--navigation-left-width, 203px);
  padding: 104px var(--space-2xl) var(--space-2xl);
  overflow: hidden;
  background: ${({ $surface }) => (
    $surface ? "var(--color-surface)" : "transparent"
  )};
  transition: margin-left 220ms ease;
`;

export const HiddenScrollbar = styled.div`
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;
