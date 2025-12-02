import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";

export async function POST(request: NextRequest) {
  try {
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
    const zip = await JSZip.loadAsync(arrayBuffer);

    // 提取内容
    const extractedContent = await extractPagesContent(zip);

    // 创建简单的Word文档 (Office Open XML格式)
    const docxBuffer = await createDocx(extractedContent, file.name.replace(".pages", ""));

    // 返回docx文件 (转换Buffer为Uint8Array以兼容NextResponse)
    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.name.replace(".pages", ".docx"))}"`,
      },
    });
  } catch (error) {
    console.error("Error converting file:", error);
    return NextResponse.json(
      { success: false, error: "Conversion failed. The file may be corrupted or in an unsupported format." },
      { status: 500 }
    );
  }
}

interface ExtractedContent {
  title: string;
  paragraphs: string[];
  images: { name: string; data: Uint8Array }[];
}

async function extractPagesContent(zip: JSZip): Promise<ExtractedContent> {
  const content: ExtractedContent = {
    title: "",
    paragraphs: [],
    images: [],
  };

  // 尝试读取不同版本的Pages格式
  const files = Object.keys(zip.files);
  
  // 查找文本内容
  for (const filename of files) {
    const file = zip.files[filename];
    
    if (file.dir) continue;

    // 尝试读取XML文件
    if (filename.endsWith(".xml") || filename === "index.xml") {
      try {
        const xmlContent = await file.async("string");
        const texts = extractTextFromXml(xmlContent);
        content.paragraphs.push(...texts);
      } catch (e) {
        console.error("Error reading XML:", e);
      }
    }

    // 尝试读取IWA文件（新版Pages格式）
    if (filename.endsWith(".iwa")) {
      try {
        const iwaData = await file.async("uint8array");
        const texts = extractTextFromIwa(iwaData);
        content.paragraphs.push(...texts);
      } catch (e) {
        console.error("Error reading IWA:", e);
      }
    }

    // 提取图片
    if (/\.(jpg|jpeg|png|gif|tiff)$/i.test(filename)) {
      try {
        const imageData = await file.async("uint8array");
        content.images.push({ name: filename, data: imageData });
      } catch (e) {
        console.error("Error reading image:", e);
      }
    }
  }

  // 检查是否有嵌套的Index.zip
  if (zip.files["Index.zip"]) {
    try {
      const indexZipData = await zip.files["Index.zip"].async("uint8array");
      const indexZip = await JSZip.loadAsync(indexZipData);
      
      for (const filename of Object.keys(indexZip.files)) {
        if (filename.endsWith(".xml")) {
          const xmlContent = await indexZip.files[filename].async("string");
          const texts = extractTextFromXml(xmlContent);
          content.paragraphs.push(...texts);
        }
      }
    } catch (e) {
      console.error("Error reading Index.zip:", e);
    }
  }

  // 去重并过滤空内容
  content.paragraphs = [...new Set(content.paragraphs)].filter(p => p.trim().length > 0);

  return content;
}

function extractTextFromXml(xml: string): string[] {
  const texts: string[] = [];
  
  // 简单的XML文本提取
  const textRegex = />([^<]+)</g;
  let match;
  
  while ((match = textRegex.exec(xml)) !== null) {
    const text = match[1].trim();
    // 过滤掉明显的元数据
    if (text && 
        text.length > 1 && 
        !text.startsWith("xmlns") &&
        !text.includes("http://") &&
        !text.includes("apple.com") &&
        !/^[0-9a-f-]{36}$/i.test(text) && // UUID
        !/^[A-Z]{2,}$/.test(text)) { // 全大写标识符
      texts.push(text);
    }
  }
  
  return texts;
}

function extractTextFromIwa(data: Uint8Array): string[] {
  const texts: string[] = [];
  let currentText: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    
    // 可打印ASCII字符或常见换行符
    if ((byte >= 32 && byte < 127) || byte === 10 || byte === 13) {
      currentText.push(byte);
    } else {
      if (currentText.length > 5) { // 至少5个字符
        const text = String.fromCharCode(...currentText).trim();
        // 过滤掉明显的元数据
        if (text && 
            !text.startsWith("TSWP") && 
            !text.startsWith("TSP") &&
            !text.startsWith("TST") &&
            !text.includes("protobuf") &&
            text.length > 3) {
          texts.push(text);
        }
      }
      currentText = [];
    }
  }
  
  // 处理最后的文本
  if (currentText.length > 5) {
    const text = String.fromCharCode(...currentText).trim();
    if (text) {
      texts.push(text);
    }
  }
  
  return texts;
}

async function createDocx(content: ExtractedContent, title: string): Promise<Buffer> {
  const zip = new JSZip();

  // [Content_Types].xml
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`);

  // _rels/.rels
  zip.folder("_rels")?.file(".rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  // word/_rels/document.xml.rels
  zip.folder("word")?.folder("_rels")?.file("document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);

  // word/styles.xml
  zip.folder("word")?.file("styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:rPr><w:b/><w:sz w:val="48"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr><w:sz w:val="24"/></w:rPr>
  </w:style>
</w:styles>`);

  // 构建文档内容
  let paragraphsXml = "";
  
  // 添加标题
  paragraphsXml += `<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t>${escapeXml(title)}</w:t></w:r></w:p>`;
  
  // 添加内容
  if (content.paragraphs.length > 0) {
    for (const para of content.paragraphs) {
      paragraphsXml += `<w:p><w:r><w:t>${escapeXml(para)}</w:t></w:r></w:p>`;
    }
  } else {
    // 没有提取到内容时的提示
    paragraphsXml += `<w:p><w:r><w:t>无法提取Pages文件的文本内容。</w:t></w:r></w:p>`;
    paragraphsXml += `<w:p><w:r><w:t>这可能是因为：</w:t></w:r></w:p>`;
    paragraphsXml += `<w:p><w:r><w:t>1. Pages文件使用了新版IWA格式</w:t></w:r></w:p>`;
    paragraphsXml += `<w:p><w:r><w:t>2. 文件主要包含图片或其他媒体</w:t></w:r></w:p>`;
    paragraphsXml += `<w:p><w:r><w:t>3. 文件内容受到保护</w:t></w:r></w:p>`;
    paragraphsXml += `<w:p><w:r><w:t></w:t></w:r></w:p>`;
    paragraphsXml += `<w:p><w:r><w:t>建议：在Mac上打开Pages文件，使用"文件 &gt; 导出到 &gt; Word"功能进行转换。</w:t></w:r></w:p>`;
  }

  // word/document.xml
  zip.folder("word")?.file("document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphsXml}
  </w:body>
</w:document>`);

  // 生成docx文件
  const docxBuffer = await zip.generateAsync({ type: "nodebuffer" });
  return docxBuffer;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

