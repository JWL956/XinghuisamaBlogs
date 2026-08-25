// 🛡️ 本文件由控制台自动生成，请勿手动修改
export interface Photo { url: string; caption?: string; }
export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }
export const albums: Album[] = [
  {
    id: "daily-life",
    title: "生活记录",
    description: "记录生活中的美好瞬间",
    cover: "/photos/photo1.jpg",
    date: "2026-08-25",
    photos: [
      { url: "/photos/photo1.jpg", caption: "照片1" },
      { url: "/photos/photo2.jpg", caption: "照片2" },
      { url: "/photos/photo3.jpg", caption: "照片3" },
      { url: "/photos/photo4.jpg", caption: "照片4" },
      { url: "/photos/photo5.jpg", caption: "照片5" },
    ],
  },
];
