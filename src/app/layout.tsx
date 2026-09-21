import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Virtual Lab — Talabalar laboratoriya platformasi',
  description: 'Talabalar uchun virtual laboratoriya va HTML loyihalarini xavfsiz sinash platformasi'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
