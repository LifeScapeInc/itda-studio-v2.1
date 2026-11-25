"use client";

import Image from "next/image";
import styled from "styled-components";
import { floatingButtonEffect } from "@/system/styles/button-effects";

const Button = styled.button`
  position: absolute;
  z-index: 2;
  right: var(--space-2xl);
  bottom: var(--space-2xl);
  width: 72px;
  height: 72px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;

  ${floatingButtonEffect}

  &:hover {
    outline: none;
  }



  img {
    position: absolute;
    inset: 0;
  }
`;

export function ButtonAdd({
  onClick,
  disabled=false,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button disabled={disabled} onClick={onClick} aria-label="새 프로젝트 추가">
      <Image
        src="/assets/button-add-circle.svg"
        alt=""
        width={72}
        height={72}
      />
      <Image
        src="/assets/button-add-plus.svg"
        alt=""
        width={42}
        height={42}
        style={{
          top: 14,
          left: 14,
        }}
      />
    </Button>
  );
}
