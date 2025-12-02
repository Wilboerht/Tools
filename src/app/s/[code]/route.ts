import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "urls.json");

interface UrlData {
  [key: string]: {
    url: string;
    createdAt: string;
    clicks: number;
  };
}

function readUrls(): UrlData {
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
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const urls = readUrls();
  const urlData = urls[code];

  if (!urlData) {
    return NextResponse.redirect(new URL("/shorturl?error=not_found", request.url));
  }

  // 增加点击计数
  urls[code].clicks += 1;
  writeUrls(urls);

  // 重定向到原始URL
  return NextResponse.redirect(urlData.url);
}

