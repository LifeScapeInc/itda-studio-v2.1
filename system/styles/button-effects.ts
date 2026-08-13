import { css } from "styled-components";

export const floatingButtonEffect = css`
  box-shadow: 4px 4px 16px rgb(32 29 23 / 16%);
  transition:
    transform 150ms ease,
    box-shadow 150ms ease,
    background 150ms ease;

  &:hover {
    box-shadow: 4px 4px 16px rgb(32 29 23 / 22%);
    transform: translateY(-2px);
  }
`;
