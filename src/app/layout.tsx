import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";

const pixel = localFont({
  src: "../fonts/fusion-pixel.woff2",
  variable: "--font-pixel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MetaSelf",
  description: "个人日常与决策数据的 RSI 工作台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${pixel.variable} h-full`}>
      <body className={`${pixel.className} h-full`}>{children}</body>
    </html>
  );
}
