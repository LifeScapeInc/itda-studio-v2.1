"use client";

import styled from "styled-components";
const Label = styled.span<{
  $variant: "draft" | "final";
}>`
  position: absolute; right: var(--space-md); bottom: var(--space-md); display: grid; width: 42px; height: 26px; place-items: center;
  color: ${({
  $variant
}) => $variant === "final" ? "var(--color-label-final-accent)" : "var(--color-label-draft-accent)"};
  font-size: 16px; font-weight: 400; line-height: 1; text-align: center;
`;
const Surface = styled.span<{
  $variant: "draft" | "final";
}>`grid-area: 1 / 1; width: 100%; height: 100%; border: 1px solid currentColor; border-radius: 5px; background: ${({
  $variant
}) => $variant === "final" ? "var(--color-label-final)" : "var(--color-label-draft)"};`;
const Text = styled.span`position: relative; z-index: 1; grid-area: 1 / 1;`;
export function LabelDraft({
  variant
}: {
  variant: "draft" | "final";
}) {
  return (
    <Label $variant={variant}>
      <Surface
        $variant={variant}
        aria-hidden="true"
      />
      <Text>
        {variant === "final" ? "최종" : "초안"}
      </Text>
    </Label>
  );
}
