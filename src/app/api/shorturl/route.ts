import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

interface UrlEntry {
  url: string;
  createdAt: string;
  clicks: number;
}

interface UrlData {
  [key: string]: UrlEntry;
}

// 使用内存存储（Vercel无服务器环境不支持文件系统持久化）
// 注意：这意味着短链接在服务器重启后会丢失
// 生产环境建议使用 Vercel KV、Upstash Redis 或其他数据库
const memoryStore: UrlData = {};

function readUrls(): UrlData {
  return memoryStore;
}

function writeUrls(code: string, data: UrlEntry) {
  memoryStore[code] = data;
}

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

    const urls = readUrls();

    // 检查是否已存在相同URL
    for (const [code, data] of Object.entries(urls)) {
      if (data.url === url) {
        const host = request.headers.get("host") || "localhost:3000";
        const protocol = request.headers.get("x-forwarded-proto") || "http";
        return NextResponse.json({
          success: true,
          shortUrl: `${protocol}://${host}/s/${code}`,
          code,
          isExisting: true,
        });
      }
    }

    // 生成新的短码
    const code = nanoid(6);
    const newEntry: UrlEntry = {
      url,
      createdAt: new Date().toISOString(),
      clicks: 0,
    };

    writeUrls(code, newEntry);

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

  const urls = readUrls();
  const urlData = urls[code];

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

