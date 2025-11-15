import "@/styles/globals.css";
import React from "react";

export const metadata = {
  title: "AI Image Editor",
  description: "AI image editing for creatives and web developers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-gray-50 text-gray-900">
        <div className="min-h-screen flex flex-col">
          <header className="border-b bg-white">
            <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
              <h1 className="text-xl font-semibold">AI Image Editor</h1>
              <a
                href="https://agentic-3c3f9d2d.vercel.app"
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                agentic-3c3f9d2d
              </a>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t bg-white">
            <div className="mx-auto max-w-7xl px-4 py-3 text-sm text-gray-500">
              Built for creatives and developers.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
