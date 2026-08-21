"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styled from "styled-components";
import { useTokenUsageStore } from "@/stores/useTokenUsageStore";
import {
  addTokenUsage,
  EMPTY_TOKEN_USAGE,
  monthKey,
  type TokenUsage,
} from "@/system/usage/token-usage";

const Content = styled.div`
  display: flex;
  width: min(100%, 980px);
  flex-direction: column;
  gap: var(--space-lg);
`;

const UsagePeriod = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);

  > span {
    color: var(--color-label-studio-comment);
  }
`;

const MonthControls = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2xs);
`;

const MonthButton = styled.button`
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-label-studio-comment);
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: var(--color-main-primary);
    color: var(--color-main-primary);
  }

  &:disabled {
    opacity: 0.35;
    cursor: default;
  }
`;

const MonthLabel = styled.strong`
  min-width: 94px;
  text-align: center;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--space-xs);

  @media (max-width: 1080px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const Metric = styled.div<{ $primary?: boolean }>`
  display: flex;
  min-width: 0;
  min-height: 92px;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--space-xs);
  padding: var(--space-sm);
  border: 1px solid ${({ $primary }) => $primary
    ? "var(--color-main-primary)"
    : "var(--color-border)"};
  border-radius: 8px;
  background: ${({ $primary }) => $primary
    ? "var(--color-main-neutral-light)"
    : "var(--color-surface)"};

  span {
    color: var(--color-label-studio-comment);
  }

  strong {
    overflow: hidden;
    color: var(--color-label-studio-black);
    font-size: 18px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const ActivitySection = styled.section`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-sm);
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border);
`;

const ActivityHeading = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-md);

  p {
    color: var(--color-label-studio-comment);
  }
`;

const ChartViewport = styled.div`
  min-width: 0;
  overflow-x: auto;
  padding-bottom: var(--space-2xs);
`;

const LineChart = styled.svg`
  display: block;
  width: 100%;
  min-width: 720px;
  height: auto;

  .chart-grid {
    stroke: var(--color-border);
    stroke-width: 1;
  }

  .chart-line {
    fill: none;
    stroke: var(--color-main-primary);
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 3;
  }

  .chart-point {
    fill: var(--color-surface);
    stroke: var(--color-main-primary);
    stroke-width: 2;
    cursor: pointer;
    transition: fill 150ms ease-out;
  }

  .chart-point:hover,
  .chart-point:focus,
  .chart-point-selected {
    fill: var(--color-main-primary);
    outline: none;
  }

  .chart-label {
    fill: var(--color-label-studio-comment);
    font-size: 11px;
    text-anchor: middle;
  }
`;

type MonthlyActivity = {
  key: string;
  monthIndex: number;
  usage: TokenUsage;
};

const METRICS: Array<{ key: keyof TokenUsage; label: string }> = [
  { key: "total", label: "총 토큰" },
  { key: "inputText", label: "입력 · 텍스트" },
  { key: "inputImage", label: "입력 · 이미지" },
  { key: "outputText", label: "출력 · 텍스트" },
  { key: "outputImage", label: "출력 · 이미지" },
];

const CHART_WIDTH = 760;
const CHART_HEIGHT = 220;
const CHART_PADDING_X = 34;
const CHART_PADDING_TOP = 22;
const CHART_PADDING_BOTTOM = 38;

function yearMonths(
  year: number,
  dailyUsage: Record<string, TokenUsage>,
): MonthlyActivity[] {
  return Array.from({ length: 12 }, (_, monthIndex) => {
    const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
    const usage = Object.entries(dailyUsage)
      .filter(([date]) => date.startsWith(key))
      .reduce(
        (total, entry) => addTokenUsage(total, entry[1]),
        EMPTY_TOKEN_USAGE,
      );
    return { key, monthIndex, usage };
  });
}

function shiftMonth(month: Date, amount: number): Date {
  return new Date(month.getFullYear(), month.getMonth() + amount, 1);
}

export function TokenUsagePanel() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const dailyUsage = useTokenUsageStore((state) => state.dailyUsage);
  const chartYear = selectedMonth.getFullYear();
  const months = useMemo(
    () => yearMonths(chartYear, dailyUsage),
    [chartYear, dailyUsage],
  );
  const selectedKey = monthKey(selectedMonth);
  const monthUsage = useMemo(() => (
    Object.entries(dailyUsage)
      .filter(([key]) => key.startsWith(selectedKey))
      .reduce(
        (total, entry) => addTokenUsage(total, entry[1]),
        EMPTY_TOKEN_USAGE,
      )
  ), [dailyUsage, selectedKey]);
  const maximum = Math.max(0, ...months.map(month => month.usage.total));
  const chartPoints = months.map((month, index) => {
    const width = CHART_WIDTH - CHART_PADDING_X * 2;
    const height = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;
    const ratio = maximum > 0 ? month.usage.total / maximum : 0;
    return {
      ...month,
      x: CHART_PADDING_X + (width * index) / 11,
      y: CHART_PADDING_TOP + height * (1 - ratio),
    };
  });
  const chartLine = chartPoints.map(point => `${point.x},${point.y}`).join(" ");
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const isCurrentMonth = selectedMonth.getTime() >= currentMonth.getTime();

  return (
    <Content>
          <UsagePeriod>
            <MonthControls>
              <MonthButton
                type="button"
                aria-label="이전 달 보기"
                onClick={() => setSelectedMonth(month => shiftMonth(month, -1))}
              >
                <ChevronLeft size={15} />
              </MonthButton>
              <MonthLabel className="type-xsmall-body">
                {selectedMonth.toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                })}
              </MonthLabel>
              <MonthButton
                type="button"
                aria-label="다음 달 보기"
                disabled={isCurrentMonth}
                onClick={() => setSelectedMonth(month => shiftMonth(month, 1))}
              >
                <ChevronRight size={15} />
              </MonthButton>
            </MonthControls>
          </UsagePeriod>
          <SummaryGrid>
            {METRICS.map((metric, index) => (
              <Metric key={metric.key} $primary={index === 0}>
                <span className="type-xsmall-thin">{metric.label}</span>
                <strong title={monthUsage[metric.key].toLocaleString("ko-KR")}>
                  {monthUsage[metric.key].toLocaleString("ko-KR")}
                </strong>
              </Metric>
            ))}
          </SummaryGrid>
          <ActivitySection>
            <ActivityHeading>
              <div>
                <strong className="type-xsmall-body">{chartYear}년 월별 활동</strong>
                <p className="type-xsmall-thin">
                  각 점은 해당 월의 전체 토큰 사용량을 나타냅니다.
                </p>
              </div>
              <p className="type-xsmall-thin">
                최대 {maximum.toLocaleString("ko-KR")} tokens / month
              </p>
            </ActivityHeading>
            <ChartViewport>
              <LineChart
                viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                role="img"
                aria-label={`${chartYear}년 월별 토큰 사용량 꺾은선 그래프`}
              >
                {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                  const y = CHART_PADDING_TOP
                    + (CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM) * ratio;
                  return (
                    <line
                      key={ratio}
                      className="chart-grid"
                      x1={CHART_PADDING_X}
                      x2={CHART_WIDTH - CHART_PADDING_X}
                      y1={y}
                      y2={y}
                    />
                  );
                })}
                <polyline className="chart-line" points={chartLine} />
                {chartPoints.map(point => (
                  <g key={point.key}>
                    <circle
                      className={`chart-point ${point.monthIndex === selectedMonth.getMonth()
                        ? "chart-point-selected"
                        : ""}`}
                      cx={point.x}
                      cy={point.y}
                      r={point.monthIndex === selectedMonth.getMonth() ? 5 : 4}
                      role="button"
                      tabIndex={0}
                      aria-label={`${point.monthIndex + 1}월 ${point.usage.total.toLocaleString("ko-KR")} tokens`}
                      onClick={() => setSelectedMonth(
                        new Date(chartYear, point.monthIndex, 1),
                      )}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedMonth(new Date(chartYear, point.monthIndex, 1));
                        }
                      }}
                    >
                      <title>
                        {point.monthIndex + 1}월 · {point.usage.total.toLocaleString("ko-KR")} tokens
                      </title>
                    </circle>
                    <text
                      className="chart-label"
                      x={point.x}
                      y={CHART_HEIGHT - 12}
                    >
                      {point.monthIndex + 1}월
                    </text>
                  </g>
                ))}
              </LineChart>
            </ChartViewport>
          </ActivitySection>
    </Content>
  );
}
