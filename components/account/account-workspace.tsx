"use client";

import { useEffect } from "react";
import { KeyRound, User } from "lucide-react";
import styled from "styled-components";
import { NavigationLeft } from "@/components/layout/navigation-left";
import { NavigationTop } from "@/components/layout/navigation-top";
import { LabelTitle } from "@/components/ui/label-title";
import { useAppSettingsStore } from "@/stores/useAppSettingsStore";
import {
  StudioShell,
  WorkspaceContent,
} from "@/system/styles/layout";

const Card = styled.section`
  display: flex;
  width: min(100%, 620px);
  flex-direction: column;
  gap: var(--space-lg);
  margin-top: var(--space-xl);
  padding: var(--space-xl);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-surface);
`;

const Identity = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
`;

const Avatar = styled.span`
  display: grid;
  width: 56px;
  height: 56px;
  place-items: center;
  border: 2px solid var(--color-main-tertiary);
  border-radius: 50%;
  background: var(--color-main-primary);
  color: var(--color-surface);
  font-size: 20px;
  font-weight: 700;
`;

const IdentityCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);

  p {
    color: var(--color-label-studio-comment);
  }
`;

const Rows = styled.div`
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--color-border);
`;

const Row = styled.div`
  display: flex;
  min-height: 52px;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-lg);
  border-bottom: 1px solid var(--color-border);

  span:first-child {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2xs);
    color: var(--color-label-studio-comment);
  }
`;

const Hint = styled.p`
  color: var(--color-label-studio-comment);
  line-height: 1.55;
`;

export function AccountWorkspace() {
  const status = useAppSettingsStore((state) => state.status);
  const estimatedTokens = useAppSettingsStore(
    (state) => state.estimatedTokens,
  );
  const loadStatus = useAppSettingsStore((state) => state.loadStatus);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  return (
    <StudioShell>
      <NavigationTop />
      <NavigationLeft />
      <WorkspaceContent>
        <LabelTitle
          title="계정"
          description="현재 스튜디오 계정과 API 사용 상태를 확인합니다."
        />
        <Card>
          <Identity>
            <Avatar>LS</Avatar>
            <IdentityCopy>
              <strong className="type-small-body">LifeScape Studio</strong>
              <p className="type-xsmall-thin">로컬 워크스페이스 계정</p>
            </IdentityCopy>
          </Identity>
          <Rows>
            <Row>
              <span className="type-xsmall-thin">
                <User size={15} /> 계정 유형
              </span>
              <strong className="type-xsmall-thin">Studio</strong>
            </Row>
            <Row>
              <span className="type-xsmall-thin">
                <KeyRound size={15} /> API 연결
              </span>
              <strong className="type-xsmall-thin">
                {status?.hasOpenAiApiKey ? "연결됨" : "연결 안 됨"}
              </strong>
            </Row>
            <Row>
              <span className="type-xsmall-thin">예상 잔여 토큰</span>
              <strong className="type-xsmall-body">
                {status?.hasOpenAiApiKey
                  ? estimatedTokens.toLocaleString("ko-KR")
                  : "—"}
              </strong>
            </Row>
          </Rows>
          <Hint className="type-xsmall-thin">
            잔여 토큰은 실제 OpenAI 계정 잔액이 아니라 생성 비용을 기반으로 한
            스튜디오 내부 예상치입니다.
          </Hint>
        </Card>
      </WorkspaceContent>
    </StudioShell>
  );
}
