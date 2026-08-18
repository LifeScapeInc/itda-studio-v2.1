"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import styled from "styled-components";

const Screen = styled.main`
  display: grid;
  width: 100%;
  min-height: 100dvh;
  place-items: center;
  padding: var(--space-xl);
  background: var(--color-main-neutral);
`;

const LoginBox = styled.section`
  display: flex;
  width: min(400px, 100%);
  flex-direction: column;
  gap: var(--space-xl);
  padding: var(--space-2xl);
  background: var(--color-surface);
`;

const Header = styled.header`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  text-align: center;
`;

const Logo = styled(Image)`
  height: auto;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
`;

const PasswordInput = styled.input`
  width: 100%;
  height: 48px;
  padding: 0 var(--space-sm);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  outline: 0;
  background: var(--color-main-neutral-light);
  color: var(--color-label-studio-black);

  &:focus {
    border-color: var(--color-main-primary);
    box-shadow: 0 0 0 3px color-mix(
      in srgb,
      var(--color-main-primary) 14%,
      transparent
    );
  }
`;

const SubmitButton = styled.button`
  height: 48px;
  padding: 0 var(--space-md);
  border: 0;
  border-radius: 4px;
  background: var(--color-main-primary);
  color: var(--color-surface);
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--color-main-secondary);
  }

  &:disabled {
    opacity: 0.55;
    cursor: wait;
  }
`;

const ErrorMessage = styled.p`
  min-height: 16px;
  color: #b34b3d;
  text-align: center;
`;

export function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json().catch(() => null) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setError(result?.error ?? "로그인하지 못했습니다.");
        return;
      }

      window.location.assign("/");
    } catch {
      setError("서버에 연결할 수 없습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <LoginBox aria-labelledby="login-title">
        <Header>
          <Logo
            src="/assets/icon_studio.svg"
            alt="ITDA Studio"
            width={144}
            height={144}
            priority
          />
        </Header>

        <Form onSubmit={handleSubmit}>
          <Field>
            <span className="type-small-head">비밀번호</span>
            <PasswordInput
              type="password"
              value={password}
              autoComplete="current-password"
              autoFocus
              required
              aria-invalid={Boolean(error)}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>
          <SubmitButton
            type="submit"
            className="type-xsmall-body"
            disabled={submitting || !password}
          >
            {submitting ? "인증 중" : "로그인"}
          </SubmitButton>
          <ErrorMessage
            className="type-xsmall-thin"
            role="alert"
            aria-live="polite"
          >
            {error}
          </ErrorMessage>
        </Form>
      </LoginBox>
    </Screen>
  );
}
