import {
  Armchair,
  Bookmark,
  FileDown,
  FileText,
  FolderKanban,
  LayoutGrid,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const NAVIGATION_GROUPS: Array<{
  label: string;
  items: NavigationItem[];
}> = [
  {
    label: "파일",
    items: [
      {
        label: "가져오기",
        href: "/",
        icon: FileDown,
      },
      {
        label: "프로젝트",
        href: "/projects",
        icon: FolderKanban,
      },
    ],
  },
  {
    label: "라이브러리",
    items: [
      {
        label: "무드보드",
        href: "/moodboard",
        icon: LayoutGrid,
      },
      {
        label: "가구",
        href: "/furniture",
        icon: Armchair,
      },
      {
        label: "북마크",
        href: "#",
        icon: Bookmark,
      },
    ],
  },
  {
    label: "작업",
    items: [
      {
        label: "컷 생성",
        href: "/create",
        icon: Sparkles,
      },
      {
        label: "상세 페이지",
        href: "#",
        icon: FileText,
      },
    ],
  },
];

export function isNavigationItemActive(
  pathname: string,
  href: string,
): boolean {
  return href !== "#"
    && (
      pathname === href
      || (href !== "/" && pathname.startsWith(`${href}/`))
    );
}
