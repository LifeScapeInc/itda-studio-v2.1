"use client";

import Image from "next/image";
import styled from "styled-components";

const Card = styled.button`
  display: flex;
  width: 314px;
  height: 198px;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-md);
  padding: var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 140ms ease,
    transform 140ms ease;

  &:hover,
  &:focus-visible {
    border-color: var(--color-main-primary);
    outline: none;
    transform: translateY(-1px);
  }
`;

const Illustration = styled.span`
  display: block;
  width: 96px;
  height: 96px;
  flex: 0 0 96px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const Copy = styled.span`
  display: flex;
  width: 100%;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-2xs);

  span {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span:last-child {
    color: var(--color-label-studio-comment);
  }
`;
export function ItemCustomer({
  email,
  manager,
  caseCount,
  onClick
}: {
  email: string;
  manager: string;
  caseCount: number;
  onClick?: () => void;
}) {
  return (
    <Card
      type="button"
      onClick={onClick}
    >
      <Illustration>
        <Image
          src="/assets/customer-illustration.svg"
          width={96}
          height={96}
          alt=""
          priority
        />
      </Illustration>
      <Copy>
        <span className="type-xsmall-body">
          {email}
        </span>
        <span className="type-xsmall-thin">
          담당자: {manager}
          &nbsp; • &nbsp; {caseCount}건
        </span>
      </Copy>
    </Card>
  );
}
