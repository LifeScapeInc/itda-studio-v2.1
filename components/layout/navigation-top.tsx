"use client";

import Image from "next/image";
import Link from "next/link";
import styled from "styled-components";
import { Account } from "./account";
import { TabProject } from "./tab-project";

const Header = styled.header`
  position: fixed;
  z-index: 20;
  top: 0;
  right: 0;
  left: 0;
  display: flex;
  height: var(--header-height);
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-md);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-main-neutral);
`;

const Brand = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
`;

const StudioLogo = styled(Image)`
  width: 97px;
  height: auto;

  :root.dark & {
    filter: brightness(0) invert(94%) sepia(8%) saturate(260%);
  }
`;

const HomeLink = styled(Link)`
  display: flex;
  height: 32px;
  align-items: center;
  border-radius: 4px;

  &:focus-visible {
    outline: 2px solid var(--color-main-primary);
    outline-offset: 4px;
  }
`;

const AccountArea = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
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
  return (
    <Header>
      <Brand>
        <HomeLink href="/workspace" aria-label="ITDA Studio 홈으로 이동">
          <StudioLogo
            src="/assets/icon_studio.svg"
            width={116}
            height={18}
            alt="ITDA studio"
            priority
          />
        </HomeLink>
      </Brand>
      <TabProject />
      <AccountArea>
        <AccountLink href="/account" aria-label="계정 페이지 열기">
          <Account />
        </AccountLink>
      </AccountArea>
    </Header>
  );
}
