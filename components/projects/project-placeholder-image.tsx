"use client";

import { ImageIcon } from "lucide-react";
import styled from "styled-components";
const pairs = [["#c9b699", "#8a7458"], ["#d9cdb8", "#a9906b"], ["#bfae95", "#6f5b45"], ["#e3d9c6", "#b79d78"]];
const hash = (s: string) => Math.abs([...s].reduce((h, c) => (h << 5) - h + c.charCodeAt(0) | 0, 0));
const Root = styled.span`position:relative;display:block;width:100%;height:100%;overflow:hidden`;
const Shine = styled.span`position:absolute;inset:0;background:radial-gradient(120% 90% at 20% 15%,rgb(255 255 255 / 22%),transparent 60%)`;
export function ProjectPlaceholderImage({
  seed
}: {
  seed: string;
}) {
  const [from, to] = pairs[hash(seed) % pairs.length];
  return (
    <Root style={{
      background: `linear-gradient(${hash(seed + "a") % 360}deg,${from},${to})`
    }}
    >
      <Shine />
      <ImageIcon
        style={{
          position: "absolute",
          right: 12,
          bottom: 12,
          color: "rgb(255 255 255 / 60%)"
        }}
        size={16}
      />
    </Root>
  );
}
