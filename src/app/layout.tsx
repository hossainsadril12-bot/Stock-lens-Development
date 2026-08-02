import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StockLens Admin",
  description: "VantaTrack StockLens — inventory admin (wireframe)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const themeInit = `(function(){try{var t=localStorage.getItem('sl-theme');if(t){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
