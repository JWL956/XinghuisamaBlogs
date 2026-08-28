// app/api/admin/sync/route.ts
// 在线保存：把各栏目数据写回仓库，触发 Vercel 自动重新构建
import { NextRequest } from 'next/server';
import {
      checkAdmin,
      putFile,
      buildAlbumsTs,
      buildProjectsTs,
      buildChattersTs,
      buildMomentsTs,
      buildMusicTs,
      ALBUMS_PATH,
      PROJECTS_PATH,
      CHATTERS_PATH,
      MOMENTS_PATH,
      MUSIC_PATH,
} from '../../../../lib/github';

const TYPES: Record<string, { path: string; builder: (d: unknown[]) => string; label: string }> = {
      albums: { path: ALBUMS_PATH, builder: buildAlbumsTs, label: '🖼️ 在线更新照片墙' },
      projects: { path: PROJECTS_PATH, builder: buildProjectsTs, label: '🚀 在线更新项目' },
      chatters: { path: CHATTERS_PATH, builder: buildChattersTs, label: '💬 在线更新杂谈' },
      moments: { path: MOMENTS_PATH, builder: buildMomentsTs, label: '📝 在线更新说说' },
      music: { path: MUSIC_PATH, builder: buildMusicTs, label: '🎵 在线更新音乐' },
};

export async function POST(req: NextRequest) {
      if (!checkAdmin(req)) {
              return Response.json({ error: '未授权' }, { status: 401 });
      }

  try {
          const body = await req.json();
          const type = body.type as string;
        const data = body.data as unknown[];
        const conf = TYPES[type];

        if (!conf) {
                  return Response.json({ error: 'type 必须是 albums / projects / chatters / moments / music' }, { status: 400 });
        }
          if (!Array.isArray(data)) {
                    return Response.json({ error: 'data 必须是数组' }, { status: 400 });
          }

        await putFile(conf.path, conf.builder(data), conf.label);

        return Response.json({
                  success: true,
                  message: '已提交到 GitHub，Vercel 将在 1~2 分钟内自动重新构建上线。',
        });
  } catch (e: any) {
          return Response.json({ error: e.message || '保存失败' }, { status: 500 });
  }
}
