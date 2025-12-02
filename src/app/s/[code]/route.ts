import { NextRequest, NextResponse } from "next/server";
import { urlStore } from "@/lib/redis";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const urlData = await urlStore.get(code);

  if (!urlData) {
    // 短链接不存在，重定向到短链接页面并显示错误
    return NextResponse.redirect(new URL("/shorturl?error=not_found", request.url));
  }

  // 增加点击计数
  await urlStore.incrementClicks(code);

  // 重定向到原始URL
  return NextResponse.redirect(urlData.url);
}

