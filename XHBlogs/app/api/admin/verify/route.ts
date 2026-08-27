// app/api/admin/verify/route.ts
// 登录校验：验证管理密码
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
    try {
          const body = await req.json();
          const pwd = body.password as string;
          const expected = process.env.ADMIN_PASSWORD || '';
          if (!expected) {
                  return Response.json({ ok: false, error: '服务端未配置 ADMIN_PASSWORD' }, { status: 500 });
          }
          if (pwd === expected) {
                  return Response.json({ ok: true });
          }
          return Response.json({ ok: false }, { status: 401 });
    } catch {
          return Response.json({ ok: false }, { status: 400 });
    }
}
