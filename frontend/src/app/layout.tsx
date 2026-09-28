import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LocusTriage AI | Intelligent Municipal Hazard Triage System",
  description: "Multimodal AI-assisted civic hazard reporting, spatial urgency triage, and city dispatch operations.",
  keywords: ["civic tech", "hazard triage", "pothole detection", "smart city", "gemini ai", "urban infrastructure"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#fffaf5] text-stone-900 antialiased selection:bg-orange-500/20 selection:text-orange-900">
        {children}
      </body>
    </html>
  );
}
