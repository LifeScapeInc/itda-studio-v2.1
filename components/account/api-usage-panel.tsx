"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import styled from "styled-components";
import { utcMonthKey, type OrganizationUsage, type UsageApiError } from "@/system/usage/organization-usage";
import { AccountSubHeader } from "./account-subheader";

const Content = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-lg);
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-sm);
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
`;

const Control = styled.button`
  display: inline-flex;
  min-width: 32px;
  min-height: 32px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  border-radius: 7px;
  background: var(--color-surface);
  color: var(--color-label-studio-black);
  font-size: 12px;
  cursor: pointer;

  &:hover:not(:disabled) { border-color: var(--color-main-primary); }
  &:focus-visible { outline: 2px solid var(--color-main-primary); outline-offset: 2px; }
  &:disabled { opacity: 0.4; cursor: default; }
`;

const Month = styled.strong`
  min-width: 110px;
  text-align: center;
  font-size: 14px;
`;

const PlatformLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--color-main-primary);
  font-size: 12px;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const Meta = styled.p`
  color: var(--color-label-studio-comment);
  font-size: 12px;
  line-height: 1.65;
  overflow-wrap: anywhere;
`;

const Notice = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-main-neutral-light);
  color: var(--color-label-studio-black);
  font-size: 13px;
  line-height: 1.6;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-sm);
  @media (max-width: 1080px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
`;

const Metric = styled.div<{ $primary?: boolean }>`
  display: flex;
  min-width: 0;
  min-height: 112px;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
  padding: 18px;
  border: 1px solid ${({ $primary }) => $primary ? "var(--color-main-primary)" : "var(--color-border)"};
  border-radius: 10px;
  background: ${({ $primary }) => $primary ? "var(--color-main-neutral-light)" : "var(--color-surface)"};
  span { color: var(--color-label-studio-comment); font-size: 12px; }
  strong { font-size: 24px; font-weight: 600; overflow-wrap: anywhere; font-variant-numeric: tabular-nums; }
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  min-width: 0;
  padding-top: var(--space-lg);
  border-top: 1px solid var(--color-border);
`;

const Viewport = styled.div`
  min-width: 0;
  overflow-x: auto;
`;

const Chart = styled.svg`
  display: block;
  width: 100%;
  min-width: 580px;
  .grid { stroke: var(--color-border); stroke-width: 1; }
  .line { fill: none; stroke: var(--color-main-primary); stroke-width: 2.5; stroke-linejoin: round; }
  .point { fill: var(--color-surface); stroke: var(--color-main-primary); stroke-width: 2; }
  text { fill: var(--color-label-studio-comment); font-size: 10px; }
`;

const Table = styled.table`
  width: 100%;
  min-width: 560px;
  border-collapse: collapse;
  font-size: 12px;
  th, td { padding: 12px 10px; border-bottom: 1px solid var(--color-border); text-align: right; }
  th { color: var(--color-label-studio-comment); font-weight: 400; }
  th:first-child, td:first-child { text-align: left; }
  td { font-variant-numeric: tabular-nums; }
`;

const usd = (value: number) => new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 4,
}).format(value);

function shiftMonth(month: string, amount: number): string {
  const [year, number] = month.split("-").map(Number);
  return utcMonthKey(new Date(Date.UTC(year, number - 1 + amount, 1)));
}

function DailyCostChart({ usage }: { usage: OrganizationUsage }) {
  const days: Array<{ date: string; cost: number }> = [];
  const costs = new Map(usage.dailyCosts.map(day => [day.date, day.costUsd]));
  for (let day = usage.startTime; day < usage.endTime; day += 86_400) {
    const date = new Date(day * 1000).toISOString().slice(0, 10);
    days.push({ date, cost: costs.get(date) ?? 0 });
  }
  const minimum = Math.min(0, ...days.map(day => day.cost));
  const maximum = Math.max(0, ...days.map(day => day.cost));
  const span = maximum - minimum || 1;
  const points = days.map((day, index) => ({
    ...day,
    x: 66 + (650 * index) / Math.max(1, days.length - 1),
    y: 20 + 150 * (1 - (day.cost - minimum) / span),
  }));
  return (
    <Viewport>
      <Chart viewBox="0 0 740 212" role="img" aria-label={`${usage.month} 일별 OpenAI 비용, 총 ${usd(usage.costUsd ?? 0)}`}>
        {[0, 0.5, 1].map(ratio => (
          <g key={ratio}>
            <line className="grid" x1={66} x2={716} y1={20 + 150 * ratio} y2={20 + 150 * ratio} />
            <text x={56} y={24 + 150 * ratio} textAnchor="end">{usd(maximum - (maximum - minimum) * ratio)}</text>
          </g>
        ))}
        <polyline className="line" points={points.map(point => `${point.x},${point.y}`).join(" ")} />
        {points.map((point, index) => (
          <g key={point.date}>
            <circle className="point" cx={point.x} cy={point.y} r={3}>
              <title>{point.date} · {usd(point.cost)}</title>
            </circle>
            {index === 0 || index === points.length - 1 || (index + 1) % 5 === 0 ? (
              <text x={point.x} y={198} textAnchor="middle">{Number(point.date.slice(-2))}일</text>
            ) : null}
          </g>
        ))}
      </Chart>
    </Viewport>
  );
}

type LoadedState = { key: string; usage?: OrganizationUsage; error?: UsageApiError };

export function ApiUsagePanel() {
  const [month, setMonth] = useState(() => utcMonthKey());
  const [revision, setRevision] = useState(0);
  const [loaded, setLoaded] = useState<LoadedState | null>(null);
  const requestKey = `${month}:${revision}`;
  const current = loaded?.key === requestKey ? loaded : null;
  const loading = current === null;
  const usage = current?.usage;
  const error = current?.error;

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/usage?month=${encodeURIComponent(month)}`, {
          cache: "no-store", signal: controller.signal,
        });
        const payload = await response.json() as OrganizationUsage | UsageApiError;
        if (controller.signal.aborted) return;
        if (!response.ok || "error" in payload) {
          const failure = "error" in payload ? payload : { code: "UNAVAILABLE" as const, error: "사용량을 불러오지 못했습니다." };
          setLoaded({ key: requestKey, error: failure });
        } else {
          setLoaded({ key: requestKey, usage: payload });
        }
      } catch {
        if (!controller.signal.aborted) {
          setLoaded({ key: requestKey, error: { code: "UNAVAILABLE", error: "사용량 서버에 연결하지 못했습니다. 잠시 후 다시 확인해 주세요." } });
        }
      }
    }
    void load();
    return () => controller.abort();
  }, [month, requestKey]);

  const formattedMonth = new Date(`${month}-01T00:00:00Z`).toLocaleDateString("ko-KR", { year: "numeric", month: "long", timeZone: "UTC" });
  const count = (value: number | null) => value === null ? "조회 불가" : value.toLocaleString("ko-KR");

  return (
    <Content aria-busy={loading}>
      <Toolbar>
        <Controls>
          <Control type="button" aria-label="이전 달 보기" disabled={month <= "2020-01"} onClick={() => setMonth(value => shiftMonth(value, -1))}>
            <ChevronLeft size={15} />
          </Control>
          <Month>{formattedMonth}</Month>
          <Control type="button" aria-label="다음 달 보기" disabled={month >= utcMonthKey()} onClick={() => setMonth(value => shiftMonth(value, 1))}>
            <ChevronRight size={15} />
          </Control>
          <Control type="button" disabled={loading} onClick={() => setRevision(value => value + 1)} title="최대 60초간 캐시된 결과를 표시합니다">
            <RefreshCw size={13} /> 새로고침
          </Control>
        </Controls>
        <PlatformLink href="https://platform.openai.com/usage" target="_blank" rel="noopener noreferrer">
          OpenAI Platform <ArrowUpRight size={14} />
        </PlatformLink>
      </Toolbar>

      {loading ? <Notice role="status">OpenAI Platform 사용량을 불러오는 중입니다.</Notice> : null}
      {error ? (
        <Notice role="status">
          <strong>{error.code === "NOT_CONFIGURED" ? "OpenAI 사용량을 연결해 주세요" : "사용량을 확인할 수 없습니다"}</strong>
          <p>{error.error}</p>
          {error.code === "AUTH_REQUIRED" ? <PlatformLink href="/login">다시 로그인 <ArrowUpRight size={14} /></PlatformLink> : null}
          {error.code === "NOT_CONFIGURED" ? (
            <PlatformLink href="https://developers.openai.com/api/docs/guides/admin-apis" target="_blank" rel="noopener noreferrer">
              관리 키 설정 안내 <ArrowUpRight size={14} />
            </PlatformLink>
          ) : null}
        </Notice>
      ) : null}

      {usage ? (
        <>
          <Meta>
            {usage.scope === "organization" ? "OpenAI 조직 전체 · 모든 기기와 앱의 사용량" : `OpenAI 프로젝트 ${usage.projectIds.length}개 · ${usage.projectIds.join(", ")}`}
            <br />UTC 기준 · {new Date(usage.fetchedAt).toLocaleString("ko-KR")} 조회 · 최대 60초 캐시
          </Meta>
          {usage.warnings.length ? (
            <Notice role="status">
              <strong>일부 사용량을 불러오지 못했습니다</strong>
              {usage.warnings.map(warning => (
                <p key={warning.source}>{({ costs: "비용", images: "이미지", completions: "모델 응답" })[warning.source]}: {warning.error}</p>
              ))}
            </Notice>
          ) : null}
          <SummaryGrid>
            <Metric $primary><span>총 API 비용 · USD</span><strong>{usage.costUsd === null ? "조회 불가" : usd(usage.costUsd)}</strong></Metric>
            <Metric><span>처리 이미지</span><strong>{count(usage.images)}</strong></Metric>
            <Metric><span>이미지 API 호출</span><strong>{count(usage.imageRequests)}</strong></Metric>
            <Metric><span>모델 응답 호출</span><strong>{count(usage.completionRequests)}</strong></Metric>
          </SummaryGrid>
          <Meta>
            비용은 OpenAI Costs API의 전체 비용 항목입니다. 처리 이미지와 호출 수는 Images / Completions Usage API 기준이며 전체 API 호출 수를 뜻하지 않습니다.
            OpenAI 집계 반영이 지연될 수 있으며 최종 청구 금액과 다를 수 있습니다.
          </Meta>
          {usage.costUsd !== null ? (
            <Section>
              <AccountSubHeader title="일별 비용" description="선택한 달의 OpenAI 비용을 USD로 확인합니다." />
              <DailyCostChart usage={usage} />
            </Section>
          ) : null}
          <Section>
            <AccountSubHeader title="모델별 사용량" description="OpenAI가 집계한 이미지 및 모델 응답 호출입니다." />
            {usage.models.length ? (
              <Viewport>
                <Table>
                  <thead><tr><th scope="col">모델</th><th scope="col">처리 이미지</th><th scope="col">이미지 API 호출</th><th scope="col">모델 응답 호출</th></tr></thead>
                  <tbody>{usage.models.map(model => (
                    <tr key={model.model}>
                      <td>{model.model}</td>
                      <td>{usage.images === null ? "—" : model.images.toLocaleString("ko-KR")}</td>
                      <td>{usage.imageRequests === null ? "—" : model.imageRequests.toLocaleString("ko-KR")}</td>
                      <td>{usage.completionRequests === null ? "—" : model.completionRequests.toLocaleString("ko-KR")}</td>
                    </tr>
                  ))}</tbody>
                </Table>
              </Viewport>
            ) : <Meta>{usage.images === null || usage.completionRequests === null ? "일부 모델 사용량을 조회할 수 없습니다." : "이 기간에 집계된 이미지/모델 응답 호출이 없습니다."}</Meta>}
          </Section>
        </>
      ) : null}
    </Content>
  );
}
