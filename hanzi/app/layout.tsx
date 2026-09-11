import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    metadataBase: new URL("https://hanzi.zhangzhaoxi.be"),
    title: "汉字音韵地图｜3,500 个常用规范汉字拼音表",
    description:
      "用声母与韵母坐标交互探索《通用规范汉字表》一级字表的 3,500 个常用规范汉字，支持搜索与编辑。",
    openGraph: {
      title: "汉字音韵地图",
      description: "把一级字表的 3,500 个常用规范汉字，铺成一张可探索的声音地图。",
      images: ["https://hanzi.zhangzhaoxi.be/og.png"],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "汉字音韵地图",
      description: "声母 × 韵母 × 3,500 常用规范汉字",
      images: ["https://hanzi.zhangzhaoxi.be/og.png"],
    },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
