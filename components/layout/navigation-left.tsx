"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, Moon, Settings, Sun, User } from "lucide-react";
import styled from "styled-components";
import { useWorkspaceLayoutStore } from "@/stores/useWorkspaceLayoutStore";
import { useCreateStore } from "@/stores/useCreateStore";
import { useDetailPageStore } from "@/stores/useDetailPageStore";
import { useThemeStore } from "@/stores/useThemeStore";
import { useProjectStore } from "@/stores/useProjectStore";
import { isNavigationItemActive, NAVIGATION_GROUPS } from "./navigation-config";

const Aside = styled.aside<{ $collapsed: boolean; }>`
  position: fixed; z-index: 10; top: 36px; bottom: 0; left: 0;
  width: ${({ $collapsed }) => $collapsed ? "54px" : "202px"};
  display: flex; flex-direction: column; padding: 0 ${({ $collapsed }) => $collapsed ? "5px" : "12px"} 8px;
  background: var(--color-background-workspace); transition: width 180ms ease;
  .menu-label { display: ${({ $collapsed }) => $collapsed ? "none" : "inline"}; white-space: nowrap; }
  svg { width: 18px; height: 18px; flex: 0 0 18px; stroke-width: 1.6; }
`;
const Groups = styled.nav`min-height: 0; flex: 1; overflow-y: auto; overflow-x: hidden;`;
const Group = styled.section`padding: 8px 0; & + & { border-top: 1px solid var(--color-border); }`;
const Item = styled(Link) <{ $active: boolean; }>`
  display: flex; min-width: 0; height: 40px; align-items: center; gap: 12px; padding: 0 13px; margin: 4px 0;
  border-radius: 4px; background: ${({ $active }) => $active ? "var(--color-main-neutral)" : "transparent"};
  color: ${({ $active }) => $active ? "var(--color-label-studio-black)" : "var(--color-label-studio-comment)"};
  font-size: 13px; font-weight: 400;
  &:hover { background: var(--color-main-neutral-light); color: var(--color-label-studio-black); }
`;
const Button = styled.button`display: flex; width: 100%; height: 36px; align-items: center; gap: 12px; padding: 0 13px; border: 0; border-radius: 4px; background: transparent; color: var(--color-label-studio-comment); font-size: 12px; cursor: pointer; &:hover { background: var(--color-main-neutral-light); color: var(--color-label-studio-black); }`;
const Bottom = styled.nav`padding-top: 8px;`;

export function NavigationLeft() {
  const pathname = usePathname();
  const collapsed = useWorkspaceLayoutStore(s => s.navigationCollapsed);
  const toggleNavigation = useWorkspaceLayoutStore(s => s.toggleNavigation);
  const theme = useThemeStore(s => s.theme);
  const hydrateTheme = useThemeStore(s => s.hydrate);
  const toggleTheme = useThemeStore(s => s.toggleTheme);
  useEffect(() => { hydrateTheme(); }, [hydrateTheme]);
  const openWorkspace = (href: string) => {
    if (href === "/create") useCreateStore.getState().setProjectContext(null);
    else if (href === "/detail-page") useDetailPageStore.getState().setProjectContext(null);
    else return;
    useProjectStore.getState().openUnscopedWorkspace();
  };
  return <Aside $collapsed={collapsed} aria-label="활동 표시줄">
    <Button type="button" title={collapsed ? "메뉴 펼치기" : "메뉴 접기"} aria-label={collapsed ? "메뉴 펼치기" : "메뉴 접기"} aria-expanded={!collapsed} onClick={toggleNavigation}>{collapsed ? <ChevronsRight /> : <ChevronsLeft />}<span className="menu-label">메뉴 접기</span></Button>
    <Groups aria-label="주요 메뉴">{NAVIGATION_GROUPS.map(group => <Group key={group.label} aria-label={group.label}>{group.items.map(item => <Item key={item.href} href={item.href} title={item.label} aria-label={item.label} $active={isNavigationItemActive(pathname, item.href)} aria-current={isNavigationItemActive(pathname, item.href) ? "page" : undefined} onClick={() => openWorkspace(item.href)}><item.icon aria-hidden="true" /><span className="menu-label">{item.label}</span></Item>)}</Group>)}</Groups>
    <Bottom aria-label="환경 및 계정 메뉴">
      <Button type="button" title={theme === "dark" ? "라이트모드" : "다크모드"} aria-label={theme === "dark" ? "라이트모드" : "다크모드"} onClick={toggleTheme}>{theme === "dark" ? <Sun /> : <Moon />}<span className="menu-label">{theme === "dark" ? "라이트모드" : "다크모드"}</span></Button>
      <Item href="/settings" title="설정" aria-label="설정" $active={isNavigationItemActive(pathname, "/settings")}><Settings /><span className="menu-label">설정</span></Item>
      <Item href="/account" title="계정" aria-label="계정" $active={isNavigationItemActive(pathname, "/account")}><User /><span className="menu-label">계정</span></Item>
    </Bottom>
  </Aside>;
}
