"use client";

import { useEffect, useState } from 'react';

// 在线管理台：登录后可在线传照片、编辑照片墙与项目
// 访问地址：你的域名/admin
export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState<null | 'albums' | 'projects'>(null);
  const [albums, setAlbums] = useState('');
  const [projects, setProjects] = useState('');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('admin_pwd');
    if (saved) {
      setPassword(saved);
      setAuthed(true);
      loadData(saved);
    }
  }, []);

  async function loadData(pwd: string) {
    try {
      const res = await fetch('/api/admin/data', { headers: { 'x-admin-password': pwd } });
      if (!res.ok) throw new Error('鉴权失败或未部署成功');
      const d = await res.json();
      setAlbums(JSON.stringify(d.albums, null, 2));
      setProjects(JSON.stringify(d.projects, null, 2));
      setMsg({ type: 'ok', text: '已加载当前数据（可开始编辑）' });
    } catch (e: any) {
      setMsg({ type: 'err', text: e.message || '加载失败' });
    }
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setAuthed(true);
      localStorage.setItem('admin_pwd', password);
      loadData(password);
    } else {
      setMsg({ type: 'err', text: '密码错误' });
    }
  }

  async function upload(file: File) {
    setUploading(true);
    setMsg(null);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'x-admin-password': password },
        body: fd,
      });
      const d = await res.json();
      if (d.success) {
        setUploadedUrl(d.url);
        setMsg({ type: 'ok', text: '上传成功，已生成 URL（稍等几分钟等构建完成即可访问）' });
      } else {
        setMsg({ type: 'err', text: d.error || '上传失败' });
      }
    } catch (e: any) {
      setMsg({ type: 'err', text: e.message || '上传失败' });
    }
    setUploading(false);
  }

  async function save(type: 'albums' | 'projects') {
    setSaving(type);
    setMsg(null);
    let data: unknown;
    try {
      data = JSON.parse(type === 'albums' ? albums : projects);
    } catch {
      setMsg({ type: 'err', text: 'JSON 格式有误，请检查后重试' });
      setSaving(null);
      return;
    }
    try {
      const res = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ type, data }),
      });
      const d = await res.json();
      setMsg(d.success ? { type: 'ok', text: d.message } : { type: 'err', text: d.error || '保存失败' });
    } catch (e: any) {
      setMsg({ type: 'err', text: e.message || '保存失败' });
    }
    setSaving(null);
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
        <form onSubmit={login} className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-black text-white mb-6 text-center">956 在线管理台</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="管理密码"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
          />
          <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition-colors">
            登 录
          </button>
          {msg && <p className={`mt-4 text-sm ${msg.type === 'err' ? 'text-red-400' : 'text-green-400'}`}>{msg.text}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-white">956 在线管理台</h1>
          <button
            onClick={() => { setAuthed(false); localStorage.removeItem('admin_pwd'); }}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            退出登录
          </button>
        </div>

        {msg && (
          <div className={`rounded-lg px-4 py-3 text-sm ${msg.type === 'err' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
            {msg.text}
          </div>
        )}

        {/* 上传照片 */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">📷 上传照片</h2>
          <label className="block w-full cursor-pointer border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-6 text-center transition-colors">
            <span className="text-sm text-slate-400">点击选择图片（jpg / png / gif / webp，单张 ≤ 8MB）</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }}
            />
          </label>
          {uploading && <p className="text-sm text-indigo-400 mt-3">上传中，请稍候（将提交到 GitHub）...</p>}
          {uploadedUrl && (
            <div className="mt-4 flex items-center gap-3">
              <input readOnly value={uploadedUrl} className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-green-300 outline-none" />
              <button
                onClick={() => { navigator.clipboard.writeText(uploadedUrl); setMsg({ type: 'ok', text: 'URL 已复制' }); }}
                className="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-sm font-bold transition-colors"
              >
                复制
              </button>
            </div>
          )}
        </section>

        {/* 照片墙数据 */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">🖼️ 照片墙数据（albums）</h2>
            <button
              onClick={() => save('albums')}
              disabled={saving === 'albums'}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors"
            >
              {saving === 'albums' ? '提交中...' : '保存并发布'}
            </button>
          </div>
          <textarea
            value={albums}
            onChange={(e) => setAlbums(e.target.value)}
            spellCheck={false}
            className="w-full h-80 bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm font-mono text-green-300 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-slate-500 mt-2">结构：[{'{'} id, title, description, cover, date, photos: [{'{'} url, caption {'}'}] {'}'}]。保存后约 1~2 分钟自动上线。</p>
        </section>

        {/* 项目数据 */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">🚀 项目数据（projects）</h2>
            <button
              onClick={() => save('projects')}
              disabled={saving === 'projects'}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors"
            >
              {saving === 'projects' ? '提交中...' : '保存并发布'}
            </button>
          </div>
          <textarea
            value={projects}
            onChange={(e) => setProjects(e.target.value)}
            spellCheck={false}
            className="w-full h-64 bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm font-mono text-green-300 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-slate-500 mt-2">结构：[{'{'} id, name, description, icon, githubUrl, tags: [] {'}'}]。保存后约 1~2 分钟自动上线。</p>
        </section>
      </div>
    </div>
  );
}
