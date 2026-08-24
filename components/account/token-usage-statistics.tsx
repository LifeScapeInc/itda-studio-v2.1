"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import styled from "styled-components";
import {
  addTokenUsage,
  EMPTY_TOKEN_USAGE,
  type TokenUsage,
  type TokenUsageRecord,
} from "@/system/usage/token-usage";
import { AccountSubHeader } from "./account-subheader";

type UsageTreeNode = {
  id: string;
  label: string;
  detail?: string;
  model?: string;
  records: TokenUsageRecord[];
  children?: UsageTreeNode[];
};

const Section = styled.section`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-sm);
  padding-top: var(--space-xl);
  border-top: 1px solid var(--color-border);
`;

const Tree = styled.div`
  display: flex;
  min-width: 820px;
  flex-direction: column;
`;

const StatisticsViewport = styled.div`
  min-width: 0;
  overflow-x: auto;
`;

const ColumnHeader = styled.div`
  display: grid;
  min-width: 820px;
  grid-template-columns: minmax(260px, 1.8fr) 72px repeat(4, minmax(92px, 1fr));
  gap: var(--space-xs);
  padding: 0 var(--space-sm) var(--space-xs);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-label-studio-comment);
  font-size: 11px;
  font-weight: 400;
`;

const ColumnLabel = styled.span`
  text-align: center;
  white-space: nowrap;
`;

const Node = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
`;

const NodeSummary = styled.button`
  display: grid;
  width: 100%;
  min-width: 0;
  grid-template-columns: minmax(260px, 1.8fr) 72px repeat(4, minmax(92px, 1fr));
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm);
  border: 0;
  border-bottom: 1px solid var(--color-border);
  background: transparent;
  color: inherit;
  font-size: 11px;
  font-weight: 400;
  text-align: left;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    background: var(--color-main-neutral-light);
    outline: none;
  }

  &:disabled {
    cursor: default;
  }

  &:disabled:hover {
    background: transparent;
  }
`;

const NodeIdentity = styled.div<{ $depth: number }>`
  display: grid;
  min-width: 0;
  grid-template-columns: 18px minmax(0, 1fr);
  align-items: start;
  gap: var(--space-2xs);
  padding-left: ${({ $depth }) => `${$depth * 20}px`};
`;

const IdentityCopy = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-3xs);

  span {
    font-size: 11px;
    font-weight: 400;
    line-height: 1.45;
  }

  span {
    color: var(--color-label-studio-comment);
  }

  span:first-child {
    color: var(--color-label-studio-black);
    font-size: 12px;
  }
`;

const Model = styled.span`
  color: var(--color-main-primary) !important;
`;

const MetricValue = styled.span`
  min-width: 0;
  color: var(--color-label-studio-black);
  font-size: 12px;
  font-weight: 400;
  line-height: 1.2;
  text-align: center;
`;

const Children = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
`;

const Empty = styled.div`
  display: grid;
  min-height: 112px;
  place-items: center;
  padding: var(--space-md);
  color: var(--color-label-studio-comment);
  text-align: center;
`;

const METRICS = [
  { key: "inputText", label: "입력 텍스트" },
  { key: "inputImage", label: "입력 이미지" },
  { key: "outputText", label: "출력 텍스트" },
  { key: "outputImage", label: "출력 이미지" },
] as const;

function averageUsage(records: TokenUsageRecord[]): TokenUsage {
  const total = addTokenUsage(
    EMPTY_TOKEN_USAGE,
    ...records.map(record => record.usage),
  );
  const divisor = Math.max(1, records.length);

  return {
    total: Math.round(total.total / divisor),
    inputText: Math.round(total.inputText / divisor),
    inputImage: Math.round(total.inputImage / divisor),
    outputText: Math.round(total.outputText / divisor),
    outputImage: Math.round(total.outputImage / divisor),
  };
}

function groupRecords(
  records: TokenUsageRecord[],
  getGroup: (record: TokenUsageRecord) => {
    id: string;
    label: string;
  },
): Array<{ id: string; label: string; records: TokenUsageRecord[] }> {
  const groups = new Map<
    string,
    { id: string; label: string; records: TokenUsageRecord[] }
  >();

  records.forEach((record) => {
    const group = getGroup(record);
    const current = groups.get(group.id);
    if (current) {
      current.records.push(record);
      return;
    }
    groups.set(group.id, { ...group, records: [record] });
  });

  return Array.from(groups.values());
}

function contextLeaves(records: TokenUsageRecord[]): UsageTreeNode[] {
  return groupRecords(records, record => ({
    id: record.context.key,
    label: record.context.label,
  })).map(group => {
    const context = group.records[0].context;
    return {
      ...group,
      detail: context.detail,
      model: context.model,
    };
  });
}

function cutContextLeaves(
  records: TokenUsageRecord[],
  categoryId: string,
): UsageTreeNode[] {
  const prefix = categoryId === "angles"
    ? "앵글 변주 · "
    : "콘텐츠 세트 · ";

  return contextLeaves(records).map(node => ({
    ...node,
    label: node.label.startsWith(prefix)
      ? node.label.slice(prefix.length)
      : node.label,
    detail: undefined,
    model: undefined,
  }));
}

function detailStage(record: TokenUsageRecord): { id: string; label: string } {
  const label = record.context.label;
  if (label.includes("기획안 생성")) {
    return { id: "planning", label: "기획안 생성 평균" };
  }
  if (label.includes("템플릿 초안 생성")) {
    return { id: "template", label: "템플릿 초안 생성 평균" };
  }
  if (label.includes("레이아웃")) {
    return { id: "layout", label: "최종 레이아웃 생성 평균" };
  }
  if (label.includes("이미지")) {
    return { id: "images", label: "최종 이미지 생성 평균" };
  }
  return { id: "other", label: "기타 상세페이지 호출 평균" };
}

function cutCategory(record: TokenUsageRecord): { id: string; label: string } {
  return record.context.label.startsWith("앵글 변주")
    ? { id: "angles", label: "앵글 변주 평균" }
    : { id: "content", label: "콘텐츠 세트 평균" };
}

function usageTree(records: TokenUsageRecord[]): UsageTreeNode[] {
  const detailRecords = records.filter(record => record.context.key.startsWith("detail:"));
  const cutRecords = records.filter(record => record.context.key.startsWith("cut:"));
  const classifiedIds = new Set([...detailRecords, ...cutRecords].map(record => record.id));
  const unclassifiedRecords = records.filter(record => !classifiedIds.has(record.id));
  const roots: UsageTreeNode[] = [];

  if (detailRecords.length) {
    const children = groupRecords(detailRecords, detailStage).map(group => {
      const leaves = contextLeaves(group.records);
      return {
        ...group,
        children: leaves.length > 1 ? leaves : undefined,
      };
    });
    roots.push({
      id: "detail",
      label: "상세페이지 전체 평균",
      records: detailRecords,
      children,
    });
  }

  if (cutRecords.length) {
    const children = groupRecords(cutRecords, cutCategory).map(group => ({
      ...group,
      children: cutContextLeaves(group.records, group.id),
    }));
    roots.push({
      id: "cut",
      label: "컷 생성 평균",
      records: cutRecords,
      children,
    });
  }

  if (unclassifiedRecords.length) {
    roots.push({
      id: "other",
      label: "기타 API 호출 평균",
      records: unclassifiedRecords,
      children: contextLeaves(unclassifiedRecords),
    });
  }

  return roots;
}

function StatisticsNode({
  node,
  depth,
}: {
  node: UsageTreeNode;
  depth: number;
}) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = Boolean(node.children?.length);
  const average = averageUsage(node.records);

  return (
    <Node>
      <NodeSummary
        type="button"
        disabled={!hasChildren}
        aria-expanded={hasChildren ? open : undefined}
        onClick={() => hasChildren && setOpen(value => !value)}
      >
        <NodeIdentity $depth={depth}>
          {hasChildren ? (
            open ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : <span aria-hidden="true" />}
          <IdentityCopy>
            <span>{node.label}</span>
            {node.model ? (
              <Model className="type-xsmall-thin">{node.model}</Model>
            ) : null}
            {node.detail ? (
              <span className="type-xsmall-thin">{node.detail}</span>
            ) : null}
          </IdentityCopy>
        </NodeIdentity>
        <MetricValue>{node.records.length.toLocaleString("ko-KR")}</MetricValue>
        {METRICS.map(metric => (
          <MetricValue key={metric.key}>
            {average[metric.key].toLocaleString("ko-KR")}
          </MetricValue>
        ))}
      </NodeSummary>
      {hasChildren && open ? (
        <Children>
          {node.children?.map(child => (
            <StatisticsNode node={child} depth={depth + 1} key={child.id} />
          ))}
        </Children>
      ) : null}
    </Node>
  );
}

export function TokenUsageStatistics({
  records,
}: {
  records: TokenUsageRecord[];
}) {
  const tree = usageTree(records);

  return (
    <Section>
      <AccountSubHeader
        title="통계 더보기"
        description="상위 평균을 선택해 단계와 생성 항목별 평균까지 내려가 확인합니다."
      />
      {tree.length ? (
        <StatisticsViewport>
          <ColumnHeader className="type-xsmall-thin">
            <span />
            <ColumnLabel>호출 수</ColumnLabel>
            {METRICS.map(metric => (
              <ColumnLabel key={metric.key}>{metric.label}</ColumnLabel>
            ))}
          </ColumnHeader>
          <Tree>
            {tree.map(node => <StatisticsNode node={node} depth={0} key={node.id} />)}
          </Tree>
        </StatisticsViewport>
      ) : (
        <Empty className="type-xsmall-thin">
          유형별 평균을 계산할 실제 API 호출 기록이 없습니다.
        </Empty>
      )}
    </Section>
  );
}
