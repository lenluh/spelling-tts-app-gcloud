import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spelling Practice (Grades 1–4)",
  description: "Kid-friendly spelling practice with US-only browser TTS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
