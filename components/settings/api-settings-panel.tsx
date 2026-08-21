"use client";

import { useState, type FormEvent } from "react";
import { RotateCcw, ShieldCheck, ShieldX } from "lucide-react";
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
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--color-border);

  &:first-child {
    padding-top: 0;
  }

  &:last-child {
    border-bottom: 0;
  }
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

const SourceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-xs);
`;

const SourceOption = styled.label<{ $selected: boolean }>`
  display: flex;
  min-width: 0;
  min-height: 120px;
  align-items: flex-start;
  gap: var(--space-xs);
  padding: var(--space-sm);
  border: 1px solid ${({ $selected }) => $selected
    ? "var(--color-main-primary)"
    : "var(--color-border)"};
  border-radius: 8px;
  background: ${({ $selected }) => $selected
    ? "var(--color-main-neutral-light)"
    : "var(--color-surface)"};
  cursor: pointer;
  transition: border-color 150ms ease, background 150ms ease;

  &:hover {
    border-color: var(--color-main-primary);
  }

  input {
    width: 16px;
    height: 16px;
    flex: 0 0 auto;
    margin: 2px 0 0;
    accent-color: var(--color-main-primary);
  }
`;

const SourceCopy = styled.span`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-3xs);

  small {
    color: var(--color-label-studio-comment);
    line-height: 1.45;
  }

  code {
    overflow: hidden;
    color: var(--color-main-primary);
    font-family: "Inter", monospace;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const StatusBox = styled.div<{ $connected: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: var(--space-xs);
  padding: var(--space-sm);
  border: 1px solid ${({ $connected }) => $connected
    ? "var(--color-main-primary)"
    : "var(--color-border)"};
  border-radius: 8px;
  background: var(--color-main-neutral-light);

  svg {
    flex: 0 0 auto;
    color: ${({ $connected }) => $connected
      ? "var(--color-main-primary)"
      : "var(--color-label-studio-comment)"};
  }
`;

const StatusCopy = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-2xs);

  p {
    color: var(--color-label-studio-comment);
    line-height: 1.5;
  }

  code {
    width: fit-content;
    padding: var(--space-3xs) var(--space-2xs);
    border-radius: 6px;
    background: var(--color-main-neutral);
    color: var(--color-label-studio-black);
    font-family: "Inter", monospace;
    font-size: 11px;
  }
`;

const Form = styled.form`
  display: flex;
  gap: var(--space-2xs);
`;

const Input = styled.input`
  min-width: 0;
  height: 42px;
  flex: 1;
  padding: 0 var(--space-xs);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-label-studio-black);
  outline: none;

  &:focus {
    border-color: var(--color-main-primary);
    box-shadow: 0 0 0 3px color-mix(
      in srgb,
      var(--color-main-primary) 12%,
      transparent
    );
  }
`;

const PrimaryButton = styled.button`
  height: 42px;
  padding: 0 var(--space-md);
  border: 0;
  border-radius: 8px;
  background: var(--color-main-primary);
  color: var(--color-surface);
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--color-main-secondary);
  }

  &:disabled {
    background: var(--color-label-disabled);
    cursor: default;
  }
`;

const ResetButton = styled.button`
  display: inline-flex;
  width: fit-content;
  height: 34px;
  align-items: center;
  gap: var(--space-3xs);
  padding: 0 var(--space-xs);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: transparent;
  color: var(--color-label-studio-comment);
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: var(--color-main-primary);
    color: var(--color-label-studio-black);
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

const Message = styled.p`
  color: var(--color-main-primary);
  line-height: 1.5;
`;

const Note = styled.p`
  color: var(--color-label-studio-comment);
  line-height: 1.55;
`;

export function ApiSettingsPanel() {
  const [apiKey, setApiKey] = useState("");
  const status = useAppSettingsStore((state) => state.status);
  const loading = useAppSettingsStore((state) => state.loading);
  const saving = useAppSettingsStore((state) => state.saving);
  const message = useAppSettingsStore((state) => state.message);
  const setApiKeyMode = useAppSettingsStore((state) => state.setApiKeyMode);
  const saveApiKey = useAppSettingsStore((state) => state.saveApiKey);
  const resetApiKey = useAppSettingsStore((state) => state.resetApiKey);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!apiKey.trim()) return;
    if (await saveApiKey(apiKey)) setApiKey("");
  }

  const sourceCopy = status?.openAiApiKeySource === "env"
    ? `환경변수 ${status.environmentVariable}를 사용 중입니다.`
    : status?.openAiApiKeySource === "workspace"
      ? "이 브라우저에서 직접 등록한 키를 사용 중입니다."
      : status?.openAiApiKeyMode === "env"
        ? `환경변수 ${status.environmentVariable}가 없어 목업 모드로 동작합니다.`
        : "직접 입력한 API 키가 없어 목업 모드로 동작합니다.";

  return (
    <Content>
      <Section>
        <SectionHeading>
          <h3 className="type-xsmall-body">API 키 사용 방식</h3>
          <p className="type-xsmall-thin">
            실행 환경 또는 이 브라우저에 등록한 키 중 하나를 선택합니다.
          </p>
        </SectionHeading>
        <SourceGrid role="radiogroup" aria-label="API 키 사용 방식">
          <SourceOption $selected={status?.openAiApiKeyMode === "env"}>
            <input
              type="radio"
              name="openai-api-key-mode"
              value="env"
              checked={status?.openAiApiKeyMode === "env"}
              disabled={loading || saving}
              onChange={() => void setApiKeyMode("env")}
            />
            <SourceCopy>
              <strong className="type-xsmall-body">환경변수 사용</strong>
              <small className="type-xsmall-thin">
                실행 환경의 {status?.environmentVariable ?? "OPENAI_API_KEY"} 값을 사용합니다.
              </small>
              <code>{status?.environmentOpenAiApiKeyPreview ?? "환경변수가 설정되지 않음"}</code>
            </SourceCopy>
          </SourceOption>
          <SourceOption $selected={status?.openAiApiKeyMode === "workspace"}>
            <input
              type="radio"
              name="openai-api-key-mode"
              value="workspace"
              checked={status?.openAiApiKeyMode === "workspace"}
              disabled={loading || saving}
              onChange={() => void setApiKeyMode("workspace")}
            />
            <SourceCopy>
              <strong className="type-xsmall-body">직접 입력</strong>
              <small className="type-xsmall-thin">
                이 브라우저에 암호화해 저장한 API 키를 사용합니다.
              </small>
              <code>{status?.storedOpenAiApiKeyPreview ?? "저장된 키가 없음"}</code>
            </SourceCopy>
          </SourceOption>
        </SourceGrid>
      </Section>
      <Section>
        <SectionHeading>
          <h3 className="type-xsmall-body">연결 상태</h3>
          <p className="type-xsmall-thin">현재 선택된 키의 연결 상태를 확인합니다.</p>
        </SectionHeading>
        <StatusBox $connected={Boolean(status?.hasOpenAiApiKey)}>
          {status?.hasOpenAiApiKey ? <ShieldCheck size={20} /> : <ShieldX size={20} />}
          <StatusCopy>
            <strong className="type-xsmall-body">
              {loading
                ? "API 연결 상태 확인 중"
                : status?.hasOpenAiApiKey
                  ? "API 키가 연결되어 있습니다"
                  : "API 키가 연결되지 않았습니다"}
            </strong>
            <p className="type-xsmall-thin">{sourceCopy}</p>
            {status?.openAiApiKeyPreview ? <code>{status.openAiApiKeyPreview}</code> : null}
          </StatusCopy>
        </StatusBox>
      </Section>
      {status?.openAiApiKeyMode === "workspace" ? (
        <Section>
          <SectionHeading>
            <h3 className="type-xsmall-body">직접 입력 API 키</h3>
            <p className="type-xsmall-thin">등록된 키를 교체하거나 초기화합니다.</p>
          </SectionHeading>
          <Form onSubmit={submit}>
            <Input
              type="password"
              value={apiKey}
              autoComplete="off"
              aria-label="OpenAI API 키"
              placeholder="sk-... 또는 sk-proj-..."
              onChange={(event) => setApiKey(event.target.value)}
            />
            <PrimaryButton
              className="type-small-head"
              type="submit"
              disabled={saving || !apiKey.trim()}
            >
              {status?.hasStoredOpenAiApiKey ? "키 교체" : "키 등록"}
            </PrimaryButton>
          </Form>
          <ResetButton
            type="button"
            disabled={saving || !status?.hasStoredOpenAiApiKey}
            onClick={() => void resetApiKey()}
          >
            <RotateCcw size={13} />
            직접 등록한 키 초기화
          </ResetButton>
          <Note className="type-xsmall-thin">
            직접 입력한 키는 암호화된 HttpOnly 쿠키로 저장되며 서버에서만 복호화됩니다.
          </Note>
        </Section>
      ) : (
        <Section>
          <Note className="type-xsmall-thin">
            환경변수는 앱에서 수정하거나 삭제할 수 없습니다. 실행 환경에서
            {" "}{status?.environmentVariable ?? "OPENAI_API_KEY"}를 관리해 주세요.
          </Note>
        </Section>
      )}
      {message ? <Message className="type-xsmall-thin" role="status">{message}</Message> : null}
    </Content>
  );
}
