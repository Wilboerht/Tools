import Link from "next/link";
import { Link2, QrCode, FileText, ArrowRight } from "lucide-react";

const tools = [
  {
    id: "shorturl",
    name: "短链接生成",
    description: "将长网址转换为简短易分享的短链接",
    icon: Link2,
    color: "from-blue-500 to-cyan-500",
    href: "/shorturl",
  },
  {
    id: "qrcode",
    name: "二维码生成",
    description: "将任意链接或文本转换为二维码图片",
    icon: QrCode,
    color: "from-purple-500 to-pink-500",
    href: "/qrcode",
  },
  {
    id: "pages-to-word",
    name: "Pages转Word",
    description: "将Apple Pages文档转换为Microsoft Word格式",
    icon: FileText,
    color: "from-orange-500 to-red-500",
    href: "/pages-to-word",
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="text-center py-16">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          在线工具箱
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          简单、快速、免费的在线工具集合，让您的工作更高效
        </p>
      </section>

      {/* Tools Grid */}
      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            href={tool.href}
            className="group bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-200 dark:border-slate-700"
          >
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <tool.icon className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-slate-800 dark:text-white">
              {tool.name}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {tool.description}
            </p>
            <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium">
              立即使用
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </section>

      {/* Features */}
      <section className="mt-20 text-center">
        <h2 className="text-3xl font-bold mb-8 text-slate-800 dark:text-white">
          为什么选择我们？
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-lg font-semibold mb-2">快速便捷</h3>
            <p className="text-slate-600 dark:text-slate-400">无需注册，即开即用，快速完成任务</p>
          </div>
          <div className="p-6">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold mb-2">安全可靠</h3>
            <p className="text-slate-600 dark:text-slate-400">数据安全处理，保护您的隐私</p>
          </div>
          <div className="p-6">
            <div className="text-4xl mb-4">💯</div>
            <h3 className="text-lg font-semibold mb-2">完全免费</h3>
            <p className="text-slate-600 dark:text-slate-400">所有工具永久免费使用</p>
          </div>
        </div>
      </section>
    </div>
  );
}
