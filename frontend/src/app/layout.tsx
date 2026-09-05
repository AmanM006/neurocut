import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEURO-CUT // Agentic Cinema Hackathon",
  description: "Autonomous Video Editing System with ClickHouse Reward Oracle & Google ADK Showrunner Intervention",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#000000] text-zinc-100 antialiased selection:bg-amber-400 selection:text-black">
        {children}
      </body>
    </html>
  );
}
