import { Redis } from "@upstash/redis";

// 创建 Redis 客户端
// 需要在环境变量中设置 UPSTASH_REDIS_REST_URL 和 UPSTASH_REDIS_REST_TOKEN
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

// 短链接数据结构
export interface UrlEntry {
  url: string;
  createdAt: string;
  clicks: number;
}

// 短链接相关的 Redis 操作
export const urlStore = {
  // 保存短链接
  async set(code: string, data: UrlEntry): Promise<void> {
    await redis.set(`url:${code}`, JSON.stringify(data));
    // 同时保存原始URL到code的映射，用于查重
    await redis.set(`url_lookup:${data.url}`, code);
  },

  // 获取短链接数据
  async get(code: string): Promise<UrlEntry | null> {
    const data = await redis.get<string>(`url:${code}`);
    if (!data) return null;
    return typeof data === "string" ? JSON.parse(data) : data;
  },

  // 根据原始URL查找是否已存在短链接
  async findByUrl(url: string): Promise<string | null> {
    const code = await redis.get<string>(`url_lookup:${url}`);
    return code;
  },

  // 增加点击次数
  async incrementClicks(code: string): Promise<void> {
    const data = await this.get(code);
    if (data) {
      data.clicks += 1;
      await redis.set(`url:${code}`, JSON.stringify(data));
    }
  },
};

