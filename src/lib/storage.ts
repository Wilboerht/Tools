import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

// 短链接数据结构
export interface UrlEntry {
  url: string;
  createdAt: string;
  clicks: number;
}

interface UrlDatabase {
  urls: Record<string, UrlEntry>;
}

// 数据文件路径
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "urls.json");

// 确保数据目录存在
function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

// 读取数据库
function readDatabase(): UrlDatabase {
  ensureDataDir();
  if (!existsSync(DATA_FILE)) {
    return { urls: {} };
  }
  try {
    const content = readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return { urls: {} };
  }
}

// 写入数据库
function writeDatabase(db: UrlDatabase) {
  ensureDataDir();
  writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf-8");
}

// 短链接相关操作（本地文件存储）
export const urlStore = {
  // 保存短链接
  async set(code: string, data: UrlEntry): Promise<void> {
    const db = readDatabase();
    db.urls[code] = data;
    writeDatabase(db);
  },

  // 获取短链接数据
  async get(code: string): Promise<UrlEntry | null> {
    const db = readDatabase();
    return db.urls[code] || null;
  },

  // 根据原始URL查找是否已存在短链接
  async findByUrl(url: string): Promise<string | null> {
    const db = readDatabase();
    for (const [code, entry] of Object.entries(db.urls)) {
      if (entry.url === url) {
        return code;
      }
    }
    return null;
  },

  // 增加点击次数
  async incrementClicks(code: string): Promise<void> {
    const db = readDatabase();
    if (db.urls[code]) {
      db.urls[code].clicks += 1;
      writeDatabase(db);
    }
  },
};
