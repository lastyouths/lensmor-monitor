import type { Metadata } from "next";
import { Toaster } from "sonner";
import { GlobalChatProvider } from "../components/GlobalChat";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lensmor Monitor",
  description: "AI 驱动的竞争对手监控平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <GlobalChatProvider>
          {children}
          <Toaster position="top-right" richColors />
        </GlobalChatProvider>
      </body>
    </html>
  );
}
