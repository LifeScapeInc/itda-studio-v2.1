"use client";

import Image from "next/image";
import {
  useEffect,
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
  position: fixed;
  z-index: 100;
  inset: 0;
  display: grid;
  place-items: center;
  padding: var(--space-sm);
  background: rgb(32 29 23 / 28%);
`;

const Overlay = styled.section`
  position: relative;
  width: 612px;
  height: 689px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px);
  overflow: hidden;
  background: var(--color-main-neutral-light);
  box-shadow: 0 16px 48px rgb(32 29 23 / 20%);
`;

const Header = styled.header`
  position: absolute;
  z-index: 2;
  top: var(--space-sm);
  right: var(--space-md);
  left: var(--space-md);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const Close = styled.button`
  display: grid;
  width: 24px;
  height: 24px;
  margin: -6px -6px 0 0;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    background: rgb(32 29 23 / 5%);
    outline: none;
  }
`;

const Fields = styled.div`
  position: absolute;
  top: 72px;
  left: 50%;
  display: flex;
  width: 514px;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-xl);
  transform: translateX(-50%);
`;

const DateRow = styled.div`
  display: flex;
  width: 514px;
  height: 29px;
  align-items: center;
  gap: var(--space-2xs);

  & > span:first-child {
    width: 124px;
    flex: 0 0 124px;
    text-align: right;
  }

  input {
    width: 39px;
    height: 29px;
    padding: 0 4px 3px;
    border: 0;
    border-bottom: 1px solid var(--color-label-studio-black);
    border-radius: 0;
    background: var(--color-main-neutral);
    text-align: center;
    outline: none;
  }

  input:first-of-type {
    width: 79px;
  }
`;

const ErrorText = styled.p`
  width: 403px;
  align-self: flex-end;
  margin-top: -20px;
  color: #a33c2a;
  font-size: 12px;
`;

const Actions = styled.div`
  position: absolute;
  right: var(--space-3xl);
  bottom: var(--space-2xl);
  display: flex;
  gap: var(--space-sm);

  button {
    display: grid;
    width: 180px;
    height: 52px;
    place-items: center;
    padding: 0;
    border: 0;
    border-radius: 10px;
    color: var(--color-surface);
    cursor: pointer;
  }
`;

const Cancel = styled.button`
  background: var(--color-label-disabled);
`;

const Submit = styled.button`
  background: var(--color-main-primary);
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const submit = (event: FormEvent) => {
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

    create({
      projectName: name,
      workType: work,
      stage,
      manager,
      company,
      email,
      deliveryDueDate: date.value,
    });
    onClose();
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
          <Close
            type="button"
            aria-label="프로젝트 생성 창 닫기"
            onClick={onClose}
          >
            <Image
              src="/assets/project-overlay-close.svg"
              alt=""
              width={12}
              height={12}
            />
          </Close>
        </Header>
        <form onSubmit={submit}>
          <Fields>
            <InputString
              id="project-name"
              label="프로젝트 이름*:"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
            <InputChoose
              label="작업 종류*:"
              value={work}
              options={WORK_TYPE_OPTIONS}
              onChange={setWork}
            />
            <InputChoose
              label="진행 단계*:"
              value={stage}
              options={STAGE_OPTIONS}
              onChange={setStage}
            />
            <InputString
              id="manager"
              label="담당자:"
              value={manager}
              onChange={(event) => setManager(event.target.value)}
            />
            <InputString
              id="company"
              label="회사명:"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
            />
            <InputString
              id="email"
              label="이메일:"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <DateRow>
              <span className="type-small-body">납기일:</span>
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
