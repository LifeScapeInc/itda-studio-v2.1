"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styled, { css } from "styled-components";

const sharedStyle = css`
  position: fixed;
  z-index: 12;
  top: 78px;
  left: calc(
    var(--navigation-left-width, 203px)
    + var(--space-2xl)
  );
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-label-studio-comment);
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  transition:
    left 220ms ease,
    color 160ms ease,
    transform 160ms ease;

  &:hover,
  &:focus-visible {
    color: var(--color-label-studio-black);
    transform: translateX(-2px);
  }

  &:focus-visible {
    border-radius: 4px;
    outline: 2px solid var(--color-main-primary);
    outline-offset: 4px;
  }
`;

const BackLink = styled(Link)`
  ${sharedStyle}
`;

const BackButton = styled.button`
  ${sharedStyle}
`;

type ButtonBackProps = {
  label: string;
  ariaLabel?: string;
} & (
  | {
      href: string;
      onClick?: never;
    }
  | {
      href?: never;
      onClick: () => void;
    }
);

function BackContent({ label }: { label: string }) {
  return (
    <>
      <ArrowLeft
        size={16}
        strokeWidth={1.8}
        aria-hidden="true"
      />
      <span>{label}</span>
    </>
  );
}

export function ButtonBack({
  label,
  ariaLabel = `${label}으로 돌아가기`,
  ...navigation
}: ButtonBackProps) {
  if (navigation.href) {
    return (
      <BackLink
        href={navigation.href}
        aria-label={ariaLabel}
      >
        <BackContent label={label} />
      </BackLink>
    );
  }

  return (
    <BackButton
      type="button"
      aria-label={ariaLabel}
      onClick={navigation.onClick}
    >
      <BackContent label={label} />
    </BackButton>
  );
}
