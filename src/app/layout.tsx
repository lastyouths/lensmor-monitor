import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OneKunDay · 历史快照时光机",
  description: "Reddit 评论历史快照浏览工具",
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
