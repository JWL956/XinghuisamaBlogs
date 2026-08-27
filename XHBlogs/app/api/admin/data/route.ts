// app/api/admin/data/route.ts
// 读取当前照片墙/项目数据，供在线管理页回显
import { NextRequest } from 'next/server';
import {
    checkAdmin,
    getFileContent,
    extractArray,
    ALBUMS_PATH,
    PROJECTS_PATH,
} from '../../../lib/github';

export async function GET(req: NextRequest) {
    if (!checkAdmin(req)) {
          return Response.json({ error: '未授权' }, { status: 401 });
    }

  try {
        const [albumsContent, projectsContent] = await Promise.all([
                getFileContent(ALBUMS_PATH),
                getFileContent(PROJECTS_PATH),
              ]);

      return Response.json({
              success: true,
              albums: albumsContent ? extractArray(albumsContent) : [],
              projects: projectsContent ? extractArray(projectsContent) : [],
      });
  } catch (e: any) {
        return Response.json({ error: e.message || '读取失败' }, { status: 500 });
  }
}
