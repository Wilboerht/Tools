import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { urlStore, UrlEntry } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 }
      );
    }

    // 验证URL格式
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // 检查是否已存在相同URL
    const existingCode = await urlStore.findByUrl(url);
    if (existingCode) {
      const host = request.headers.get("host") || "localhost:3000";
      const protocol = request.headers.get("x-forwarded-proto") || "http";
      return NextResponse.json({
        success: true,
        shortUrl: `${protocol}://${host}/s/${existingCode}`,
        code: existingCode,
        isExisting: true,
      });
    }

    // 生成新的短码
    const code = nanoid(6);
    const newEntry: UrlEntry = {
      url,
      createdAt: new Date().toISOString(),
      clicks: 0,
    };

    await urlStore.set(code, newEntry);

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || "http";

    return NextResponse.json({
      success: true,
      shortUrl: `${protocol}://${host}/s/${code}`,
      code,
    });
  } catch (error) {
    console.error("Error creating short URL:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { success: false, error: "Code is required" },
      { status: 400 }
    );
  }

  const urlData = await urlStore.get(code);

  if (!urlData) {
    return NextResponse.json(
      { success: false, error: "URL not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    url: urlData.url,
    createdAt: urlData.createdAt,
    clicks: urlData.clicks,
  });
}

