import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "工具箱 - 在线实用工具集合",
  description: "免费在线工具集合：短链接生成、二维码生成、文件转换等",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center w-full">
          <div className="w-full">
            {children}
          </div>
        </main>
        <Footer />
      </body>
    </html>
  );
}
