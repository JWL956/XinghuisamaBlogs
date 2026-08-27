// app/api/admin/upload/route.ts
// 在线传照片：把图片上传到仓库 public/photo/upload/，返回可直接引用的 URL
import { NextRequest } from 'next/server';
import { checkAdmin, putFile, PHOTO_DIR } from '../../../lib/github';

export async function POST(req: NextRequest) {
    if (!checkAdmin(req)) {
          return Response.json({ error: '未授权' }, { status: 401 });
        }

    try {
          const form = await req.formData();
          const file = form.get('file') as File | null;
          if (!file) {
                  return Response.json({ error: '没有收到文件' }, { status: 400 });
                }

          const bytes = Buffer.from(await file.arrayBuffer());
          // 单张限制 8MB，防止仓库膨胀
          if (bytes.length > 8 * 1024 * 1024) {
                  return Response.json({ error: '图片超过 8MB 限制' }, { status: 400 });
                }

          const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
          const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const path = `${PHOTO_DIR}/${filename}`;

          await putFile(path, bytes, `📷 上传照片 ${filename}`);

          return Response.json({
                  success: true,
                  url: `https://www.956ab.icu/photo/upload/${filename}`,
                  filename,
                });
        } catch (e: any) {
          return Response.json({ error: e.message || '上传失败' }, { status: 500 });
        }
  }
