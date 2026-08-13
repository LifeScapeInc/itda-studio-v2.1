"use client";

import styled from "styled-components";

const Header = styled.header`
  display: flex;
  min-width: 0;
  flex: 0 0 auto;
  flex-direction: row;
  align-items: end;
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
  title: string;
  description: string;
}) {
  return (
    <Header>
      <h1 className="type-medium-head">{title}</h1>
      <p className="type-xsmall-thin pb-0.5">{description}</p>
    </Header>
  );
}
