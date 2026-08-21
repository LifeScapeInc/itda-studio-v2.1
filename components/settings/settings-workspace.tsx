"use client";

import { useEffect } from "react";
import styled from "styled-components";
import { NavigationLeft } from "@/components/layout/navigation-left";
import { NavigationTop } from "@/components/layout/navigation-top";
import { LabelTitle } from "@/components/ui/label-title";
import { useAppSettingsStore } from "@/stores/useAppSettingsStore";
import { StudioShell } from "@/system/styles/layout";
import { ApiSettingsPanel } from "./api-settings-panel";
import { GenerationModePanel } from "./generation-mode-panel";

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
  width: min(100%, 900px);
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

export function SettingsWorkspace() {
  const loadStatus = useAppSettingsStore((state) => state.loadStatus);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  return (
    <StudioShell>
      <NavigationTop />
      <NavigationLeft />
      <Workspace>
        <LabelTitle
          title="설정"
          description="생성 API 연결과 스튜디오 실행 방식을 관리합니다."
        />
        <ScrollArea>
          <Content>
            <Group>
              <GroupHeading>
                <h2 className="type-small-body">OpenAI API 설정</h2>
                <p className="type-xsmall-thin">
                  생성 요청에 사용할 API 키와 연결 상태를 관리합니다.
                </p>
              </GroupHeading>
              <ApiSettingsPanel />
            </Group>
            <Group>
              <GroupHeading>
                <h2 className="type-small-body">생성 모드</h2>
                <p className="type-xsmall-thin">
                  실제 API 호출과 목업 실행 방식을 전환합니다.
                </p>
              </GroupHeading>
              <GenerationModePanel />
            </Group>
          </Content>
        </ScrollArea>
      </Workspace>
    </StudioShell>
  );
}
