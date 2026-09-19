import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PagePilot",
  description: "Hybrid workspace combining the flexibility of a document editor with the visual quality of an AI presentation tool on 8.5x11 inch pages.",
  openGraph: {
    title: "PagePilot",
    description: "Hybrid workspace combining the flexibility of a document editor with the visual quality of an AI presentation tool on 8.5x11 inch pages.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&family=Playfair+Display:ital,wght@0,600;0,800;1,400&family=Caveat:wght@600&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"
          crossOrigin="anonymous"
        />
      </head>
      <body className="h-full antialiased font-sans">{children}</body>
    </html>
  );
}