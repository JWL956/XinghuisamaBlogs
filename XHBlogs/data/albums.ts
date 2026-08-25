// 🛡️ 本文件由控制台自动生成，请勿手动修改
export interface Photo { url: string; caption?: string; }
export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }
export const albums: Album[] = [
  {
    id: "daily-life",
    title: "生活记录",
    description: "记录生活中的美好瞬间",
    cover: "https://aka.doubaocdn.com/s/FYbyeln2qK",
    date: "2026-08-25",
    photos: [
      { url: "https://aka.doubaocdn.com/s/FYbyeln2qK", caption: "照片1" },
      { url: "https://aka.doubaocdn.com/s/jaUO3JU3RB", caption: "照片2" },
      { url: "https://aka.doubaocdn.com/s/Z8CUMbnIRi", caption: "照片3" },
      { url: "https://aka.doubaocdn.com/s/GioZdwfBhc", caption: "照片4" },
      { url: "https://aka.doubaocdn.com/s/jFuUYgCv8z", caption: "照片5" },
    ],
  },
];
