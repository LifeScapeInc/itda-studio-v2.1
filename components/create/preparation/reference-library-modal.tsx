"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Images, Search } from "lucide-react";
import styled from "styled-components";
import type {
  ReferenceLibraryData,
  ReferenceLibraryTab,
} from "@/system/create/reference-library";
import { HiddenScrollbar } from "@/system/styles/layout";
import { ReferenceLibraryCategoryItem } from "./reference-library-category-item";
import { ReferenceLibraryImageItem } from "./reference-library-image-item";

const TABS: Array<{
  id: ReferenceLibraryTab;
  label: string;
}> = [
  { id: "furniture", label: "가구 스튜디오 샷" },
  { id: "mood", label: "인테리어 무드보드" },
  { id: "bookmarks", label: "북마크 이미지" },
];

const Backdrop = styled.div`
  position: fixed;
  z-index: 100;
  inset: 0;
  display: grid;
  place-items: center;
  padding: var(--space-xl);
  background: rgb(32 29 23 / 32%);
`;

const Modal = styled.section`
  display: flex;
  width: min(960px, 100%);
  height: min(760px, calc(100vh - 64px));
  min-height: 520px;
  flex-direction: column;
  background: var(--color-surface);
  box-shadow: 0 20px 52px rgb(32 29 23 / 22%);
  overflow: hidden;
`;

const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md) 0;
  background: var(--color-main-neutral-light);
`;

const Close = styled.button`
  display: grid;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  margin: -6px -6px 0 0;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    background: rgb(32 29 23 / 5%);
    outline: none;
  }
`;

const Tabs = styled.div`
  display: flex;
  gap: var(--space-3xs);
`;

const Toolbar = styled.div`
  display: flex;
  min-height: 62px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-lg);
  padding: var(--space-xs) var(--space-lg);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-main-neutral-light);
`;

const SearchField = styled.label`
  position: relative;
  display: flex;
  width: min(280px, 34%);
  min-width: 220px;
  height: 38px;
  flex: 0 0 auto;
  align-items: center;

  svg {
    position: absolute;
    left: var(--space-xs);
    color: var(--color-label-studio-comment);
    pointer-events: none;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  height: 100%;
  padding: 0 var(--space-xs) 0 36px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-label-studio-black);
  font-size: 12px;
  outline: none;

  &::placeholder {
    color: var(--color-label-studio-comment);
  }

  &:focus {
    border-color: var(--color-main-primary);
    box-shadow: 0 0 0 3px color-mix(
      in srgb,
      var(--color-main-primary) 10%,
      transparent
    );
  }
`;

const Tab = styled.button<{ $active: boolean }>`
  height: 38px;
  padding: 0 var(--space-md);
  border: 1px solid ${({ $active }) => (
    $active ? "var(--color-main-primary)" : "transparent"
  )};
  border-radius: 8px;
  background: ${({ $active }) => (
    $active ? "var(--color-main-primary)" : "transparent"
  )};
  color: ${({ $active }) => (
    $active ? "var(--color-surface)" : "var(--color-label-studio-comment)"
  )};
  cursor: pointer;

  &:hover,
  &:focus-visible {
    outline: none;
    color: ${({ $active }) => (
      $active ? "var(--color-surface)" : "var(--color-label-studio-black)"
    )};
  }
`;

const Content = styled.div`
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  background: var(--color-main-neutral-light);
`;

const DepthHeader = styled.div`
  display: flex;
  min-height: 52px;
  flex: 0 0 52px;
  align-items: center;
  gap: var(--space-xs);
  padding: 0 var(--space-lg);
  border-bottom: 1px solid var(--color-border);
`;

const Back = styled.button`
  display: inline-flex;
  height: 32px;
  align-items: center;
  gap: var(--space-3xs);
  padding: 0 var(--space-2xs);
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--color-label-studio-comment);
  cursor: pointer;

  &:hover,
  &:focus-visible {
    background: var(--color-surface);
    outline: none;
    color: var(--color-label-studio-black);
  }
`;

const Count = styled.span`
  color: var(--color-label-studio-comment);
  font-size: 12px;
`;

const Scroll = styled(HiddenScrollbar)`
  min-height: 0;
  flex: 1;
  padding: var(--space-lg);
  overflow-x: hidden;
  overflow-y: auto;
`;

const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-content: start;
  gap: var(--space-sm);

  @media (max-width: 800px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-content: start;
  gap: var(--space-sm);

  @media (max-width: 800px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const Empty = styled.div`
  display: flex;
  height: 100%;
  min-height: 240px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  color: var(--color-label-studio-comment);
  text-align: center;

  p {
    line-height: 1.5;
  }
`;

export function ReferenceLibraryModal({
  library,
  onClose,
  onSelect,
}: {
  library: ReferenceLibraryData;
  onClose: () => void;
  onSelect: (image: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<ReferenceLibraryTab>("furniture");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const groups = library[activeTab];
  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("ko");

    if (!query) {
      return groups;
    }

    return groups.filter((group) => (
      group.name.toLocaleLowerCase("ko").includes(query)
    ));
  }, [groups, searchQuery]);
  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? null,
    [groups, selectedGroupId],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (selectedGroupId) {
          setSelectedGroupId(null);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, selectedGroupId]);

  const changeTab = (tab: ReferenceLibraryTab) => {
    setActiveTab(tab);
    setSelectedGroupId(null);
    setSearchQuery("");
  };

  return (
    <Backdrop
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <Modal
        role="dialog"
        aria-modal="true"
        aria-labelledby="reference-library-title"
      >
        <Header>
            <h2
              className="type-small-head"
              id="reference-library-title"
            >
              레퍼런스 DB
            </h2>
          <Close
            type="button"
            aria-label="레퍼런스 DB 닫기"
            onClick={onClose}
          >
            <Image
              src="/assets/project-overlay-close.svg"
              alt=""
              width={12}
              height={12}
            />
          </Close>
        </Header>
        {!selectedGroup ? (
          <Toolbar>
            <Tabs role="tablist" aria-label="레퍼런스 종류">
              {TABS.map((tab) => (
                <Tab
                  type="button"
                  role="tab"
                  $active={activeTab === tab.id}
                  aria-selected={activeTab === tab.id}
                  onClick={() => changeTab(tab.id)}
                  key={tab.id}
                >
                  <span className="type-xsmall-body">{tab.label}</span>
                </Tab>
              ))}
            </Tabs>
            {activeTab !== "bookmarks" ? (
              <SearchField>
                <Search
                  size={15}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                <SearchInput
                  type="search"
                  aria-label="레퍼런스 카테고리 검색"
                  placeholder={
                    activeTab === "furniture"
                      ? "가구 카테고리 검색"
                      : "무드보드 스타일 검색"
                  }
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </SearchField>
            ) : null}
          </Toolbar>
        ) : null}
        <Content>
          {selectedGroup ? (
            <>
              <DepthHeader>
                <Back
                  type="button"
                  onClick={() => setSelectedGroupId(null)}
                >
                  <ArrowLeft size={15} />
                  목록
                </Back>
                <strong className="type-xsmall-body">{selectedGroup.name}</strong>
                <Count>{selectedGroup.images.length}장</Count>
              </DepthHeader>
              <Scroll>
                {selectedGroup.images.length ? (
                  <ImageGrid aria-label={`${selectedGroup.name} 이미지 목록`}>
                    {selectedGroup.images.map((image, index) => (
                      <ReferenceLibraryImageItem
                        src={image}
                        index={index}
                        onSelect={() => {
                          onSelect(image);
                          onClose();
                        }}
                        key={image}
                      />
                    ))}
                  </ImageGrid>
                ) : (
                  <Empty>
                    <Images size={40} strokeWidth={1.3} />
                    <strong>등록된 이미지가 없습니다.</strong>
                  </Empty>
                )}
              </Scroll>
            </>
          ) : (
            <Scroll>
              {filteredGroups.length ? (
                <CategoryGrid aria-label={`${TABS.find((tab) => tab.id === activeTab)?.label} 목록`}>
                  {filteredGroups.map((group) => (
                    <ReferenceLibraryCategoryItem
                      group={group}
                      onClick={() => setSelectedGroupId(group.id)}
                      key={group.id}
                    />
                  ))}
                </CategoryGrid>
              ) : (
                <Empty>
                  <Images size={40} strokeWidth={1.3} />
                  <strong>
                    {searchQuery
                      ? "검색 결과가 없습니다."
                      : activeTab === "bookmarks"
                        ? "등록된 북마크 이미지가 없습니다."
                        : "등록된 카테고리가 없습니다."}
                  </strong>
                  {!searchQuery && activeTab === "bookmarks" ? (
                    <p className="type-xsmall-thin">
                      북마크한 이미지가 생기면 이 탭에서 확인할 수 있습니다.
                    </p>
                  ) : null}
                </Empty>
              )}
            </Scroll>
          )}
        </Content>
      </Modal>
    </Backdrop>
  );
}
