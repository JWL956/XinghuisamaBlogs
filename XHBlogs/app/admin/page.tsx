"use client";

import { useEffect, useState } from 'react';

// 在线管理台 v3：简化表单版（照片墙/项目/杂谈/说说/音乐）
// 只需填关键信息，其余（id、日期、序号等）自动生成

interface AlbumFormItem {
  key: string;
  id: string;
  title: string;
  cover: string;
  description: string;
  date: string;
  photosText: string; // 每行一个图片 URL，可带说明："图片URL|说明"
}

interface ProjectFormItem {
  key: string;
  id: string;
  name: string;
  icon: string;
  description: string;
  githubUrl: string;
  tagsText: string; // 用逗号/空格分隔
}

interface ChatterFormItem {
  key: string;
  id: string;
  title: string;
  cover: string;
  mood: string;
  tagsText: string;
  content: string;
  date: string;
}

interface MomentFormItem {
  key: string;
  id: string;
  content: string;
  location: string;
  imagesText: string; // 每行一个图片 URL
  date: string;
}

interface MusicFormItem {
  key: string;
  id: string;
  title: string;
  artist: string;
  cover: string;
  src: string;
  lrcText: string;
}

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const genId = () =>
  'item-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

const splitTags = (s: string) =>
  s
    .split(/[,，、\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);

const splitLines = (s: string) =>
  s
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState<null | string>(null);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [albumItems, setAlbumItems] = useState<AlbumFormItem[]>([]);
  const [projectItems, setProjectItems] = useState<ProjectFormItem[]>([]);
  const [chatterItems, setChatterItems] = useState<ChatterFormItem[]>([]);
  const [momentItems, setMomentItems] = useState<MomentFormItem[]>([]);
  const [musicItems, setMusicItems] = useState<MusicFormItem[]>([]);

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
      const albums: any[] = d.albums || [];
      const projects: any[] = d.projects || [];
      const chatters: any[] = d.chatters || [];
      const moments: any[] = d.moments || [];
      const music: any[] = d.music || [];

      setAlbumItems(
        albums.map((a) => ({
          key: a.id || genId(),
          id: a.id || '',
          title: a.title || '',
          cover: a.cover || '',
          description: a.description || '',
          date: a.date || '',
          photosText: (a.photos || [])
            .map((p: any) => (p.caption ? `${p.url}|${p.caption}` : p.url))
            .join('\n'),
        })),
      );
      setProjectItems(
        projects.map((p) => ({
          key: p.id || genId(),
          id: p.id || '',
          name: p.name || '',
          icon: p.icon || '',
          description: p.description || '',
          githubUrl: p.githubUrl || '',
          tagsText: (p.tags || []).join(', '),
        })),
      );
      setChatterItems(
        chatters.map((c) => ({
          key: c.slug || c.id || genId(),
          id: c.slug || c.id || '',
          title: c.title || '',
          cover: c.cover || '',
          mood: c.mood || '',
          tagsText: (c.tags || []).join(', '),
          content: c.content || '',
          date: c.date || '',
        })),
      );
      setMomentItems(
        moments.map((m) => ({
          key: m.id || genId(),
          id: m.id || '',
          content: m.content || '',
          location: m.location || '',
          imagesText: (m.images || []).join('\n'),
          date: m.date || '',
        })),
      );
      setMusicItems(
        music.map((s) => ({
          key: s.id || genId(),
          id: s.id || '',
          title: s.title || '',
          artist: s.artist || '',
          cover: s.cover || '',
          src: s.src || '',
          lrcText: s.lrcText || '',
        })),
      );
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
        setMsg({ type: 'ok', text: '上传成功，已生成 URL，可直接粘贴到下面的封面/图片/音频输入框（构建完成后可访问）' });
      } else {
        setMsg({ type: 'err', text: d.error || '上传失败' });
      }
    } catch (e: any) {
      setMsg({ type: 'err', text: e.message || '上传失败' });
    }
    setUploading(false);
  }

  // ---- 字段更新 ----
  const upd = <T extends { key: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, key: string, patch: Partial<T>) =>
    setter((arr) => arr.map((it) => (it.key === key ? { ...it, ...patch } : it)));

  // ---- 解析照片文本 ----
  function parsePhotos(text: string): { url: string; caption?: string }[] {
    return text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l, i) => {
        const idx = l.indexOf('|');
        if (idx > 0) {
          return { url: l.slice(0, idx).trim(), caption: l.slice(idx + 1).trim() || `照片${i + 1}` };
        }
        return { url: l, caption: `照片${i + 1}` };
      });
  }

  // ---- 表单 → 完整数据 ----
  function buildAlbums(): any[] {
    return albumItems.map((it) => {
      const photos = parsePhotos(it.photosText);
      return {
        id: it.id || genId(),
        title: it.title.trim(),
        description: it.description.trim(),
        cover: it.cover.trim() || photos[0]?.url || '',
        date: it.date || today(),
        photos,
      };
    });
  }

  function buildProjects(): any[] {
    return projectItems.map((it) => ({
      id: it.id || genId(),
      name: it.name.trim(),
      description: it.description.trim(),
      icon: it.icon.trim(),
      githubUrl: it.githubUrl.trim(),
      tags: splitTags(it.tagsText),
    }));
  }

  function buildChatters(): any[] {
    return chatterItems.map((it) => ({
      slug: it.id || genId(),
      title: it.title.trim(),
      date: it.date || today(),
      tags: splitTags(it.tagsText),
      mood: it.mood.trim(),
      cover: it.cover.trim(),
      description: '',
      content: it.content,
    }));
  }

  function buildMoments(): any[] {
    return momentItems.map((it) => ({
      id: it.id || genId(),
      content: it.content,
      date: it.date || today(),
      location: it.location.trim(),
      images: splitLines(it.imagesText),
    }));
  }

  function buildMusic(): any[] {
    return musicItems.map((it) => ({
      id: it.id || genId(),
      title: it.title.trim(),
      artist: it.artist.trim(),
      cover: it.cover.trim(),
      src: it.src.trim(),
      lrcText: it.lrcText,
    }));
  }

  async function save(type: string) {
    setSaving(type);
    setMsg(null);
    const buildMap: Record<string, () => any[]> = {
      albums: buildAlbums,
      projects: buildProjects,
      chatters: buildChatters,
      moments: buildMoments,
      music: buildMusic,
    };
    try {
      const res = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ type, data: buildMap[type]() }),
      });
      const d = await res.json();
      setMsg(d.success ? { type: 'ok', text: d.message } : { type: 'err', text: d.error || '保存失败' });
    } catch (e: any) {
      setMsg({ type: 'err', text: e.message || '保存失败' });
    }
    setSaving(null);
  }

  const inputCls =
    'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500';
  const labelCls = 'block text-xs text-slate-400 mb-1';

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
      <div className="max-w-4xl mx-auto space-y-8">
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
                onClick={() => { navigator.clipboard.writeText(uploadedUrl); setMsg({ type: 'ok', text: 'URL 已复制，可粘贴到下面的输入框' }); }}
                className="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-sm font-bold transition-colors"
              >
                复制
              </button>
            </div>
          )}
        </section>

        {/* 照片墙 */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-white">🖼️ 照片墙</h2>
            <button
              onClick={() => save('albums')}
              disabled={saving === 'albums'}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors"
            >
              {saving === 'albums' ? '提交中...' : '保存并发布'}
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-4">每个相册只需填名称、封面、描述和照片 URL，其余自动生成。</p>
          {albumItems.length === 0 && (
            <p className="text-sm text-slate-500 py-4 text-center border border-dashed border-slate-700 rounded-lg">还没有相册，点击下方按钮添加</p>
          )}
          <div className="space-y-4">
            {albumItems.map((it, idx) => (
              <div key={it.key} className="border border-slate-800 rounded-xl p-4 bg-slate-950/40">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400">相册 {idx + 1}</span>
                  <button onClick={() => setAlbumItems((arr) => arr.filter((x) => x.key !== it.key))} className="text-xs text-red-400 hover:text-red-300">删除</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>名称（相册标题）</label>
                    <input className={inputCls} value={it.title} placeholder="例如：横道世之介" onChange={(e) => upd(setAlbumItems, it.key, { title: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>封面 URL（留空自动取第一张照片）</label>
                    <input className={inputCls} value={it.cover} placeholder="https://..." onChange={(e) => upd(setAlbumItems, it.key, { cover: e.target.value })} />
                  </div>
                </div>
                <div className="mt-3">
                  <label className={labelCls}>描述文字（可选）</label>
                  <input className={inputCls} value={it.description} placeholder="一句话介绍这个相册" onChange={(e) => upd(setAlbumItems, it.key, { description: e.target.value })} />
                </div>
                <div className="mt-3">
                  <label className={labelCls}>照片 URL（每行一张，可写「URL|说明」；日期自动生成）</label>
                  <textarea
                    className="w-full h-28 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-green-300 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={'https://.../1.jpg|海边\nhttps://.../2.jpg'}
                    value={it.photosText}
                    onChange={(e) => upd(setAlbumItems, it.key, { photosText: e.target.value })}
                    spellCheck={false}
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setAlbumItems((arr) => [...arr, { key: genId(), id: '', title: '', cover: '', description: '', date: '', photosText: '' }])}
            className="mt-4 w-full border-2 border-dashed border-slate-700 hover:border-indigo-500 text-slate-400 hover:text-indigo-400 rounded-xl py-3 text-sm font-bold transition-colors"
          >
            ＋ 添加相册
          </button>
        </section>

        {/* 项目 */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-white">🚀 项目</h2>
            <button
              onClick={() => save('projects')}
              disabled={saving === 'projects'}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors"
            >
              {saving === 'projects' ? '提交中...' : '保存并发布'}
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-4">每个项目只需填名称、图标、描述等，其余自动生成。</p>
          {projectItems.length === 0 && (
            <p className="text-sm text-slate-500 py-4 text-center border border-dashed border-slate-700 rounded-lg">还没有项目，点击下方按钮添加</p>
          )}
          <div className="space-y-4">
            {projectItems.map((it, idx) => (
              <div key={it.key} className="border border-slate-800 rounded-xl p-4 bg-slate-950/40">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400">项目 {idx + 1}</span>
                  <button onClick={() => setProjectItems((arr) => arr.filter((x) => x.key !== it.key))} className="text-xs text-red-400 hover:text-red-300">删除</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>名称</label>
                    <input className={inputCls} value={it.name} placeholder="例如：我的第一个项目" onChange={(e) => upd(setProjectItems, it.key, { name: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>图标 / 封面 URL</label>
                    <input className={inputCls} value={it.icon} placeholder="https://...（图片链接）" onChange={(e) => upd(setProjectItems, it.key, { icon: e.target.value })} />
                  </div>
                </div>
                <div className="mt-3">
                  <label className={labelCls}>描述文字</label>
                  <input className={inputCls} value={it.description} placeholder="这个项目是做什么的" onChange={(e) => upd(setProjectItems, it.key, { description: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className={labelCls}>GitHub / 链接（可选）</label>
                    <input className={inputCls} value={it.githubUrl} placeholder="https://github.com/..." onChange={(e) => upd(setProjectItems, it.key, { githubUrl: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>标签（可选，逗号分隔）</label>
                    <input className={inputCls} value={it.tagsText} placeholder="React, Next.js, 开源" onChange={(e) => upd(setProjectItems, it.key, { tagsText: e.target.value })} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setProjectItems((arr) => [...arr, { key: genId(), id: '', name: '', icon: '', description: '', githubUrl: '', tagsText: '' }])}
            className="mt-4 w-full border-2 border-dashed border-slate-700 hover:border-indigo-500 text-slate-400 hover:text-indigo-400 rounded-xl py-3 text-sm font-bold transition-colors"
          >
            ＋ 添加项目
          </button>
        </section>

        {/* 杂谈 */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-white">💬 杂谈</h2>
            <button
              onClick={() => save('chatters')}
              disabled={saving === 'chatters'}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors"
            >
              {saving === 'chatters' ? '提交中...' : '保存并发布'}
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-4">每条杂谈只需填标题、封面、正文等，日期/ID 自动生成。</p>
          {chatterItems.length === 0 && (
            <p className="text-sm text-slate-500 py-4 text-center border border-dashed border-slate-700 rounded-lg">还没有杂谈，点击下方按钮添加</p>
          )}
          <div className="space-y-4">
            {chatterItems.map((it, idx) => (
              <div key={it.key} className="border border-slate-800 rounded-xl p-4 bg-slate-950/40">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400">杂谈 {idx + 1}</span>
                  <button onClick={() => setChatterItems((arr) => arr.filter((x) => x.key !== it.key))} className="text-xs text-red-400 hover:text-red-300">删除</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>标题</label>
                    <input className={inputCls} value={it.title} placeholder="例如：今天的小感想" onChange={(e) => upd(setChatterItems, it.key, { title: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>封面 URL（可选）</label>
                    <input className={inputCls} value={it.cover} placeholder="https://..." onChange={(e) => upd(setChatterItems, it.key, { cover: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className={labelCls}>心情（可选，如：开心）</label>
                    <input className={inputCls} value={it.mood} placeholder="开心 / 平静 / 感慨..." onChange={(e) => upd(setChatterItems, it.key, { mood: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>标签（可选，逗号分隔）</label>
                    <input className={inputCls} value={it.tagsText} placeholder="日常, 电影" onChange={(e) => upd(setChatterItems, it.key, { tagsText: e.target.value })} />
                  </div>
                </div>
                <div className="mt-3">
                  <label className={labelCls}>正文内容（支持多行）</label>
                  <textarea
                    className="w-full h-28 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-green-300 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="写下你的想法..."
                    value={it.content}
                    onChange={(e) => upd(setChatterItems, it.key, { content: e.target.value })}
                    spellCheck={false}
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setChatterItems((arr) => [...arr, { key: genId(), id: '', title: '', cover: '', mood: '', tagsText: '', content: '', date: '' }])}
            className="mt-4 w-full border-2 border-dashed border-slate-700 hover:border-indigo-500 text-slate-400 hover:text-indigo-400 rounded-xl py-3 text-sm font-bold transition-colors"
          >
            ＋ 添加杂谈
          </button>
        </section>

        {/* 说说 */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-white">📝 说说</h2>
            <button
              onClick={() => save('moments')}
              disabled={saving === 'moments'}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors"
            >
              {saving === 'moments' ? '提交中...' : '保存并发布'}
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-4">每条说说只需填内容、地点、图片 URL，日期/ID 自动生成。</p>
          {momentItems.length === 0 && (
            <p className="text-sm text-slate-500 py-4 text-center border border-dashed border-slate-700 rounded-lg">还没有说说，点击下方按钮添加</p>
          )}
          <div className="space-y-4">
            {momentItems.map((it, idx) => (
              <div key={it.key} className="border border-slate-800 rounded-xl p-4 bg-slate-950/40">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400">说说 {idx + 1}</span>
                  <button onClick={() => setMomentItems((arr) => arr.filter((x) => x.key !== it.key))} className="text-xs text-red-400 hover:text-red-300">删除</button>
                </div>
                <div>
                  <label className={labelCls}>内容</label>
                  <textarea
                    className="w-full h-24 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-green-300 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="今天的心情/生活动态..."
                    value={it.content}
                    onChange={(e) => upd(setMomentItems, it.key, { content: e.target.value })}
                    spellCheck={false}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className={labelCls}>地点（可选）</label>
                    <input className={inputCls} value={it.location} placeholder="例如：杭州西湖" onChange={(e) => upd(setMomentItems, it.key, { location: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>日期（留空自动今天）</label>
                    <input className={inputCls} value={it.date} placeholder="2026-08-28" onChange={(e) => upd(setMomentItems, it.key, { date: e.target.value })} />
                  </div>
                </div>
                <div className="mt-3">
                  <label className={labelCls}>图片 URL（每行一张，可选）</label>
                  <textarea
                    className="w-full h-20 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-green-300 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={'https://.../1.jpg\nhttps://.../2.jpg'}
                    value={it.imagesText}
                    onChange={(e) => upd(setMomentItems, it.key, { imagesText: e.target.value })}
                    spellCheck={false}
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setMomentItems((arr) => [...arr, { key: genId(), id: '', content: '', location: '', imagesText: '', date: '' }])}
            className="mt-4 w-full border-2 border-dashed border-slate-700 hover:border-indigo-500 text-slate-400 hover:text-indigo-400 rounded-xl py-3 text-sm font-bold transition-colors"
          >
            ＋ 添加说说
          </button>
        </section>

        {/* 音乐 */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-white">🎵 音乐</h2>
            <button
              onClick={() => save('music')}
              disabled={saving === 'music'}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors"
            >
              {saving === 'music' ? '提交中...' : '保存并发布'}
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-4">每首歌只需填标题、歌手、封面/音频 URL，ID 自动生成。</p>
          {musicItems.length === 0 && (
            <p className="text-sm text-slate-500 py-4 text-center border border-dashed border-slate-700 rounded-lg">还没有歌曲，点击下方按钮添加</p>
          )}
          <div className="space-y-4">
            {musicItems.map((it, idx) => (
              <div key={it.key} className="border border-slate-800 rounded-xl p-4 bg-slate-950/40">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400">歌曲 {idx + 1}</span>
                  <button onClick={() => setMusicItems((arr) => arr.filter((x) => x.key !== it.key))} className="text-xs text-red-400 hover:text-red-300">删除</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>标题</label>
                    <input className={inputCls} value={it.title} placeholder="例如：晴天" onChange={(e) => upd(setMusicItems, it.key, { title: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>歌手</label>
                    <input className={inputCls} value={it.artist} placeholder="例如：周杰伦" onChange={(e) => upd(setMusicItems, it.key, { artist: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className={labelCls}>封面 URL</label>
                    <input className={inputCls} value={it.cover} placeholder="https://...（图片）" onChange={(e) => upd(setMusicItems, it.key, { cover: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>音频 URL</label>
                    <input className={inputCls} value={it.src} placeholder="https://...（mp3）" onChange={(e) => upd(setMusicItems, it.key, { src: e.target.value })} />
                  </div>
                </div>
                <div className="mt-3">
                  <label className={labelCls}>歌词（可选，LRC 时间轴格式）</label>
                  <textarea
                    className="w-full h-24 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-green-300 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={'[00:00.00]晴天 - 周杰伦\n[00:29.26]故事的小黄花'}
                    value={it.lrcText}
                    onChange={(e) => upd(setMusicItems, it.key, { lrcText: e.target.value })}
                    spellCheck={false}
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setMusicItems((arr) => [...arr, { key: genId(), id: '', title: '', artist: '', cover: '', src: '', lrcText: '' }])}
            className="mt-4 w-full border-2 border-dashed border-slate-700 hover:border-indigo-500 text-slate-400 hover:text-indigo-400 rounded-xl py-3 text-sm font-bold transition-colors"
          >
            ＋ 添加歌曲
          </button>
        </section>
      </div>
    </div>
  );
}
