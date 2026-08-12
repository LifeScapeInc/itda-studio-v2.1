"use client";

import Image from "next/image";
import styled from "styled-components";
const Button = styled.button`position:absolute;right:var(--space-2xl);bottom:var(--space-2xl);z-index:2;width:72px;height:72px;padding:0;border:0;border-radius:50%;background:transparent;box-shadow:4px 4px 5px rgb(0 0 0 / 25%);cursor:pointer;transition:transform 140ms ease;&:hover,&:focus-visible{outline:none;transform:translateY(-1px)}&:focus-visible{box-shadow:0 0 0 3px var(--color-main-tertiary),4px 4px 5px rgb(0 0 0 / 25%)}img{position:absolute;inset:0}`;
export function ButtonAdd({
  onClick
}: {
  onClick: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      aria-label="새 프로젝트 추가"
    >
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
          left: 14
        }}
      />
    </Button>
  );
}
