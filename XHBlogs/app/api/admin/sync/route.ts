// app/api/admin/sync/route.ts
// 在线保存：把照片墙(albums)或项目(projects)数据写回仓库，触发 Vercel 自动重新构建
import { NextRequest } from 'next/server';
import {
      checkAdmin,
      putFile,
      buildAlbumsTs,
      buildProjectsTs,
      ALBUMS_PATH,
      PROJECTS_PATH,
} from '../../../../lib/github';

export async function POST(req: NextRequest) {
      if (!checkAdmin(req)) {
              return Response.json({ error: '未授权' }, { status: 401 });
      }

  try {
          const body = await req.json();
          const type = body.type as string; // 'albums' | 'projects'
        const data = body.data as unknown[];

        if (type !== 'albums' && type !== 'projects') {
                  return Response.json({ error: 'type 必须是 albums 或 projects' }, { status: 400 });
        }
          if (!Array.isArray(data)) {
                    return Response.json({ error: 'data 必须是数组' }, { status: 400 });
          }

        if (type === 'albums') {
                  await putFile(ALBUMS_PATH, buildAlbumsTs(data), '🖼️ 在线更新照片墙');
        } else {
                  await putFile(PROJECTS_PATH, buildProjectsTs(data), '🚀 在线更新项目');
        }

        return Response.json({
                  success: true,
                  message: '已提交到 GitHub，Vercel 将在 1~2 分钟内自动重新构建上线。',
        });
  } catch (e: any) {
          return Response.json({ error: e.message || '保存失败' }, { status: 500 });
  }
}
