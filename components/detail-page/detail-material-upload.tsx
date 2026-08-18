"use client";

import { FileText } from "lucide-react";
import { UploadCard } from "@/components/create/preparation/upload-card";
import type { RequestDocument } from "@/system/detail-page/detail-page-types";

const REQUEST_ACCEPT = [
  ".pdf",
  ".doc",
  ".docx",
  ".xlsx",
  ".txt",
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
].join(",");

export function DetailRequestUpload({
  document,
  onChange,
}: {
  document: RequestDocument | null;
  onChange: (document: RequestDocument | null) => void;
}) {
  return (
    <UploadCard
      hasValue={Boolean(document)}
      icon={<FileText size={34} strokeWidth={1.5} />}
      label={document?.name ?? "의뢰 요청서 업로드"}
      description={document
        ? `${Math.max(1, Math.round(document.size / 1024))}KB · 다시 선택하려면 클릭`
        : "PDF, DOC, DOCX, XLSX 또는 TXT"}
      accept={REQUEST_ACCEPT}
      removeLabel="의뢰 요청서 제거"
      onFile={file => {
        onChange({ file, name: file.name, size: file.size, type: file.type });
      }}
      onRemove={() => onChange(null)}
    />
  );
}
