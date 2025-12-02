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
    <div className="max-w-xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900 mb-1">Pages 转 Word</h1>
        <p className="text-sm text-slate-500">将 Apple Pages 文档转换为 Microsoft Word 格式</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-md p-6 text-center transition-colors ${
              dragActive
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 hover:border-slate-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-sm text-slate-600 mb-2">
              拖放 .pages 文件到这里
            </p>
            <label className="inline-block px-3 py-1.5 text-sm border border-slate-300 rounded-md cursor-pointer hover:bg-slate-50 transition-colors">
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
            <div className="p-3 bg-slate-50 rounded-md flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="text-sm font-medium text-slate-800">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                onClick={() => { setFile(null); setResult(null); }}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            onClick={convertFile}
            disabled={!file || loading}
            className="w-full py-2 px-4 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "转换中..." : "开始转换"}
          </button>

          {result && (
            <div className="pt-4 border-t border-slate-200 text-center">
              <p className="text-sm text-green-600 mb-3">✓ 转换完成：{result.filename}</p>
              <button
                onClick={downloadFile}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                下载文件
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        需要安装 LibreOffice 转换引擎
      </p>
    </div>
  );
}

