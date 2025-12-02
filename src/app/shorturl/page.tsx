"use client";

import { useState } from "react";
import { Link2, Copy, Check, ExternalLink } from "lucide-react";

export default function ShortUrlPage() {
  const [longUrl, setLongUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const generateShortUrl = async () => {
    if (!longUrl.trim()) {
      setError("请输入网址");
      return;
    }

    // 简单的URL验证
    try {
      new URL(longUrl);
    } catch {
      setError("请输入有效的网址（需包含 http:// 或 https://）");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/shorturl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: longUrl }),
      });

      const data = await response.json();

      if (data.success) {
        setShortUrl(data.shortUrl);
      } else {
        setError(data.error || "生成失败，请重试");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("复制失败");
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900 mb-1">短链接生成</h1>
        <p className="text-sm text-slate-500">将长网址转换为简短易分享的链接</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              长网址
            </label>
            <input
              type="url"
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
              placeholder="https://example.com/your-long-url"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={generateShortUrl}
            disabled={loading}
            className="w-full py-2 px-4 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "生成中..." : "生成短链接"}
          </button>

          {shortUrl && (
            <div className="pt-4 border-t border-slate-200">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                短链接
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shortUrl}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md bg-slate-50"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                  title="复制"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-600" />
                  )}
                </button>
                <a
                  href={shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                  title="访问"
                >
                  <ExternalLink className="w-4 h-4 text-slate-600" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        短链接永久有效
      </p>
    </div>
  );
}

