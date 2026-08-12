"use client";

import Image from "next/image";
import styled from "styled-components";
import { ButtonBack } from "@/components/ui/button-back";
import type { Moodboard } from "@/system/moodboard/moodboards";
const Area = styled.div`min-height:0;flex:1;margin-top:var(--space-xl);background:white;overflow:hidden`;
const Figure = styled.figure`display:flex;width:100%;height:100%;align-items:center;justify-content:center;margin:0;background:white;overflow:hidden`;
const Render = styled(Image)`width:100%;height:100%;object-fit:contain;background:white`;
export function MoodboardDetail({
  moodboard: m
}: {
  moodboard: Moodboard;
}) {
  return (
    <>
      <ButtonBack
        href="/moodboard"
        label="무드보드 목록"
      />
      <Area>
        <Figure>
          <Render
            src={m.renderImage}
            alt={`${m.name} 스타일 무드보드`}
            width={m.renderWidth}
            height={m.renderHeight}
            priority
            sizes="calc(100vw - 275px)"
          />
        </Figure>
      </Area>
    </>
  );
}
