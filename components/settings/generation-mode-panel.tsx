"use client";

import { FlaskConical } from "lucide-react";
import styled from "styled-components";
import { useAppSettingsStore } from "@/stores/useAppSettingsStore";

const Content = styled.div`
  display: flex;
  width: min(100%, 820px);
  flex-direction: column;
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--color-border);
`;

const SectionHeading = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3xs);

  p {
    color: var(--color-label-studio-comment);
    line-height: 1.5;
  }
`;

const ModeOption = styled.label<{ $active: boolean }>`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-sm);
  border: 1px solid ${({ $active }) => $active
    ? "var(--color-main-primary)"
    : "var(--color-border)"};
  border-radius: 8px;
  background: ${({ $active }) => $active
    ? "var(--color-main-neutral-light)"
    : "var(--color-surface)"};
  cursor: pointer;
`;

const ModeCopy = styled.span`
  display: flex;
  min-width: 0;
  align-items: flex-start;
  gap: var(--space-xs);

  svg {
    flex: 0 0 auto;
    color: var(--color-main-primary);
  }

  span {
    display: flex;
    flex-direction: column;
    gap: var(--space-3xs);
  }

  small {
    color: var(--color-label-studio-comment);
    line-height: 1.5;
  }
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  margin: 1px 0 0;
  accent-color: var(--color-main-primary);
`;

const Note = styled.p`
  color: var(--color-label-studio-comment);
  line-height: 1.55;
`;

export function GenerationModePanel() {
  const status = useAppSettingsStore((state) => state.status);
  const mockMode = useAppSettingsStore((state) => state.mockMode);
  const setMockMode = useAppSettingsStore((state) => state.setMockMode);

  return (
    <Content>
      <Section>
        <SectionHeading>
          <h3 className="type-xsmall-body">생성 실행 방식</h3>
          <p className="type-xsmall-thin">
            외부 API를 사용하지 않고 화면 흐름과 목업 결과를 확인할 수 있습니다.
          </p>
        </SectionHeading>
        <ModeOption $active={mockMode}>
          <ModeCopy>
            <FlaskConical size={18} />
            <span>
              <strong className="type-xsmall-body">목업 모드</strong>
              <small className="type-xsmall-thin">
                활성화하면 API 키가 연결되어 있어도 실제 생성 요청 없이 목업 결과를 사용합니다.
              </small>
            </span>
          </ModeCopy>
          <Checkbox
            type="checkbox"
            checked={mockMode}
            onChange={(event) => setMockMode(event.target.checked)}
          />
        </ModeOption>
        {!status?.hasOpenAiApiKey ? (
          <Note className="type-xsmall-thin">
            API 키가 연결되지 않은 상태에서는 이 설정과 관계없이 자동으로 목업 모드가 적용됩니다.
          </Note>
        ) : null}
      </Section>
    </Content>
  );
}
