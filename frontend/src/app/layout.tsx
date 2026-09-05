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
    <html lang="en" className="dark" style={{ backgroundColor: "#08090a", colorScheme: "dark" }}>
      <body
        className="min-h-screen bg-[#08090a] text-zinc-100 antialiased selection:bg-indigo-500 selection:text-white"
        style={{ backgroundColor: "#08090a" }}
      >
        {children}
      </body>
    </html>
  );
}
