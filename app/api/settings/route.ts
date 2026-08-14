import { NextResponse } from "next/server";
import {
  deleteStoredOpenAIApiKey,
  readAppSettingsStatus,
  saveOpenAIApiKey,
  setOpenAIApiKeyMode,
  type OpenAiApiKeyMode,
} from "@/system/server/app-settings";

export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json(await readAppSettingsStatus());
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "설정을 읽을 수 없습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { openAiApiKey?: string };
    const apiKey = body.openAiApiKey?.trim() ?? "";
    if (!apiKey) {
      return NextResponse.json(
        { error: "API 키가 비어 있습니다." },
        { status: 400 },
      );
    }

    return NextResponse.json(await saveOpenAIApiKey(apiKey));
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "API 키를 저장할 수 없습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { openAiApiKeyMode?: string };
    const mode = body.openAiApiKeyMode;
    if (mode !== "env" && mode !== "workspace") {
      return NextResponse.json(
        { error: "올바른 API 키 사용 방식을 선택해 주세요." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      await setOpenAIApiKeyMode(mode as OpenAiApiKeyMode),
    );
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "API 키 사용 방식을 저장할 수 없습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(): Promise<NextResponse> {
  try {
    return NextResponse.json(await deleteStoredOpenAIApiKey());
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "API 키를 초기화할 수 없습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
