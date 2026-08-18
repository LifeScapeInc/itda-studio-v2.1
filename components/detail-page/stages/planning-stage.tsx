"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Link2,
  LoaderCircle,
  Palette,
  Quote,
  Sparkles,
  Tag,
  Target,
} from "lucide-react";
import styled from "styled-components";
import { PrimaryIconButton } from "@/components/ui/primary-icon-button";
import { useAppSettingsStore } from "@/stores/useAppSettingsStore";
import { useDetailPageStore } from "@/stores/useDetailPageStore";
import { useWorkspaceLayoutStore } from "@/stores/useWorkspaceLayoutStore";
import { DetailMaterialPreparationPanel } from "./material-preparation-stage";

const Stage = styled.section<{ $materialWidth: number }>`
  display: grid;
  width: 100%;
  min-height: 0;
  flex: 1;
  grid-template-columns: ${({ $materialWidth }) => $materialWidth}px minmax(0, 1fr);
  overflow: hidden;
`;

const PlanningArea = styled.div`
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  background: var(--color-surface);
  container-name: planning-area;
  container-type: inline-size;
  overflow: hidden;
`;

const Header = styled.header`
  display: flex;
  height: 48px;
  width: 100%;
  min-width: 0;
  flex: 0 0 48px;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-lg);
  padding: 0 var(--space-md);
  border-bottom: 1px solid var(--color-border);
`;

const Content = styled.div`
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: var(--space-lg);
  padding: var(--space-lg);
  overflow: hidden;

  @container planning-area (max-width: 720px) {
    gap: var(--space-sm);
    padding: var(--space-sm);
  }

  @container planning-area (max-width: 460px) {
    padding: var(--space-xs);
  }

  @media (max-height: 760px) {
    gap: var(--space-sm);
    padding-block: var(--space-sm);
  }
`;

const ScrollableContent = styled.div`
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  align-items: start;
  gap: var(--space-lg);
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: thin;

  @container planning-area (max-width: 720px) {
    gap: var(--space-sm);
  }
`;

const Status = styled.span`
  min-width: 0;
  flex: 0 1 auto;
  color: var(--color-label-studio-comment);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Empty = styled.div`
  display: flex;
  width: min(100%, 640px);
  min-height: 0;
  margin: auto;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  color: var(--color-label-studio-comment);
  text-align: center;

  p {
    line-height: 1.45;
  }
`;

const ElapsedTime = styled.span`
  color: var(--color-label-studio-comment);
  text-align: center;
`;

const Candidate = styled.article`
  display: grid;
  width: 100%;
  min-width: 0;
  min-height: 0;
  flex: 1;
  gap: var(--space-xl);
  grid-template-areas: "hero details";
  grid-template-columns: minmax(280px, 0.85fr) minmax(0, 1.15fr);

  @media (max-width: 900px) {
    grid-template-areas:
      "hero"
      "details";
    grid-template-columns: 1fr;
  }

  @container planning-area (max-width: 860px) {
    grid-template-areas:
      "hero"
      "details";
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-lg);
  }
`;

const CandidateCarousel = styled.div`
  display: grid;
  width: 100%;
  min-width: 0;
  min-height: 0;
  flex: 1;
  grid-template-columns: 32px minmax(0, 1fr) 32px;
  align-items: start;
  gap: var(--space-sm);

  @container planning-area (max-width: 620px) {
    grid-template-columns: 24px minmax(0, 1fr) 24px;
    gap: var(--space-2xs);
  }

  @media (max-height: 760px) {
    flex: 0 0 auto;
    align-items: start;
  }
`;

const DirectionButton = styled.button`
  display: grid;
  width: 100%;
  height: 40px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--color-label-studio-comment);
  cursor: pointer;

  &:hover:not(:disabled),
  &:focus-visible {
    color: var(--color-main-primary);
    outline: none;
  }

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }
`;

const Hero = styled.div`
  display: flex;
  grid-area: hero;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-sm);

  @container planning-area (max-width: 860px) {
    width: 100%;
    justify-self: stretch;
    align-items: flex-start;
    text-align: left;
  }
`;

const Axis = styled.span`
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: var(--space-xs);
  color: var(--color-main-primary);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;

  &::before {
    width: 7px;
    height: 7px;
    background: currentColor;
    transform: rotate(45deg);
    content: "";
  }
`;

const Concept = styled.h2`
  line-height: 1.35;
  overflow-wrap: anywhere;
`;

const Slogan = styled.blockquote`
  display: flex;
  align-items: flex-start;
  gap: var(--space-xs);
  margin: var(--space-xs) 0 0;
  padding: var(--space-md) 0 0;
  border-top: 1px solid var(--color-border);
  line-height: 1.5;

  svg {
    flex: none;
    color: var(--color-main-primary);
  }

  @container planning-area (max-width: 860px) {
    justify-content: flex-start;
  }
`;

const Keywords = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2xs);
  color: var(--color-label-studio-comment);

  span {
    font-size: 12px;
  }

  span::before {
    color: var(--color-main-primary);
    content: "#";
  }

  @container planning-area (max-width: 860px) {
    justify-content: flex-start;
  }
`;

const Details = styled.div`
  display: flex;
  grid-area: details;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-md);

  @media (max-width: 900px) {
    display: flex;
  }

  @container planning-area (max-width: 860px) {
    display: flex;
  }
`;

const DetailCard = styled.section`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: 8px;

  header {
    display: flex;
    align-items: center;
    gap: var(--space-2xs);
  }

  header svg {
    color: var(--color-main-primary);
  }
`;

const ToneGrid = styled.dl`
  display: grid;
  min-width: 0;
  margin: 0;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: var(--space-xs) var(--space-md);

  dt {
    color: var(--color-label-studio-comment);
    font-size: 11px;
  }

  dd {
    min-width: 0;
    margin: 0;
    line-height: 1.55;
    overflow-wrap: anywhere;
  }

  @container planning-area (max-width: 460px) {
    grid-template-columns: 60px minmax(0, 1fr);
    gap: var(--space-2xs) var(--space-xs);
  }
`;

const TargetCopy = styled.p`
  line-height: 1.6;
`;

const NamingTitle = styled.h3`
  line-height: 1.4;
`;

const NamingPrinciples = styled.ul`
  display: flex;
  margin: 0;
  padding: 0;
  flex-direction: column;
  gap: var(--space-2xs);
  color: var(--color-label-studio-comment);
  list-style: none;

  li {
    display: flex;
    gap: var(--space-2xs);
    line-height: 1.5;
  }

  li::before {
    color: var(--color-main-primary);
    content: "—";
  }
`;

const References = styled.section`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);

  & > header {
    display: flex;
    align-items: center;
    gap: var(--space-2xs);
  }

  & > header svg {
    color: var(--color-main-primary);
  }
`;

const ReferenceList = styled.div`
  display: grid;
  flex: 1;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-xs);

  @container planning-area (max-width: 460px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const ReferenceItem = styled.a`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
  padding: var(--space-sm);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: inherit;
  text-decoration: none;

  &:hover {
    border-color: var(--color-main-primary);
  }

  span,
  small {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  small {
    color: var(--color-label-studio-comment);
    line-height: 1.45;
  }
`;

const Navigator = styled.footer`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: var(--space-lg);

  & > button:last-child {
    grid-column: 3;
    justify-self: end;
  }

  @container planning-area (max-width: 620px) {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-sm);

    & > button:last-child {
      grid-column: 1;
      grid-row: 2;
      justify-self: center;
    }
  }

  @container planning-area (max-width: 460px) {
    & > button:last-child {
      width: 100%;
    }
  }
`;

const Dots = styled.div`
  display: flex;
  grid-column: 2;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);

  @container planning-area (max-width: 620px) {
    grid-column: 1;
    grid-row: 1;
  }
`;

const TemplateError = styled.p`
  grid-column: 1 / -1;
  margin: 0;
  color: #c83d32;
  line-height: 1.45;
  text-align: right;
`;

const DotList = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
`;

const Dot = styled.button<{ $active: boolean }>`
  width: 8px;
  height: 8px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: ${({ $active }) => (
    $active ? "var(--color-main-primary)" : "var(--color-main-neutral)"
  )};
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--color-main-primary);
    outline-offset: 3px;
  }
`;

function linkFor(address: string): string | undefined {
  const value = address.trim();
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[\w.-]+\.[a-z]{2,}/i.test(value)) return `https://${value}`;
  return undefined;
}

export function PlanningStage() {
  const state = useDetailPageStore();
  const [clock, setClock] = useState(() => Date.now());
  const mockMode = useAppSettingsStore(settings => settings.mockMode);
  const materialPanelWidth = useWorkspaceLayoutStore(
    layout => layout.materialPanelWidth,
  );
  const plan = state.plans[state.planIndex];
  const generatePlanning = state.generatePlanning;
  const plansLength = state.plans.length;
  const isPlanning = state.isPlanning;
  const planningError = state.planningError;
  const showPreviousPlan = state.showPreviousPlan;
  const showNextPlan = state.showNextPlan;
  const elapsedSeconds = state.planningStartedAt
    ? Math.max(0, clock - state.planningStartedAt) / 1000
    : 0;

  useEffect(() => {
    if (!state.isPlanning || !state.planningStartedAt) return;
    const timer = window.setInterval(() => setClock(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [state.isPlanning, state.planningStartedAt]);

  useEffect(() => {
    if (
      mockMode
      && !plansLength
      && !isPlanning
      && !planningError
    ) {
      void generatePlanning(true);
    }
  }, [
    generatePlanning,
    isPlanning,
    mockMode,
    planningError,
    plansLength,
  ]);

  useEffect(() => {
    if (plansLength < 2) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement
        && (
          target.isContentEditable
          || target.matches("input, textarea, select")
        )
      ) {
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPreviousPlan();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        showNextPlan();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [plansLength, showNextPlan, showPreviousPlan]);

  const tones = plan ? [
    ["비주얼", plan.toneAndManner.visual],
    ["사진", plan.toneAndManner.photo],
    ["카피", plan.toneAndManner.copy],
    ["서체", plan.toneAndManner.typography],
    ["레이아웃", plan.toneAndManner.layout],
  ] : [];
  const progressTitle = state.planningProgressStage === "proposal"
    ? "기획안을 작성중입니다"
    : "요청서를 읽고 있습니다";

  return (
    <Stage $materialWidth={materialPanelWidth}>
      <DetailMaterialPreparationPanel />
      <PlanningArea>
        <Header>
          <h1 className="type-xsmall-body">기획안 후보</h1>
          <Status className="type-xsmall-thin">{state.planningNote}</Status>
        </Header>

        <Content>
          {plan ? (
          <>
            <ScrollableContent>
              <CandidateCarousel>
              <DirectionButton
                type="button"
                aria-label="이전 기획안"
                disabled={state.plans.length < 2}
                onClick={state.showPreviousPlan}
              >
                <ChevronLeft size={22} />
              </DirectionButton>
              <Candidate>
                <Hero>
                  <Axis>{plan.axisName}</Axis>
                  <Keywords>
                    {plan.keywords.map(keyword => <span key={keyword}>{keyword}</span>)}
                  </Keywords>
                  <Concept className="type-medium-head">{plan.concept}</Concept>
                  <Slogan className="type-small-head">
                    <Quote size={20} />
                    <span>{plan.coreSlogan}</span>
                  </Slogan>
                  {state.references.length > 0 ? (
                    <References>
                      <header>
                        <Link2 size={16} />
                        <h3 className="type-xsmall-body">레퍼런스</h3>
                      </header>
                      <ReferenceList>
                        {state.references.map((reference, index) => {
                          const href = linkFor(reference.address);
                          return (
                            <ReferenceItem
                              key={`${reference.address}-${index}`}
                              href={href}
                              target={href ? "_blank" : undefined}
                              rel={href ? "noreferrer" : undefined}
                              as={href ? "a" : "div"}
                            >
                              <strong className="type-xsmall-body">{reference.title}</strong>
                              <span className="type-xsmall-thin">{reference.address}</span>
                              <small>{reference.referencePoint}</small>
                            </ReferenceItem>
                          );
                        })}
                      </ReferenceList>
                    </References>
                  ) : null}
                </Hero>

                <Details>
                  <DetailCard>
                    <header>
                      <Target size={16} />
                      <h4 className="type-xsmall-body">타겟 고객</h4>
                    </header>
                    <TargetCopy className="type-xsmall-body">{plan.targetCustomer}</TargetCopy>
                  </DetailCard>
                  <DetailCard>
                    <header>
                      <Palette size={16} />
                      <h4 className="type-xsmall-body">톤앤매너</h4>
                    </header>
                    <ToneGrid>
                      {tones.map(([label, value]) => (
                        <div key={label} style={{ display: "contents" }}>
                          <dt>{label}</dt>
                          <dd className="type-xsmall-body">{value}</dd>
                        </div>
                      ))}
                    </ToneGrid>
                  </DetailCard>
                  <DetailCard>
                    <header>
                      <Tag size={16} />
                      <h4 className="type-xsmall-body">네이밍</h4>
                    </header>
                    <NamingTitle className="type-small-head">
                      {plan.naming.workingTitle || plan.title}
                    </NamingTitle>
                    {plan.naming.principles.length ? (
                      <NamingPrinciples className="type-xsmall-body">
                        {plan.naming.principles.map(principle => (
                          <li key={principle}>{principle}</li>
                        ))}
                      </NamingPrinciples>
                    ) : (
                      <TargetCopy className="type-xsmall-thin">
                        별도로 제안된 네이밍 원칙이 없습니다.
                      </TargetCopy>
                    )}
                  </DetailCard>
                </Details>
              </Candidate>
              <DirectionButton
                type="button"
                aria-label="다음 기획안"
                disabled={state.plans.length < 2}
                onClick={state.showNextPlan}
              >
                <ChevronRight size={22} />
              </DirectionButton>
              </CandidateCarousel>
            </ScrollableContent>

            <Navigator>
              <Dots aria-label="기획안 후보 선택">
                <DirectionButton
                  type="button"
                  aria-label="이전 기획안"
                  disabled={state.plans.length < 2}
                  onClick={state.showPreviousPlan}
                >
                  <ChevronLeft size={18} />
                </DirectionButton>
                <DotList>
                  {state.plans.map((candidate, index) => (
                    <Dot
                      type="button"
                      $active={index === state.planIndex}
                      aria-label={`${index + 1}번 기획안: ${candidate.title}`}
                      aria-current={index === state.planIndex ? "true" : undefined}
                      onClick={() => state.showPlan(index)}
                      key={candidate.id}
                    />
                  ))}
                </DotList>
                <DirectionButton
                  type="button"
                  aria-label="다음 기획안"
                  disabled={state.plans.length < 2}
                  onClick={state.showNextPlan}
                >
                  <ChevronRight size={18} />
                </DirectionButton>
              </Dots>
              <PrimaryIconButton
                type="button"
                icon={state.isTemplatePlanning ? LoaderCircle : Sparkles}
                iconSize={16}
                iconClassName={state.isTemplatePlanning ? "animate-spin" : undefined}
                disabled={state.isTemplatePlanning}
                onClick={() => void state.confirmPlan(mockMode)}
              >
                {state.isTemplatePlanning
                  ? "템플릿 생성중"
                  : "이 기획안으로 템플릿 생성"}
              </PrimaryIconButton>
              {state.templatePlanningError ? (
                <TemplateError className="type-xsmall-thin" role="alert">
                  {state.templatePlanningError}
                </TemplateError>
              ) : null}
            </Navigator>
          </>
          ) : (
            <Empty>
              {state.isPlanning ? (
                <LoaderCircle className="animate-spin" size={42} strokeWidth={1.3} />
              ) : (
                <Sparkles size={42} strokeWidth={1.3} />
              )}
              <strong>
                {state.isPlanning ? progressTitle : "기획안을 생성해 주세요."}
              </strong>
              {state.isPlanning ? (
                <ElapsedTime className="type-xsmall-thin">
                  {Math.floor(elapsedSeconds)}초 경과
                </ElapsedTime>
              ) : null}
              {!state.isPlanning ? (
                <p className="type-xsmall-thin">
                  제품 이미지와 의뢰 요청서를 등록하면 기획안 후보가 표시됩니다.
                </p>
              ) : null}
            </Empty>
          )}
        </Content>
      </PlanningArea>
    </Stage>
  );
}
