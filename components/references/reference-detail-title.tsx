"use client";

import styled from "styled-components";
import type { ReactNode } from "react";

const Header = styled.header`
  display: flex;
  min-width: 0;
  flex: 0 0 auto;
  flex-direction: row;
  align-items: baseline;
  flex-wrap: wrap;
  gap: var(--space-xs);

  h1,
  p {
    margin: 0;
  }

  p {
    color: var(--color-label-studio-comment);
  }
`;

export function ReferenceDetailTitle({
  title,
  description,
}: {
  title: ReactNode;
  description: string;
}) {
  return (
    <Header>
      <h1 className="type-small-body">{title}</h1>
      <p className="type-xsmall-thin pb-0.5">{description}</p>
    </Header>
  );
}
