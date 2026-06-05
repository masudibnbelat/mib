// layout.tsx
import type { Metadata } from "next";
import { Audiowide, Geist, Geist_Mono, Rubik } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/src/providers/ThemeProvider";
import QueryProvider from "@/src/providers/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
});

export const audiowide = Audiowide({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-audiowide",
});

export const metadata: Metadata = {
  title: "Masud ibn Belat",
  description: "Created by mib",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${rubik.variable} ${audiowide.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('theme');
                  document.documentElement.setAttribute(
                    'data-theme',
                    t === 'light' || t === 'dark' ? t : 'dark'
                  );
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-(--color-bg) text-(--color-text) container mx-auto">
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
