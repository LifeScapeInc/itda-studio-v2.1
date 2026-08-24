"use client";

import type { ReactNode } from "react";
import styled from "styled-components";

const Heading = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-md);

  p {
    color: var(--color-label-studio-comment);
    line-height: 1.5;
  }
`;

const Copy = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-3xs);
`;

export function AccountSubHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Heading>
      <Copy>
        <strong className="type-xsmall-body">{title}</strong>
        <p className="type-xsmall-thin">{description}</p>
      </Copy>
      {action}
    </Heading>
  );
}
