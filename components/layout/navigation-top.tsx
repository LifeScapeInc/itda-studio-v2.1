"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { Zap } from "lucide-react";
import styled from "styled-components";
import { useWorkspaceLayoutStore } from "@/stores/useWorkspaceLayoutStore";
import { useAppSettingsStore } from "@/stores/useAppSettingsStore";
import { Account } from "./account";
import { TabProject } from "./tab-project";

const Header = styled.header`
  position: fixed;
  z-index: 20;
  top: 0;
  right: 0;
  left: 0;
  display: flex;
  height: 56px;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-lg);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-main-neutral);
`;

const Brand = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
`;

const MenuButton = styled.button`
  display: grid;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  transition: background 150ms ease;

  &:hover,
  &:focus-visible {
    outline: none;
    background: var(--color-main-neutral);
  }

  img {
    width: 22px;
    height: 18px;
    object-fit: fill;
  }

  :root.dark & img {
    filter: brightness(0) invert(94%) sepia(8%) saturate(260%);
  }
`;

const StudioLogo = styled(Image)`
  width: 116px;
  height: 18px;

  :root.dark & {
    filter: brightness(0) invert(94%) sepia(8%) saturate(260%);
  }
`;

const AccountArea = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
`;

const TokenBalance = styled.span`
  display: inline-flex;
  height: 32px;
  align-items: center;
  gap: var(--space-3xs);
  padding: 0 var(--space-xs);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-label-studio-comment);
  font-size: 11px;

  svg {
    color: var(--color-main-primary);
  }

  strong {
    color: var(--color-label-studio-black);
    font-weight: 600;
  }
`;

const AccountLink = styled(Link)`
  display: block;
  border-radius: 50%;

  &:focus-visible {
    outline: 2px solid var(--color-main-primary);
    outline-offset: 3px;
  }
`;

export function NavigationTop() {
  const navigationCollapsed = useWorkspaceLayoutStore(
    (state) => state.navigationCollapsed,
  );
  const toggleNavigation = useWorkspaceLayoutStore(
    (state) => state.toggleNavigation,
  );
  const status = useAppSettingsStore((state) => state.status);
  const estimatedTokens = useAppSettingsStore(
    (state) => state.estimatedTokens,
  );
  const loadStatus = useAppSettingsStore((state) => state.loadStatus);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  return (
    <Header>
      <Brand>
        <MenuButton
          type="button"
          aria-label={navigationCollapsed ? "메뉴 펼치기" : "메뉴 숨기기"}
          aria-expanded={!navigationCollapsed}
          onClick={toggleNavigation}
        >
          <Image
            src="/assets/brand-mark.svg"
            width={20}
            height={16}
            alt=""
            priority
          />
        </MenuButton>
        <StudioLogo
          src="/assets/icon_studio.svg"
          width={116}
          height={18}
          alt="ITDA studio"
          priority
        />
      </Brand>
      <TabProject />
      <AccountArea>
        {status?.hasOpenAiApiKey ? (
          <TokenBalance title="앱 내부 사용량 기준 예상 잔여 토큰">
            <Zap size={13} strokeWidth={2} />
            <strong>{estimatedTokens.toLocaleString("ko-KR")}</strong>
            토큰
          </TokenBalance>
        ) : null}
        <AccountLink href="/account" aria-label="계정 페이지 열기">
          <Account />
        </AccountLink>
      </AccountArea>
    </Header>
  );
}
