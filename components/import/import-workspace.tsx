"use client";

import Image from "next/image";
import styled from "styled-components";
import { NavigationLeft } from "@/components/layout/navigation-left";
import { NavigationTop } from "@/components/layout/navigation-top";
import { ButtonBack } from "@/components/ui/button-back";
import { LabelTitle } from "@/components/ui/label-title";
import { StudioShell, WorkspaceContent, HiddenScrollbar } from "@/system/styles/layout";
import { getCaseKey } from "@/system/integrations/cases";
import { useImportWorkspace } from "@/system/import/use-import-workspace";
import { ButtonCreateProject } from "./button-create-project";
import { ItemCase } from "./item-case";
import { ItemCustomer } from "./item-customer";
const Header = styled.div`display:flex;width:100%;flex:0 0 auto;align-items:flex-start;justify-content:space-between;gap:var(--space-xl);&>header{min-width:0;flex:1}`;
const CustomerScroll = styled(HiddenScrollbar)`min-height:0;flex:1;margin-top:var(--space-2xl);overflow-x:hidden;overflow-y:auto;overscroll-behavior-y:contain;padding-block:var(--space-3xs)`;
const CustomerGrid = styled.section`display:grid;grid-template-columns:repeat(auto-fill,314px);align-content:start;gap:var(--space-lg)`;
const Feedback = styled.div<{
  $error?: boolean;
}>`grid-column:1/-1;display:flex;min-height:96px;align-items:${p => p.$error ? "flex-start" : "center"};flex-direction:${p => p.$error ? "column" : "row"};justify-content:center;gap:var(--space-sm);color:var(--color-label-studio-comment);font-size:14px`;
const Retry = styled.button`padding:var(--space-xs) var(--space-sm);border:1px solid var(--color-main-primary);border-radius:8px;background:var(--color-main-primary);color:white;cursor:pointer`;
const CaseView = styled.div`display:grid;min-height:0;flex:1;grid-template-rows:minmax(0,449fr) minmax(56px,347fr);gap:var(--space-2xl);margin-top:var(--space-2xl);overflow:hidden`;
const CaseGrid = styled(HiddenScrollbar)`display:grid;min-height:0;height:100%;grid-template-columns:repeat(auto-fill,379px);align-content:start;gap:var(--space-lg);overflow-x:hidden;overflow-y:auto;padding-block:var(--space-3xs)`;
const Existing = styled.section`display:grid;min-height:0;height:100%;grid-template-rows:20px minmax(0,1fr);gap:var(--space-2xl);overflow:hidden`;
const ExistingHeading = styled.div`display:flex;align-items:center;gap:var(--space-md);color:var(--color-main-primary);h2{flex:0 0 auto}`;
const Divider = styled.span`position:relative;height:2px;flex:1;overflow:hidden;img{object-fit:fill}`;
export function ImportWorkspace() {
  const m = useImportWorkspace();
  return (
    <StudioShell>
      <NavigationTop />
      <NavigationLeft />
      <WorkspaceContent>
        {m.customer ? (
          <ButtonBack
            label="고객 목록"
            ariaLabel="고객 목록으로 돌아가기"
            onClick={m.returnToCustomerList}
          />
        ) : null}
        <Header>
          <LabelTitle
            title={m.customer ? `가져오기  •  ${m.customer.email}` : "가져오기"}
            description="ITDA 관리자에서 고객 의뢰 케이스 정보를 불러옵니다. 케이스를 선택하여 ITDA studio의 프로젝트로 생성할 수 있습니다"
          />
          {m.customer ? (
            <ButtonCreateProject
              disabled={!m.selected}
              onClick={m.createProject}
            />
          ) : null}
        </Header>
        {m.customer ? (
          <CaseView>
            <CaseGrid
              as="section"
              aria-label={`${m.customer.email}의 case 목록`}
            >
              {m.available.map(item => (
                <ItemCase
                  item={item}
                  selected={getCaseKey(item) === m.selectedCaseKey}
                  onClick={() => m.selectCase(getCaseKey(item))}
                  key={getCaseKey(item)}
                />
              ))}
            </CaseGrid>
            <Existing aria-labelledby="existing-project-title">
              <ExistingHeading>
                <h2
                  className="type-small-body"
                  id="existing-project-title"
                >
                  이미 프로젝트가 존재하는 케이스
                </h2>
                <Divider>
                  <Image
                    src="/assets/existing-project-divider.svg"
                    alt=""
                    fill
                    sizes="100vw"
                  />
                </Divider>
              </ExistingHeading>
              <CaseGrid>
                {m.existing.map(item => (
                  <ItemCase
                    item={item}
                    disabled
                    key={getCaseKey(item)}
                  />
                ))}
              </CaseGrid>
            </Existing>
          </CaseView>
        ) : (
          <CustomerScroll>
            <CustomerGrid aria-label="가져올 고객 목록">
              {m.status === "loading" && !m.customers.length ? (
                <Feedback role="status">
                  고객 case 정보를 불러오는 중입니다.
                </Feedback>
              ) : null}
              {m.status === "error" ? (
                <Feedback
                  $error
                  role="alert"
                >
                  <p>
                    {m.error}
                  </p>
                  <Retry onClick={() => void m.loadCases()}>
                    다시 시도
                  </Retry>
                </Feedback>
              ) : null}
              {m.status === "success" && !m.customers.length ? (
                <Feedback>
                  가져올 case가 없습니다.
                </Feedback>
              ) : null}
              {m.customers.map(c => (
                <ItemCustomer
                  {...c}
                  onClick={() => m.selectCustomer(c.email)}
                  key={c.email}
                />
              ))}
            </CustomerGrid>
          </CustomerScroll>
        )}
      </WorkspaceContent>
    </StudioShell>
  );
}
