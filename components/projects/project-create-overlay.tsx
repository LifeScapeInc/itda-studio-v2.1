"use client";

import { X } from "lucide-react";
import { ModalCloseAction } from "@/components/ui/workbench";
import { useDialogFocus } from "@/components/ui/use-dialog-focus";
import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import styled from "styled-components";
import {
  useProjectStore,
  type ProjectStage,
  type ProjectWorkType,
} from "@/stores/useProjectStore";
import { parseDeliveryDate } from "@/system/projects/project-form";
import { InputChoose } from "./input-choose";
import { InputString } from "./input-string";

const WORK_TYPE_OPTIONS = [
  { label: "상세 페이지", value: "detail_page" },
  { label: "스튜디오 연출 컷", value: "studio_cut" },
] as const satisfies ReadonlyArray<{
  label: string;
  value: ProjectWorkType;
}>;

const STAGE_OPTIONS = [
  { label: "초안", value: "draft" },
  { label: "최종본", value: "final" },
] as const satisfies ReadonlyArray<{
  label: string;
  value: ProjectStage;
}>;

const Backdrop = styled.div`
position: fixed; z-index: 100; inset: 0; display: grid; place-items: center; padding: 24px; background: rgb(32 29 23 / 32%);
`;

const Overlay = styled.section`
display: flex; width: min(560px, 100%); max-height: calc(100dvh - 48px); flex-direction: column; overflow: hidden;
 border: 1px solid var(--color-border); border-radius: var(--radius-panel); background: var(--color-surface);
 box-shadow: 0 16px 48px rgb(32 29 23 / 18%);
 form { display: flex; min-height: 0; flex-direction: column; }
`;

const Header = styled.header`
display: flex; min-height: 45px; flex: 0 0 45px; align-items: center; justify-content: space-between; padding: 0 16px;
 border-bottom: 1px solid var(--color-border); background: var(--color-main-neutral-light);
 h2 { font-size: 16px; font-weight: 500; }
`;


const Fields = styled.div`
display: flex; min-height: 0; flex-direction: column; gap: 20px; padding: 24px; overflow-y: auto;
`;

const DateRow = styled.div`
display: flex; width: 100%; align-items: center; gap: 8px; font-size: 12px;
 > span:first-child { width: 104px; flex: 0 0 104px; text-align: left; font-size: 13px; font-weight: 500; margin-right: 8px; }
 span { font-size: 12px; }
 input { width: 44px; height: 32px; padding: 0 4px; border: 1px solid var(--color-border); border-radius: 4px; background: var(--color-surface); color: var(--color-label-studio-black); font-size: 13px; text-align: center; outline: none; }
 input:first-of-type { width: 72px; }
`;

const ErrorText = styled.p`
margin: 0; padding-left: 120px; font-size: 12px; line-height: 1.6; color: var(--color-label-studio-black);
`;

const Actions = styled.div`
display: flex; flex-shrink: 0; justify-content: flex-end; gap: 8px; padding: 16px; border-top: 1px solid var(--color-border);
 button { display: inline-flex; min-width: 80px; height: 32px; align-items: center; justify-content: center; padding: 0 12px; border-radius: 4px; font-size: 12px; cursor: pointer; }
 button:disabled { opacity: .5; cursor: default; }
`;

const Cancel = styled.button`
border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-label-studio-black); &:hover { background: var(--color-main-neutral-light); }
`;

const Submit = styled.button`
border: 0; background: var(--color-main-primary); color: var(--color-surface); &:hover:not(:disabled) { background: var(--color-main-secondary); }
`;

export function ProjectCreateOverlay({
  onClose,
}: {
  onClose: () => void;
}) {
  const create = useProjectStore((state) => state.createManualProject);
  const [name, setName] = useState("");
  const [work, setWork] = useState<ProjectWorkType | null>(null);
  const [stage, setStage] = useState<ProjectStage | null>(null);
  const [manager, setManager] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [error, setError] = useState("");

  const dialog = useRef<HTMLElement>(null);
  useDialogFocus(dialog, onClose);

  const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (!name.trim() || !work || !stage) {
      setError("프로젝트 이름, 작업 종류, 진행 단계를 모두 입력해 주세요.");
      return;
    }

    const date = parseDeliveryDate(year, month, day);

    if (date.error) {
      setError(date.error);
      return;
    }

    if(saving)return;
    setSaving(true);
    try { await create({
      projectName: name,
      workType: work,
      stage,
      manager,
      company,
      email,
      deliveryDueDate: date.value,
    });
    onClose(); } catch(error) { setError(error instanceof Error ? error.message : "프로젝트를 저장하지 못했습니다."); } finally { setSaving(false); }
  };

  const digits = (setValue: (value: string) => void) => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setValue(event.target.value.replace(/\D/g, ""));
  };

  return (
    <Backdrop
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <Overlay
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-create-title"
      >
        <Header>
          <h2
            className="type-small-head"
            id="project-create-title"
          >
            프로젝트 생성
          </h2>
          <ModalCloseAction
            type="button"
            aria-label="프로젝트 생성 창 닫기"
            onClick={onClose}
          >
            <X size={16} />
          </ModalCloseAction>
        </Header>
        <form onSubmit={submit}>
          <Fields>
            <InputString
              id="project-name"
              label="프로젝트 이름 *"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
            <InputChoose
              label="작업 종류 *"
              value={work}
              options={WORK_TYPE_OPTIONS}
              onChange={setWork}
            />
            <InputChoose
              label="진행 단계 *"
              value={stage}
              options={STAGE_OPTIONS}
              onChange={setStage}
            />
            <InputString
              id="manager"
              label="담당자"
              value={manager}
              onChange={(event) => setManager(event.target.value)}
            />
            <InputString
              id="company"
              label="회사명"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
            />
            <InputString
              id="email"
              label="이메일"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <DateRow>
              <span className="type-small-body">납기일</span>
              <input
                aria-label="납기 연도"
                maxLength={4}
                value={year}
                onChange={digits(setYear)}
              />
              <span className="type-small-body">년</span>
              <input
                aria-label="납기 월"
                maxLength={2}
                value={month}
                onChange={digits(setMonth)}
              />
              <span className="type-small-body">월</span>
              <input
                aria-label="납기 일"
                maxLength={2}
                value={day}
                onChange={digits(setDay)}
              />
              <span className="type-small-body">일</span>
            </DateRow>
            {error ? (
              <ErrorText role="alert">{error}</ErrorText>
            ) : null}
          </Fields>
          <Actions>
            <Cancel
              className="type-small-body"
              type="button"
              onClick={onClose}
            >
              취소
            </Cancel>
            <Submit
              disabled={saving}
              className="type-small-body"
              type="submit"
            >
              프로젝트 생성
            </Submit>
          </Actions>
        </form>
      </Overlay>
    </Backdrop>
  );
}
