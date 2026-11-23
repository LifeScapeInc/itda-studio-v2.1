"use client";

import Image from "next/image";
import styled from "styled-components";
import { TabProject } from "./tab-project";

const Header = styled.header`
  position: fixed;
  z-index: 20;
  top: 0;
  right: 0;
  left: 0;
  display: flex;
  height: 36px;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background: var(--color-background-workspace);
`;

const Brand = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
`;

const StudioLogo = styled(Image)`
  width: 92px;
  height: auto;

  :root.dark & {
    filter: brightness(0) invert(94%) sepia(8%) saturate(260%);
  }
`;

export function NavigationTop() {
  return (
    <Header>
      <Brand>
        <StudioLogo
          src="/assets/icon_studio.svg"
          width={116}
          height={18}
          alt="ITDA studio"
          priority
        />
      </Brand>
      <TabProject />
    </Header>
  );
}
