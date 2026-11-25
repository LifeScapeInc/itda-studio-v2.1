"use client";

import { FolderPlus } from "lucide-react";
import { PrimaryIconButton } from "@/components/ui/primary-icon-button";

export function ButtonCreateProject({
  disabled = false,
  onClick
}: {
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <PrimaryIconButton
      className="type-xsmall-body"
      type="button"
      icon={FolderPlus}
      iconSize={17}
      height={32}
      disabled={disabled}
      onClick={onClick}
    >
      프로젝트 생성
    </PrimaryIconButton>
  );
}
