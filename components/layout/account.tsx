"use client";

import styled from "styled-components";

const Badge = styled.div`
  position: relative;
  display: grid;
  width: 26px;
  height: 26px;
  flex: 0 0 26px;
  place-items: center;
  color: var(--color-surface);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;

  &::before {
    position: absolute;
    inset: -2px;
    border: 2px solid var(--color-main-tertiary);
    border-radius: 50%;
    background: var(--color-main-primary);
    content: "";
  }

  span {
    position: relative;
    z-index: 1;
  }
`;
export function Account({
  initials = "LS"
}: {
  initials?: string;
}) {
  return (
    <Badge
      aria-label={`${initials} 계정`}
    >
      <span>{initials}</span>
    </Badge>
  );
}
