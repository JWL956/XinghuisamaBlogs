// app/api/admin/data/route.ts
// 读取各栏目数据，供在线管理页回显
import { NextRequest } from 'next/server';
import {
      checkAdmin,
      getFileContent,
      extractArray,
      ALBUMS_PATH,
      PROJECTS_PATH,
      CHATTERS_PATH,
      MOMENTS_PATH,
      MUSIC_PATH,
} from '../../../../lib/github';

export async function GET(req: NextRequest) {
      if (!checkAdmin(req)) {
              return Response.json({ error: '未授权' }, { status: 401 });
      }

  try {
          const [albumsContent, projectsContent, chattersContent, momentsContent, musicContent] =
                  await Promise.all([
                          getFileContent(ALBUMS_PATH),
                          getFileContent(PROJECTS_PATH),
                          getFileContent(CHATTERS_PATH),
                          getFileContent(MOMENTS_PATH),
                          getFileContent(MUSIC_PATH),
                        ]);

        return Response.json({
                  success: true,
                  albums: albumsContent ? extractArray(albumsContent) : [],
                  projects: projectsContent ? extractArray(projectsContent) : [],
                  chatters: chattersContent ? extractArray(chattersContent) : [],
                  moments: momentsContent ? extractArray(momentsContent) : [],
                  music: musicContent ? extractArray(musicContent) : [],
        });
  } catch (e: any) {
          return Response.json({ error: e.message || '读取失败' }, { status: 500 });
  }
}
