import { NextResponse } from "next/server";
import {
  deleteStoredOpenAIApiKey,
  readAppSettingsStatus,
  saveOpenAIApiKey,
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
