"use client";

import { ReactNode } from "react";
import styled from "styled-components";

const GroupHeading = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3xs);
  padding-bottom: var(--space-sm);
  border-bottom: 3px solid var(--color-main-neutral);

  p {
    color: var(--color-label-studio-comment);
    line-height: 1.5;
  }
`;

export function AccountHeader({
    children
  }: {
    children: ReactNode;
  }) {
  return (
    <GroupHeading>
      <h2 className="type-small-body">{children}</h2>
    </GroupHeading>
  );
}
