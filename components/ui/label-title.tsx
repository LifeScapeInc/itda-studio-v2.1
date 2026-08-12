"use client";

import styled from "styled-components";
const Header = styled.header`display: flex; width: 100%; flex: 0 0 auto; flex-direction: column; gap: var(--space-sm); p { color: var(--color-label-studio-comment); }`;
export function LabelTitle({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <Header>
      <h1 className="type-medium-head">
        {title}
      </h1>
      <p className="type-xsmall-thin">
        {description}
      </p>
    </Header>
  );
}
