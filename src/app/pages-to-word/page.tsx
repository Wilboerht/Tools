"use client";

import { useState, useCallback } from "react";
import { FileText, Upload, Download, AlertCircle } from "lucide-react";

export default function PagesToWordPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ downloadUrl: string; filename: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".pages")) {
        setFile(droppedFile);
        setError("");
        setResult(null);
      } else {
        setError("请上传 .pages 文件");
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith(".pages")) {
        setFile(selectedFile);
        setError("");
        setResult(null);
      } else {
        setError("请上传 .pages 文件");
      }
    }
  };

  const convertFile = async () => {
    if (!file) {
      setError("请先选择文件");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/pages-to-word", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "转换失败");
      }

      // 获取blob数据
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const filename = file.name.replace(".pages", ".docx");

      setResult({ downloadUrl, filename });
    } catch (err) {
      setError(err instanceof Error ? err.message : "转换失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = () => {
    if (!result) return;

    const link = document.createElement("a");
    link.href = result.downloadUrl;
    link.download = result.filename;
    link.click();
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
          Pages 转 Word
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          将 Apple Pages 文档转换为 Microsoft Word 格式
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragActive
              ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
              : "border-slate-300 dark:border-slate-600 hover:border-orange-400"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <p className="text-slate-600 dark:text-slate-400 mb-2">
            拖放 .pages 文件到这里，或者
          </p>
          <label className="inline-block px-4 py-2 rounded-lg bg-orange-500 text-white cursor-pointer hover:bg-orange-600 transition-colors">
            选择文件
            <input
              type="file"
              accept=".pages"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {file && (
          <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-orange-500" />
              <div>
                <p className="font-medium text-slate-800 dark:text-white">
                  {file.name}
                </p>
                <p className="text-sm text-slate-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setResult(null);
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <button
          onClick={convertFile}
          disabled={!file || loading}
          className="w-full mt-4 py-3 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>正在转换，请稍候...</span>
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              开始转换
            </>
          )}
        </button>
      </div>

      {/* Result Section */}
      {result && (
        <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
              转换完成！
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {result.filename}
            </p>
            <button
              onClick={downloadFile}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600 transition-colors"
            >
              <Download className="w-5 h-5" />
              下载 Word 文档
            </button>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
          ✨ 使用 CloudConvert 专业转换引擎
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
          <li>• 高质量转换，保留原始格式和排版</li>
          <li>• 支持图片、表格、样式等复杂内容</li>
          <li>• 文件在服务器端安全处理后自动删除</li>
        </ul>
      </div>
    </div>
  );
}

