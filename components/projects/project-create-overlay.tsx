"use client";

import { Camera, Check, PanelsTopLeft, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import styled from "styled-components";
import { useProjectStore, type ProjectStage, type ProjectWorkType } from "@/stores/useProjectStore";
import { parseDeliveryDate } from "@/system/projects/project-form";

const WORK_TYPES = [
  { value: "studio_cut", label: "스튜디오 연출 컷", description: "제품의 새로운 장면을 만드는 이미지 작업", icon: Camera },
  { value: "detail_page", label: "상세 페이지", description: "제품의 이야기를 담는 상세 페이지 작업", icon: PanelsTopLeft },
] as const;

const Backdrop = styled.div`
  position: fixed;
  z-index: 100;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgb(20 19 17 / 38%);
  backdrop-filter: blur(5px);
`;
const Overlay = styled.section`
  display: flex;
  width: min(920px, 100%);
  max-height: calc(100dvh - 48px);
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  background: var(--color-surface);
  box-shadow: 0 24px 80px rgb(20 19 17 / 24%);

  form { display: flex; min-height: 0; flex-direction: column; }
`;
const Header = styled.header`
  display: flex;
  flex: 0 0 auto;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 30px 24px;

  h2 { font-size: 24px; font-weight: 700; letter-spacing: -.6px; }
  p { margin-top: 8px; color: var(--color-label-studio-comment); font-size: 13px; line-height: 1.5; }
`;
const Close = styled.button`
  display: grid;
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  place-items: center;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--color-label-studio-comment);
  cursor: pointer;
  &:hover { background: var(--color-main-neutral); }
`;
const Body = styled.div`
  min-height: 0;
  overflow: auto;
  padding: 0 30px;
`;
const Sections = styled.div`
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 0 20px;
`;
const Section = styled.section`
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr);
  gap: 24px;
  padding: 24px 0;
  & + & { border-top: 1px solid var(--color-border); }
  @media (max-width: 680px) { grid-template-columns: 1fr; gap: 16px; }
`;
const SectionTitle = styled.div`
  display: grid;
  grid-template-columns: 23px 1fr;
  align-content: start;
  gap: 8px;
  padding-top: 2px;
  > span { padding-top: 2px; color: var(--color-label-studio-comment); font-size: 11px; }
  h3 { margin: 0; font-size: 14px; font-weight: 650; }
  p { grid-column: 2; color: var(--color-label-studio-comment); font-size: 12px; line-height: 1.6; }
`;
const TypeOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
`;
const TypeCard = styled.label<{ $selected: boolean }>`
  position: relative;
  display: flex;
  min-height: 128px;
  flex-direction: column;
  align-items: flex-start;
  padding: 16px;
  border: 1px solid ${({ $selected }) => $selected ? "var(--color-label-studio-black)" : "var(--color-border)"};
  border-radius: 9px;
  background: ${({ $selected }) => $selected ? "var(--color-main-neutral-light)" : "var(--color-surface)"};
  cursor: pointer;
  input { position: absolute; width: 1px; height: 1px; opacity: 0; }
  &:has(input:focus-visible) { outline: 2px solid var(--color-main-primary); outline-offset: 3px; }
  strong { margin-top: 14px; font-size: 13px; font-weight: 650; }
  small { margin-top: 6px; color: var(--color-label-studio-comment); font-size: 11px; line-height: 1.5; }
`;
const SelectionMark = styled.span<{ $selected: boolean }>`
  position: absolute;
  top: 16px;
  right: 16px;
  display: grid;
  width: 16px;
  height: 16px;
  place-items: center;
  border: 1px solid ${({ $selected }) => $selected ? "var(--color-label-studio-black)" : "var(--color-border)"};
  border-radius: 50%;
  background: ${({ $selected }) => $selected ? "var(--color-label-studio-black)" : "transparent"};
  color: var(--color-surface);
`;
const Fields = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 16px;
`;
const Field = styled.label`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
  font-weight: 550;
  em { color: #a33c2a; font-style: normal; }
  input, textarea, select {
    width: 100%;
    min-height: 38px;
    padding: 10px 12px;
    border: 1px solid var(--color-border);
    border-radius: 7px;
    background: var(--color-surface);
    color: var(--color-label-studio-black);
    font: inherit;
    font-weight: 400;
  }
  input::placeholder, textarea::placeholder { color: var(--color-label-studio-comment); }
  input:focus, textarea:focus, select:focus { outline: 2px solid var(--color-main-primary); outline-offset: 1px; }
  textarea { min-height: 88px; resize: vertical; line-height: 1.6; }
`;
const FieldPair = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
`;
const CharacterCount = styled.span`
  align-self: flex-end;
  color: var(--color-label-studio-comment);
  font-size: 10px;
  font-weight: 400;
`;
const Footer = styled.footer`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px 30px;
  button { min-width: 100px; height: 40px; padding: 0 20px; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; }
`;
const Cancel = styled.button`
  border: 1px solid var(--color-border);
  background: var(--color-main-neutral-light);
`;
const Submit = styled.button`
  border: 1px solid var(--color-label-studio-black);
  background: var(--color-label-studio-black);
  color: var(--color-surface);
`;
const ErrorText = styled.p`
  margin-top: 14px;
  color: #a33c2a;
  font-size: 12px;
`;

export function ProjectCreateOverlay({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const create = useProjectStore((state) => state.createManualProject);
  const dialogRef = useRef<HTMLElement>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [work, setWork] = useState<ProjectWorkType>("studio_cut");
  const [stage, setStage] = useState<ProjectStage>("draft");
  const [manager, setManager] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]):not([type="radio"]), input[type="radio"]:checked, textarea, select, [tabindex="0"]',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("프로젝트명을 입력해 주세요.");
      return;
    }
    const [year = "", month = "", day = ""] = dueDate.split("-");
    const date = parseDeliveryDate(year, month, day);
    if (date.error) {
      setError(date.error);
      return;
    }
    create({ projectName: name, description, workType: work, stage, manager, company, email, deliveryDueDate: date.value });
    onCreated();
  };

  return (
    <Backdrop onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <Overlay ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="project-create-title" aria-describedby="project-create-description">
        <Header>
          <div>
            <h2 id="project-create-title">프로젝트 생성</h2>
            <p id="project-create-description">새로운 아이디어를 시작할 공간을 준비하세요.</p>
          </div>
          <Close type="button" aria-label="프로젝트 생성 창 닫기" onClick={onClose}><X size={18} /></Close>
        </Header>
        <form onSubmit={submit}>
          <Body>
            <Sections>
              <Section aria-labelledby="project-type-heading">
                <SectionTitle><span>01</span><h3 id="project-type-heading">프로젝트 유형</h3><p>어떤 작업을 시작할까요?</p></SectionTitle>
                <TypeOptions role="radiogroup" aria-labelledby="project-type-heading">
                  {WORK_TYPES.map(({ value, label, description: hint, icon: Icon }) => (
                    <TypeCard key={value} $selected={work === value}>
                      <input type="radio" name="project-type" value={value} checked={work === value} onChange={() => setWork(value)} />
                      <Icon size={23} strokeWidth={1.5} aria-hidden="true" />
                      <SelectionMark $selected={work === value}>{work === value ? <Check size={10} strokeWidth={3} /> : null}</SelectionMark>
                      <strong>{label}</strong><small>{hint}</small>
                    </TypeCard>
                  ))}
                </TypeOptions>
              </Section>
              <Section aria-labelledby="project-info-heading">
                <SectionTitle><span>02</span><h3 id="project-info-heading">프로젝트 정보</h3><p>이름과 간단한 설명을 남겨 주세요.</p></SectionTitle>
                <Fields>
                  <Field htmlFor="project-name"><span>프로젝트명 <em>*</em></span><input id="project-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="프로젝트명을 입력하세요" required maxLength={100} autoFocus /></Field>
                  <Field htmlFor="project-description"><span>설명</span><textarea id="project-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="프로젝트의 목적이나 작업 내용을 간단히 적어 주세요" maxLength={500} /><CharacterCount>{description.length}/500</CharacterCount></Field>
                </Fields>
              </Section>
              <Section aria-labelledby="project-details-heading">
                <SectionTitle><span>03</span><h3 id="project-details-heading">작업 관리</h3><p>담당자와 일정을 함께 기록하세요.<br />나머지 정보는 선택 사항입니다.</p></SectionTitle>
                <Fields>
                  <FieldPair>
                    <Field htmlFor="project-company"><span>회사 / 브랜드</span><input id="project-company" value={company} onChange={(event) => setCompany(event.target.value)} placeholder="회사 또는 브랜드명" maxLength={100} /></Field>
                    <Field htmlFor="project-manager"><span>담당자</span><input id="project-manager" value={manager} onChange={(event) => setManager(event.target.value)} placeholder="담당자 이름" maxLength={100} /></Field>
                  </FieldPair>
                  <Field htmlFor="project-email"><span>이메일</span><input id="project-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" maxLength={254} /></Field>
                  <FieldPair>
                    <Field htmlFor="project-stage"><span>진행 단계</span><select id="project-stage" value={stage} onChange={(event) => setStage(event.target.value as ProjectStage)}><option value="draft">진행 중 · 초안</option><option value="final">최종본</option></select></Field>
                    <Field htmlFor="project-due-date"><span>납기일</span><input id="project-due-date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></Field>
                  </FieldPair>
                </Fields>
              </Section>
            </Sections>
            {error ? <ErrorText role="alert">{error}</ErrorText> : null}
          </Body>
          <Footer><Cancel type="button" onClick={onClose}>취소</Cancel><Submit type="submit">프로젝트 생성</Submit></Footer>
        </form>
      </Overlay>
    </Backdrop>
  );
}
