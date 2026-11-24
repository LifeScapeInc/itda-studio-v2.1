"use client";

import type { PropsWithChildren } from "react";
import styled from "styled-components";
import { useWorkspaceLayoutStore } from "@/stores/useWorkspaceLayoutStore";

const Shell = styled.div<{ $navigationCollapsed: boolean }>`
  --navigation-left-width: ${({ $navigationCollapsed }) => (
    $navigationCollapsed ? "54px" : "202px"
  )};
  height: 100vh;
  height: 100dvh;
  min-height: 0;
  min-width: 960px;
  overflow: hidden;
  background: var(--color-background-workspace);
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
  padding: 64px 28px 28px;
  overflow: hidden;
  background: ${({ $surface }) => (
    $surface ? "var(--color-surface)" : "var(--color-background-workspace)"
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

export const LibraryDetailWorkspace = styled(WorkspaceContent)`
 padding: 36px 0 0;
 background: var(--color-background-workspace);
`;
