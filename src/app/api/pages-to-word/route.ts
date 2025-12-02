import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, unlink, mkdir, rmdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  // 创建临时目录
  const tempDir = path.join(os.tmpdir(), "pages-convert-" + Date.now());
  let inputPath = "";
  let outputPath = "";

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "请上传文件" },
        { status: 400 }
      );
    }

    if (!file.name.endsWith(".pages")) {
      return NextResponse.json(
        { success: false, error: "请上传 .pages 文件" },
        { status: 400 }
      );
    }

    // 创建临时目录
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }

    // 保存上传的文件
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    inputPath = path.join(tempDir, file.name);
    await writeFile(inputPath, fileBuffer);

    // 获取 LibreOffice 路径
    const libreOfficePath = getLibreOfficePath();

    if (!libreOfficePath) {
      return NextResponse.json(
        {
          success: false,
          error: "未找到 LibreOffice，请确保已安装 LibreOffice"
        },
        { status: 500 }
      );
    }

    // 执行 LibreOffice 转换命令
    const command = `"${libreOfficePath}" --headless --convert-to docx --outdir "${tempDir}" "${inputPath}"`;

    try {
      await execAsync(command, { timeout: 60000 }); // 60秒超时
    } catch (execError) {
      console.error("LibreOffice execution error:", execError);
      return NextResponse.json(
        {
          success: false,
          error: "转换失败，请确保 LibreOffice 已正确安装"
        },
        { status: 500 }
      );
    }

    // 读取转换后的文件
    const outputFileName = file.name.replace(".pages", ".docx");
    outputPath = path.join(tempDir, outputFileName);

    if (!existsSync(outputPath)) {
      return NextResponse.json(
        { success: false, error: "转换失败，未生成输出文件" },
        { status: 500 }
      );
    }

    const docxBuffer = await readFile(outputPath);

    // 返回 docx 文件
    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(outputFileName)}"`,
      },
    });
  } catch (error) {
    console.error("Conversion error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "转换失败，请稍后重试",
      },
      { status: 500 }
    );
  } finally {
    // 清理临时文件
    try {
      if (inputPath && existsSync(inputPath)) await unlink(inputPath);
      if (outputPath && existsSync(outputPath)) await unlink(outputPath);
      if (existsSync(tempDir)) await rmdir(tempDir);
    } catch {
      // 忽略清理错误
    }
  }
}

// 获取 LibreOffice 可执行文件路径
function getLibreOfficePath(): string | null {
  const platform = os.platform();

  const possiblePaths: string[] = [];

  if (platform === "win32") {
    // Windows
    possiblePaths.push(
      "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
      "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
      "C:\\Program Files\\LibreOffice 7\\program\\soffice.exe",
      "C:\\Program Files\\LibreOffice 24\\program\\soffice.exe",
    );
  } else if (platform === "darwin") {
    // macOS
    possiblePaths.push(
      "/Applications/LibreOffice.app/Contents/MacOS/soffice",
    );
  } else {
    // Linux
    possiblePaths.push(
      "/usr/bin/libreoffice",
      "/usr/bin/soffice",
      "/usr/lib/libreoffice/program/soffice",
    );
  }

  for (const p of possiblePaths) {
    if (existsSync(p)) {
      return p;
    }
  }

  return null;
}
