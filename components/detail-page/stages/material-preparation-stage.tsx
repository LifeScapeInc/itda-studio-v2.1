"use client";

import { LoaderCircle, Sparkles } from "lucide-react";
import styled from "styled-components";
import { ImageUploadCard } from "@/components/create/preparation/image-upload-card";
import {
  MaterialPreparationLayout,
  MaterialPreparationSection,
} from "@/components/create/preparation/material-preparation-layout";
import { PrimaryIconButton } from "@/components/ui/primary-icon-button";
import { useAppSettingsStore } from "@/stores/useAppSettingsStore";
import { useDetailPageStore } from "@/stores/useDetailPageStore";
import { DetailRequestUpload } from "../detail-material-upload";

const ActionArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
  margin-top: auto;
`;

const Helper = styled.p`
  color: var(--color-label-studio-comment);
  line-height: 1.45;
  text-align: center;
`;

const ErrorMessage = styled.p`
  color: #c83d32;
  line-height: 1.45;
`;

export function DetailMaterialPreparationPanel() {
  const state = useDetailPageStore();
  const mockMode = useAppSettingsStore(settings => settings.mockMode);
  const ready = Boolean(state.furnitureImage && state.requestDocument);
  const disabled = state.isPlanning || (!mockMode && !ready);

  return (
    <MaterialPreparationLayout title="재료 준비">
      <MaterialPreparationSection index={1} title="내 제품">
        <ImageUploadCard
          image={state.furnitureImage}
          emptyLabel="가구 이미지 업로드"
          onChange={state.setFurnitureImage}
        />
      </MaterialPreparationSection>
      <MaterialPreparationSection index={2} title="의뢰 요청서">
        <DetailRequestUpload
          document={state.requestDocument}
          onChange={state.setRequestDocument}
        />
      </MaterialPreparationSection>
      {!mockMode ? (
        <Helper className="type-xsmall-thin">
          제품 이미지와 의뢰 요청서를 모두 등록해 주세요.
        </Helper>
      ) : null}
      <ActionArea>
        {state.planningError ? (
          <ErrorMessage className="type-xsmall-thin" role="alert">
            {state.planningError}
          </ErrorMessage>
        ) : null}
        <PrimaryIconButton
          type="button"
          icon={state.isPlanning ? LoaderCircle : Sparkles}
          iconSize={16}
          iconClassName={state.isPlanning ? "animate-spin" : undefined}
          fullWidth
          disabled={disabled}
          onClick={() => void state.generatePlanning(mockMode)}
        >
          {state.isPlanning ? "생성중" : "기획 생성"}
        </PrimaryIconButton>
      </ActionArea>
    </MaterialPreparationLayout>
  );
}
