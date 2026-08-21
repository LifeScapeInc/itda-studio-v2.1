"use client";

import { KeyRound, User } from "lucide-react";
import styled from "styled-components";
import { useAppSettingsStore } from "@/stores/useAppSettingsStore";

const Content = styled.div`
  display: flex;
  width: min(100%, 620px);
  flex-direction: column;
  gap: var(--space-lg);
`;

const Identity = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
`;

const Avatar = styled.span`
  display: grid;
  width: 52px;
  height: 52px;
  flex: 0 0 52px;
  place-items: center;
  border: 2px solid var(--color-main-tertiary);
  border-radius: 50%;
  background: var(--color-main-primary);
  color: var(--color-surface);
  font-size: 18px;
  font-weight: 700;
`;

const IdentityCopy = styled.div`
  display: flex;
  min-width: 0;
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
  min-height: 48px;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  border-bottom: 1px solid var(--color-border);

  span {
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

export function AccountProfilePanel() {
  const status = useAppSettingsStore((state) => state.status);

  return (
    <Content>
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
        </Rows>
        <Hint className="type-xsmall-thin">
          토큰 사용량은 실제 API 응답을 기준으로 이 브라우저에 월별로 기록됩니다.
        </Hint>
    </Content>
  );
}
