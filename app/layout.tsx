import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Farmodoro — Focus • Grow • Relax",
  description: "A cozy, focus-oriented virtual workspace with a Pomodoro timer, todo list, ambient backgrounds, and lofi music.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Browser extensions add attributes to <html> and <body> before React
    // hydrates; that is not a mismatch of ours, so it is not reported.
    // The flag covers these two elements' own attributes only.
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex h-full flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
