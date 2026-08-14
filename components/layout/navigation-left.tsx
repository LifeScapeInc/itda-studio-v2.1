"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Moon, Settings, Sun, User } from "lucide-react";
import styled from "styled-components";
import { useWorkspaceLayoutStore } from "@/stores/useWorkspaceLayoutStore";
import { useCreateStore } from "@/stores/useCreateStore";
import { useThemeStore } from "@/stores/useThemeStore";
import { useProjectStore } from "@/stores/useProjectStore";
import {
  isNavigationItemActive,
  NAVIGATION_GROUPS,
} from "./navigation-config";

const Aside = styled.aside<{ $collapsed: boolean }>`
  position: fixed;
  z-index: 10;
  top: 56px;
  bottom: 0;
  left: 0;
  width: 203px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-border);
  background: var(--color-surface);
  pointer-events: ${({ $collapsed }) => ($collapsed ? "none" : "auto")};
  transform: translateX(${({ $collapsed }) => ($collapsed ? "-100%" : "0")});
  transition: transform 220ms ease;
`;

const Groups = styled.nav`
  display: flex;
  width: 155px;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: var(--space-xl);
  margin: var(--space-lg) var(--space-lg) 0;
  color: var(--color-label-studio-comment);
  overflow-y: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Group = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
`;

const Items = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3xs);
`;

const Indicator = styled.span`
  position: absolute;
  top: 50%;
  left: 0;
  width: 3px;
  height: 20px;
  border-radius: 0 999px 999px 0;
  background: var(--color-main-primary);
  transform: translateY(-50%);
`;

const Item = styled(Link)<{ $active: boolean }>`
  position: relative;
  display: flex;
  width: 100%;
  height: 40px;
  align-items: center;
  gap: 10px;
  padding: 0 var(--space-xs);
  border-radius: 8px;
  background: ${({ $active }) => (
    $active ? "var(--color-main-neutral)" : "transparent"
  )};
  color: ${({ $active }) => (
    $active ? "var(--color-label-studio-black)" : "inherit"
  )};
  font-weight: ${({ $active }) => ($active ? 500 : 400)};
  transition:
    color 150ms ease,
    background-color 150ms ease,
    transform 150ms ease;

  &:hover,
  &:focus-visible {
    outline: none;
    background: var(--color-main-neutral);
    color: var(--color-label-studio-black);
    transform: ${({ $active }) => ($active ? "none" : "translateX(2px)")};
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px var(--color-main-tertiary);
  }

  svg {
    width: 18px;
    height: 18px;
    flex: 0 0 18px;
    transition: transform 150ms ease;
  }

  &:hover svg,
  &:focus-visible svg {
    transform: scale(1.1);
  }
`;

const ItemLabel = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Bottom = styled.div`
  display: flex;
  width: 155px;
  flex: 0 0 auto;
  flex-direction: column;
  gap: var(--space-3xs);
  margin: var(--space-xs) var(--space-lg) var(--space-lg);
  padding-top: var(--space-xs);
  border-top: 1px solid var(--color-border);
  color: var(--color-label-studio-comment);
`;

const BottomLink = styled(Item)``;

const ThemeButton = styled.button`
  position: relative;
  display: flex;
  width: 100%;
  height: 40px;
  align-items: center;
  gap: 10px;
  padding: 0 var(--space-xs);
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition:
    color 150ms ease,
    background-color 150ms ease,
    transform 150ms ease;

  &:hover,
  &:focus-visible {
    background: var(--color-main-neutral);
    color: var(--color-label-studio-black);
    outline: none;
    transform: translateX(2px);
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px var(--color-main-tertiary);
  }

  svg {
    width: 18px;
    height: 18px;
    flex: 0 0 18px;
    transition: transform 150ms ease;
  }

  &:hover svg,
  &:focus-visible svg {
    transform: scale(1.1);
  }
`;

export function NavigationLeft() {
  const pathname = usePathname();
  const navigationCollapsed = useWorkspaceLayoutStore(
    (state) => state.navigationCollapsed,
  );
  const theme = useThemeStore((state) => state.theme);
  const hydrateTheme = useThemeStore((state) => state.hydrate);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const openUnscopedWorkspace = useProjectStore(
    (state) => state.openUnscopedWorkspace,
  );
  const setProjectContext = useCreateStore(
    (state) => state.setProjectContext,
  );

  useEffect(() => {
    hydrateTheme();
  }, [hydrateTheme]);

  return (
    <Aside $collapsed={navigationCollapsed} aria-hidden={navigationCollapsed}>
      <Groups aria-label="주요 메뉴">
        {NAVIGATION_GROUPS.map((group) => (
          <Group key={group.label}>
            <h2 className="type-small-head">
              {group.label}
            </h2>
            <Items>
              {group.items.map((item) => {
                const active = isNavigationItemActive(pathname, item.href);
                const Icon = item.icon;

                return (
                  <Item
                    className="type-medium-thin"
                    href={item.href}
                    $active={active}
                    aria-current={active ? "page" : undefined}
                    onClick={item.href === "/create" ? () => {
                      setProjectContext(null);
                      openUnscopedWorkspace();
                    } : undefined}
                    key={item.label}
                  >
                    {active ? <Indicator aria-hidden="true" /> : null}
                    <Icon strokeWidth={1.75} aria-hidden="true" />
                    <ItemLabel>
                      {item.label}
                    </ItemLabel>
                  </Item>
                );
              })}
            </Items>
          </Group>
        ))}
      </Groups>
      <Bottom aria-label="환경 및 계정 메뉴">
        <ThemeButton
          className="type-medium-thin"
          type="button"
          onClick={toggleTheme}
        >
          {theme === "dark" ? (
            <Sun strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Moon strokeWidth={1.75} aria-hidden="true" />
          )}
          <ItemLabel>
            {theme === "dark" ? "라이트모드" : "다크모드"}
          </ItemLabel>
        </ThemeButton>
        <BottomLink
          className="type-medium-thin"
          href="/settings"
          $active={isNavigationItemActive(pathname, "/settings")}
          aria-current={
            isNavigationItemActive(pathname, "/settings") ? "page" : undefined
          }
        >
          {isNavigationItemActive(pathname, "/settings") ? (
            <Indicator aria-hidden="true" />
          ) : null}
          <Settings strokeWidth={1.75} aria-hidden="true" />
          <ItemLabel>설정</ItemLabel>
        </BottomLink>
        <BottomLink
          className="type-medium-thin"
          href="/account"
          $active={isNavigationItemActive(pathname, "/account")}
          aria-current={
            isNavigationItemActive(pathname, "/account") ? "page" : undefined
          }
        >
          {isNavigationItemActive(pathname, "/account") ? (
            <Indicator aria-hidden="true" />
          ) : null}
          <User strokeWidth={1.75} aria-hidden="true" />
          <ItemLabel>계정</ItemLabel>
        </BottomLink>
      </Bottom>
    </Aside>
  );
}
