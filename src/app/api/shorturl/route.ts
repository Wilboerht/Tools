import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";

// 使用JSON文件存储短链接映射（生产环境建议使用数据库）
const DATA_FILE = path.join(process.cwd(), "data", "urls.json");

interface UrlData {
  [key: string]: {
    url: string;
    createdAt: string;
    clicks: number;
  };
}

function ensureDataDir() {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readUrls(): UrlData {
  ensureDataDir();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading URLs:", error);
  }
  return {};
}

function writeUrls(data: UrlData) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
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
    urls[code] = {
      url,
      createdAt: new Date().toISOString(),
      clicks: 0,
    };

    writeUrls(urls);

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

