"use client";

import { useEffect, useState, type FormEvent } from "react";
import { KeyRound, RotateCcw, ShieldCheck, ShieldX } from "lucide-react";
import styled from "styled-components";
import { NavigationLeft } from "@/components/layout/navigation-left";
import { NavigationTop } from "@/components/layout/navigation-top";
import { LabelTitle } from "@/components/ui/label-title";
import { useAppSettingsStore } from "@/stores/useAppSettingsStore";
import {
  HiddenScrollbar,
  StudioShell,
  WorkspaceContent,
} from "@/system/styles/layout";

const Scroll = styled(HiddenScrollbar)`
  min-height: 0;
  flex: 1;
  margin-top: var(--space-xl);
  overflow-y: auto;
  padding: var(--space-3xs) 0 var(--space-xl);
`;

const Stack = styled.div`
  display: flex;
  width: min(100%, 760px);
  flex-direction: column;
  gap: var(--space-lg);
`;

const Card = styled.section`
  border: 1px solid var(--color-border);
  border-radius: 14px;
  background: var(--color-surface);
  overflow: hidden;
`;

const CardHeader = styled.header`
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-main-neutral-light);
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
`;

const Priority = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--color-label-studio-comment);

  strong {
    color: var(--color-label-studio-black);
  }

  code {
    color: var(--color-main-primary);
    font-family: "Inter", monospace;
    font-weight: 600;
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
  min-height: 112px;
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

const DirectKey = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding-top: var(--space-2xs);
  border-top: 1px solid var(--color-border);
`;

const StatusBox = styled.div<{ $connected: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: var(--space-xs);
  padding: var(--space-sm);
  border: 1px solid ${({ $connected }) => (
    $connected ? "var(--color-main-primary)" : "var(--color-border)"
  )};
  border-radius: 8px;
  background: var(--color-main-neutral-light);

  svg {
    flex: 0 0 auto;
    color: ${({ $connected }) => (
      $connected
        ? "var(--color-main-primary)"
        : "var(--color-label-studio-comment)"
    )};
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

const MockModeRow = styled.label`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-sm);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-main-neutral-light);
  cursor: pointer;
`;

const MockModeCopy = styled.span`
  display: flex;
  flex-direction: column;
  gap: var(--space-3xs);

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

export function SettingsWorkspace() {
  const [apiKey, setApiKey] = useState("");
  const status = useAppSettingsStore((state) => state.status);
  const estimatedTokens = useAppSettingsStore(
    (state) => state.estimatedTokens,
  );
  const mockMode = useAppSettingsStore((state) => state.mockMode);
  const loading = useAppSettingsStore((state) => state.loading);
  const saving = useAppSettingsStore((state) => state.saving);
  const message = useAppSettingsStore((state) => state.message);
  const loadStatus = useAppSettingsStore((state) => state.loadStatus);
  const setApiKeyMode = useAppSettingsStore((state) => state.setApiKeyMode);
  const saveApiKey = useAppSettingsStore((state) => state.saveApiKey);
  const resetApiKey = useAppSettingsStore((state) => state.resetApiKey);
  const setMockMode = useAppSettingsStore((state) => state.setMockMode);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!apiKey.trim()) {
      return;
    }

    if (await saveApiKey(apiKey)) {
      setApiKey("");
    }
  }

  const sourceCopy = status?.openAiApiKeySource === "env"
    ? `환경변수 ${status.environmentVariable}를 사용 중입니다.`
    : status?.openAiApiKeySource === "workspace"
      ? "이 브라우저에서 직접 등록한 키를 사용 중입니다."
      : status?.openAiApiKeyMode === "env"
        ? status?.netlifyAiGatewayDetected
          ? "Netlify AI Gateway 자동 키는 GPT Image 2를 지원하지 않습니다. 직접 입력하거나 Netlify에 본인의 OPENAI_API_KEY를 등록해 주세요."
          : `환경변수 ${status.environmentVariable}가 없어 목업 모드로 동작합니다.`
        : "직접 입력한 API 키가 없어 목업 모드로 동작합니다.";

  return (
    <StudioShell>
      <NavigationTop />
      <NavigationLeft />
      <WorkspaceContent>
        <LabelTitle
          title="설정"
          description="앱 테마와 이미지 생성 API 연결 상태를 관리합니다."
        />
        <Scroll>
          <Stack>
            <Card>
              <CardHeader>
                <KeyRound size={17} />
                <h2 className="type-xsmall-body">OpenAI API 설정</h2>
              </CardHeader>
              <CardBody>
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
                        {status?.netlifyAiGatewayDetected
                          ? "Netlify가 자동 주입한 AI Gateway 키가 감지되었습니다."
                          : `실행 환경의 ${status?.environmentVariable ?? "OPENAI_API_KEY"} 값을 사용합니다.`}
                      </small>
                      <code>
                        {status?.netlifyAiGatewayDetected
                          ? "자동 키 감지됨 · GPT Image 2 미지원"
                          : status?.environmentOpenAiApiKeyPreview
                            ?? "환경변수가 설정되지 않음"}
                      </code>
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
                      <code>
                        {status?.storedOpenAiApiKeyPreview
                          ?? "저장된 키가 없음"}
                      </code>
                    </SourceCopy>
                  </SourceOption>
                </SourceGrid>
                <StatusBox $connected={Boolean(status?.hasOpenAiApiKey)}>
                  {status?.hasOpenAiApiKey ? (
                    <ShieldCheck size={20} />
                  ) : (
                    <ShieldX size={20} />
                  )}
                  <StatusCopy>
                    <strong className="type-xsmall-body">
                      {loading
                        ? "API 연결 상태 확인 중"
                        : status?.hasOpenAiApiKey
                          ? "API 키가 연결되어 있습니다"
                          : "API 키가 연결되지 않았습니다"}
                    </strong>
                    <p className="type-xsmall-thin">{sourceCopy}</p>
                    {status?.openAiApiKeyPreview ? (
                      <code>{status.openAiApiKeyPreview}</code>
                    ) : null}
                  </StatusCopy>
                </StatusBox>
                {status?.openAiApiKeyMode === "workspace" ? (
                  <DirectKey>
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
                      직접 입력한 키는 암호화된 HttpOnly 쿠키로 저장되며,
                      서버에서만 복호화됩니다.
                    </Note>
                  </DirectKey>
                ) : (
                  <Note className="type-xsmall-thin">
                    환경변수는 앱에서 수정하거나 삭제할 수 없습니다.
                    실행 환경에서 {status?.environmentVariable ?? "OPENAI_API_KEY"}를 관리해 주세요.
                  </Note>
                )}
                {message ? (
                  <Message className="type-xsmall-thin" role="status">
                    {message}
                  </Message>
                ) : null}
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <h2 className="type-xsmall-body">생성 모드</h2>
              </CardHeader>
              <CardBody>
                <MockModeRow>
                  <MockModeCopy>
                    <strong className="type-xsmall-body">목업 모드</strong>
                    <small className="type-xsmall-thin">
                      활성화하면 API 키가 연결되어 있어도 외부 생성 요청 없이
                      목업 결과와 진행 화면을 사용합니다.
                    </small>
                  </MockModeCopy>
                  <Checkbox
                    type="checkbox"
                    checked={mockMode}
                    onChange={(event) => setMockMode(event.target.checked)}
                  />
                </MockModeRow>
                {!status?.hasOpenAiApiKey ? (
                  <Note className="type-xsmall-thin">
                    API 키가 연결되지 않은 상태에서는 이 설정과 관계없이
                    자동으로 목업 모드가 적용됩니다.
                  </Note>
                ) : null}
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <h2 className="type-xsmall-body">사용량</h2>
              </CardHeader>
              <CardBody>
                <Priority>
                  <span />
                  <p className="type-xsmall-thin">
                    예상 잔여 토큰 <strong>{estimatedTokens.toLocaleString("ko-KR")}</strong>
                  </p>
                </Priority>
                <Note className="type-xsmall-thin">
                  OpenAI가 제공하는 실제 잔액 조회값이 아니라, v2와 동일하게
                  생성 비용을 앱 내부 시작값 12,500에서 차감한 예상치입니다.
                </Note>
              </CardBody>
            </Card>
          </Stack>
        </Scroll>
      </WorkspaceContent>
    </StudioShell>
  );
}
