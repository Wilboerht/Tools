import Link from "next/link";
import { Link2, QrCode, FileText, ChevronRight } from "lucide-react";

const tools = [
  {
    id: "shorturl",
    name: "短链接生成",
    description: "将长网址转换为简短易分享的短链接",
    icon: Link2,
    href: "/shorturl",
  },
  {
    id: "qrcode",
    name: "二维码生成",
    description: "将任意链接或文本转换为二维码图片",
    icon: QrCode,
    href: "/qrcode",
  },
  {
    id: "pages-to-word",
    name: "Pages转Word",
    description: "将Apple Pages文档转换为Microsoft Word格式",
    icon: FileText,
    href: "/pages-to-word",
  },
];

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Tools List */}
      <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-200">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            href={tool.href}
            className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <tool.icon className="w-5 h-5 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-medium text-slate-900">
                {tool.name}
              </h2>
              <p className="text-sm text-slate-500 truncate">
                {tool.description}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
