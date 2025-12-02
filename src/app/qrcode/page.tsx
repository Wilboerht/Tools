"use client";

import { useState, useRef } from "react";
import { QrCode, Download, Copy, Check } from "lucide-react";

export default function QRCodePage() {
  const [text, setText] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [size, setSize] = useState(300);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateQRCode = async () => {
    if (!text.trim()) {
      setError("请输入内容");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/qrcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, size }),
      });

      const data = await response.json();

      if (data.success) {
        setQrCodeUrl(data.qrcode);
      } else {
        setError(data.error || "生成失败，请重试");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement("a");
    link.download = `qrcode-${Date.now()}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const copyQRCode = async () => {
    if (!qrCodeUrl) return;

    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 如果无法复制图片，复制base64
      try {
        await navigator.clipboard.writeText(qrCodeUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        setError("复制失败");
      }
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900 mb-1">二维码生成</h1>
        <p className="text-sm text-slate-500">将链接或文本转换为二维码图片</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              内容
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="输入链接或文本..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              尺寸: {size}px
            </label>
            <input
              type="range"
              min="100"
              max="500"
              step="50"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
            />
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={generateQRCode}
            disabled={loading}
            className="w-full py-2 px-4 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "生成中..." : "生成二维码"}
          </button>

          {qrCodeUrl && (
            <div className="pt-4 border-t border-slate-200">
              <div className="flex flex-col items-center">
                <div className="p-3 bg-white border border-slate-200 rounded-lg mb-4">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    style={{ width: Math.min(size, 200), height: Math.min(size, 200) }}
                  />
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex gap-2">
                  <button
                    onClick={downloadQRCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    下载
                  </button>
                  <button
                    onClick={copyQRCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        复制
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        支持链接、文本、联系方式等任意内容
      </p>
    </div>
  );
}

