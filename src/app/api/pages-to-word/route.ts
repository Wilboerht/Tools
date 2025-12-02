import { NextRequest, NextResponse } from "next/server";
import CloudConvert from "cloudconvert";

// 初始化 CloudConvert 客户端
const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    // 检查 API Key 是否配置
    if (!process.env.CLOUDCONVERT_API_KEY) {
      return NextResponse.json(
        { success: false, error: "CloudConvert API Key 未配置" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    if (!file.name.endsWith(".pages")) {
      return NextResponse.json(
        { success: false, error: "Invalid file format. Please upload a .pages file" },
        { status: 400 }
      );
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 创建 CloudConvert 任务
    const job = await cloudConvert.jobs.create({
      tasks: {
        "upload-file": {
          operation: "import/upload",
        },
        "convert-file": {
          operation: "convert",
          input: ["upload-file"],
          input_format: "pages",
          output_format: "docx",
        },
        "export-file": {
          operation: "export/url",
          input: ["convert-file"],
        },
      },
    });

    // 找到上传任务
    const uploadTask = job.tasks.find((task) => task.name === "upload-file");
    if (!uploadTask || !uploadTask.result?.form) {
      throw new Error("无法创建上传任务");
    }

    // 上传文件到 CloudConvert
    const uploadFormData = new FormData();
    for (const [key, value] of Object.entries(uploadTask.result.form.parameters)) {
      uploadFormData.append(key, value as string);
    }
    uploadFormData.append("file", new Blob([buffer]), file.name);

    const uploadResponse = await fetch(uploadTask.result.form.url, {
      method: "POST",
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      throw new Error("文件上传失败");
    }

    // 等待任务完成
    const completedJob = await cloudConvert.jobs.wait(job.id);

    // 找到导出任务，获取下载链接
    const exportTask = completedJob.tasks.find((task) => task.name === "export-file");
    if (!exportTask || exportTask.status !== "finished" || !exportTask.result?.files?.[0]?.url) {
      throw new Error("转换失败");
    }

    const downloadUrl = exportTask.result.files[0].url;

    // 下载转换后的文件
    const downloadResponse = await fetch(downloadUrl);
    if (!downloadResponse.ok) {
      throw new Error("下载转换文件失败");
    }

    const docxBuffer = await downloadResponse.arrayBuffer();

    // 返回docx文件
    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.name.replace(".pages", ".docx"))}"`,
      },
    });
  } catch (error) {
    console.error("Error converting file:", error);
    const errorMessage = error instanceof Error ? error.message : "转换失败";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
