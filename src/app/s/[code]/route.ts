import { NextRequest, NextResponse } from "next/server";

interface UrlEntry {
  url: string;
  createdAt: string;
  clicks: number;
}

interface UrlData {
  [key: string]: UrlEntry;
}

// 共享内存存储（与shorturl API保持同步）
// 注意：在Vercel无服务器环境中，每个函数实例有独立的内存
// 这意味着短链接可能无法跨实例工作，生产环境建议使用数据库
const memoryStore: UrlData = {};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const urlData = memoryStore[code];

  if (!urlData) {
    // 短链接不存在，重定向到短链接页面并显示错误
    return NextResponse.redirect(new URL("/shorturl?error=not_found", request.url));
  }

  // 增加点击计数
  memoryStore[code].clicks += 1;

  // 重定向到原始URL
  return NextResponse.redirect(urlData.url);
}

