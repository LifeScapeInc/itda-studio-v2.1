"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { LoaderCircle } from "lucide-react";
import styled, { keyframes } from "styled-components";

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
`;

const Root = styled.span`
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  border-radius: inherit;
  overflow: hidden;
`;

const Placeholder = styled.span<{ $visible: boolean }>`
  position: absolute;
  z-index: 0;
  inset: 0;
  display: grid;
  place-items: center;
  border-radius: inherit;
  background: var(--color-main-neutral);
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  pointer-events: none;
  transition: opacity 180ms ease;
`;

const Spinner = styled(LoaderCircle)<{ $visible: boolean }>`
  display: ${({ $visible }) => ($visible ? "block" : "none")};
  color: var(--color-label-studio-comment);
  animation: ${rotate} 850ms linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const ContentImage = styled(Image)<{ $visible: boolean }>`
  z-index: 1;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 180ms ease;
`;

type LoadingImageProps = ImageProps;

function getSourceKey(src: ImageProps["src"]): string {
  if (typeof src === "string") {
    return src;
  }

  if ("src" in src) {
    return src.src;
  }

  return src.default.src;
}

export function LoadingImage({
  src,
  alt,
  onLoad,
  onError,
  ...props
}: LoadingImageProps) {
  const sourceKey = getSourceKey(src);
  const [result, setResult] = useState<{
    sourceKey: string;
    status: "loaded" | "error";
  } | null>(null);
  const status = result?.sourceKey === sourceKey
    ? result.status
    : "loading";

  return (
    <Root>
      <Placeholder
        $visible={status !== "loaded"}
        aria-hidden="true"
      >
        <Spinner
          $visible={status === "loading"}
          size={24}
          strokeWidth={1.8}
        />
      </Placeholder>
      <ContentImage
        {...props}
        src={src}
        alt={alt}
        $visible={status === "loaded"}
        onLoad={(event) => {
          setResult({ sourceKey, status: "loaded" });
          onLoad?.(event);
        }}
        onError={(event) => {
          setResult({ sourceKey, status: "error" });
          onError?.(event);
        }}
      />
    </Root>
  );
}
