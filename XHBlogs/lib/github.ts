// lib/github.ts
// 方案A：把 GitHub 当作博客的"云盘"——通过 GitHub Contents API 读写仓库数据文件
// 需要环境变量 GITHUB_TOKEN（GitHub Personal Access Token，仓库读写权限）
import { NextRequest } from 'next/server';

const REPO = 'JWL956/XinghuisamaBlogs';
const BRANCH = 'main';

export const ALBUMS_PATH = 'XHBlogs/data/albums.ts';
export const PROJECTS_PATH = 'XHBlogs/data/projects.ts';
export const PHOTO_DIR = 'XHBlogs/public/photo/upload';
export const CHATTERS_PATH = 'XHBlogs/data/chatters.ts';
export const MOMENTS_PATH = 'XHBlogs/data/moments.ts';
export const MUSIC_PATH = 'XHBlogs/data/music.ts';

function apiHeaders(): Record<string, string> {
    return {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN || ''}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
    };
}

function buildUrl(path: string): string {
    return `https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`;
}

// 获取文件当前 sha（不存在返回 null）
export async function getFileSha(path: string): Promise<string | null> {
    const res = await fetch(buildUrl(path), { headers: apiHeaders(), cache: 'no-store' });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GitHub 读取失败: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.sha || null;
}

// 读取文件内容（UTF-8 解码），不存在返回 null
export async function getFileContent(path: string): Promise<string | null> {
    const res = await fetch(buildUrl(path), { headers: apiHeaders(), cache: 'no-store' });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GitHub 读取失败: ${res.status} ${await res.text()}`);
    const data = await res.json();
    if (!data.content) return null;
    return Buffer.from(data.content, 'base64').toString('utf-8');
}

// 写入/更新文件：content 为 UTF-8 字符串或 Buffer
export async function putFile(path: string, content: string | Buffer, message: string): Promise<void> {
    const sha = await getFileSha(path);
    const body: Record<string, unknown> = {
          message,
          content:
                  typeof content === 'string'
              ? Buffer.from(content, 'utf-8').toString('base64')
                    : content.toString('base64'),
          branch: BRANCH,
    };
    if (sha) body.sha = sha;

  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
        method: 'PUT',
        headers: apiHeaders(),
        body: JSON.stringify(body),
  });
    if (!res.ok) {
          const err = await res.text();
          throw new Error(`GitHub 写入失败 ${res.status}: ${err.slice(0, 300)}`);
    }
}

// 管理接口鉴权：请求头 x-admin-password 必须等于环境变量 ADMIN_PASSWORD
export function checkAdmin(req: NextRequest): boolean {
    const pwd = process.env.ADMIN_PASSWORD || '';
    if (!pwd) return false;
    return req.headers.get('x-admin-password') === pwd;
}

// 生成照片墙/项目数据文件的 TypeScript 模板
export function buildAlbumsTs(data: unknown[]): string {
    return (
          '// 🛡️ 本文件由在线管理台自动生成，请勿手动修改\n' +
          'export interface Photo { url: string; caption?: string; }\n' +
          'export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }\n' +
          `export const albums: Album[] = ${JSON.stringify(data, null, 2)};\n`
        );
}

export function buildProjectsTs(data: unknown[]): string {
    return (
          '// 🛡️ 本文件由在线管理台自动生成，请勿手动修改\n\n' +
          'export type Project = {\n' +
          '  id: string;\n' +
          '  name: string;\n' +
          '  description: string;\n' +
          '  icon: string;\n' +
          '  githubUrl: string;\n' +
          '  tags: string[];\n' +
          '};\n\n' +
          `export const projectsData: Project[] = ${JSON.stringify(data, null, 2)};\n`
        );
}

// 从 TS 文件内容中提取 export const xxx = [...] 的数组
export function buildChattersTs(data: unknown[]): string {
    return (
        '// 🛡️ 本文件由在线管理台自动生成，请勿手动修改\n' +
        'export interface Chatter { id: string; title: string; date: string; tags: string[]; mood: string; cover: string; description: string; content: string; }\n' +
        `export const chatters: Chatter[] = ${JSON.stringify(data, null, 2)};\n`
    );
}

export function buildMomentsTs(data: unknown[]): string {
    return (
        '// 🛡️ 本文件由在线管理台自动生成，请勿手动修改\n' +
        'export interface Moment { id: string; content: string; date: string; location: string; images: string[]; }\n' +
        `export const moments: Moment[] = ${JSON.stringify(data, null, 2)};\n`
    );
}

export function buildMusicTs(data: unknown[]): string {
    return (
        '// 🛡️ 本文件由在线管理台自动生成，请勿手动修改\n' +
        'export interface Music { id: string; title: string; artist: string; cover: string; src: string; lrcText: string; }\n' +
        `export const localMusic: Music[] = ${JSON.stringify(data, null, 2)};\n`
    );
}

export function extractArray(content: string): unknown[] {
      // 定位 export const xxx = [ 的数据数组（跳过 interface 里的 []）
      const eqBracket = content.indexOf('= [');
      let start = eqBracket !== -1 ? eqBracket + 2 : -1;
      if (start === -1) {
            const eq = content.indexOf('=');
            if (eq !== -1) start = content.indexOf('[', eq);
      }
      const end = content.lastIndexOf(']');
      if (start === -1 || end === -1 || end <= start) return [];
      const rawArr = content.slice(start, end + 1);
      // 兼容 TS 字面量：移除尾逗号 + 无引号 key 补引号，再按 JSON 解析
      const jsonText = rawArr
            .replace(/,([\s\r\n]*)([}\]])/g, '$1$2')
            .replace(/([{,]\s*)([A-Za-z_$][\w$]*)(\s*:)/g, '$1"$2"$3');
      try {
            return JSON.parse(jsonText);
      } catch {
            return [];
      }
}
