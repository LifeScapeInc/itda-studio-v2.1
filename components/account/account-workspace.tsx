"use client";

import { useEffect } from "react";
import styled from "styled-components";
import { NavigationLeft } from "@/components/layout/navigation-left";
import { NavigationTop } from "@/components/layout/navigation-top";
import { LabelTitle } from "@/components/ui/label-title";
import { useAppSettingsStore } from "@/stores/useAppSettingsStore";
import { useTokenUsageStore } from "@/stores/useTokenUsageStore";
import { StudioShell } from "@/system/styles/layout";
import { AccountProfilePanel } from "./account-profile-panel";
import { TokenUsagePanel } from "./token-usage-panel";

const Workspace = styled.main`
  display: flex;
  height: 100%;
  min-height: 0;
  margin-left: var(--navigation-left-width, 203px);
  padding: 104px var(--space-2xl) var(--space-2xl);
  flex-direction: column;
  background: var(--color-main-neutral-light);
  overflow: hidden;
  transition: margin-left 220ms ease;
`;

const ScrollArea = styled.div`
  min-height: 0;
  flex: 1;
  margin-top: var(--space-xl);
  padding-block: var(--space-3xs);
  overflow-y: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Content = styled.div`
  display: flex;
  width: min(100%, 980px);
  flex-direction: column;
  gap: var(--space-lg);
`;

const Group = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-lg);
  border-radius: 8px;
  background: var(--color-surface);
`;

const GroupHeading = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3xs);

  p {
    color: var(--color-label-studio-comment);
    line-height: 1.5;
  }
`;

export function AccountWorkspace() {
  const loadStatus = useAppSettingsStore((state) => state.loadStatus);
  const hydrateUsage = useTokenUsageStore((state) => state.hydrate);

  useEffect(() => {
    void loadStatus();
    hydrateUsage();
  }, [hydrateUsage, loadStatus]);

  return (
    <StudioShell>
      <NavigationTop />
      <NavigationLeft />
      <Workspace>
        <LabelTitle
          title="계정"
          description="스튜디오 계정과 월별 API 사용량을 확인합니다."
        />
        <ScrollArea>
          <Content>
            <Group>
              <GroupHeading>
                <h2 className="type-small-body">계정 정보</h2>
                <p className="type-xsmall-thin">
                  현재 워크스페이스와 API 연결 상태입니다.
                </p>
              </GroupHeading>
              <AccountProfilePanel />
            </Group>
            <Group>
              <GroupHeading>
                <h2 className="type-small-body">토큰 사용량</h2>
                <p className="type-xsmall-thin">
                  월별 API 활동과 호출 유형별 사용량을 확인합니다.
                </p>
              </GroupHeading>
              <TokenUsagePanel />
            </Group>
          </Content>
        </ScrollArea>
      </Workspace>
    </StudioShell>
  );
}
