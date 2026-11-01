import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Lora } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const lora = Lora({
  variable: '--font-serif',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SMA Negeri 1 Nusantara | Lembaga Pendidikan Menengah Atas Unggul',
  description: 'Portal Resmi & Sistem Informasi Manajemen SMAN 1 Nusantara - Cerdas, Berkarakter, dan Berdaya Saing Global.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${jakarta.variable} ${lora.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#FAF8F5] text-slate-800 selection:bg-amber-500/30 selection:text-slate-900">
        {children}
      </body>
    </html>
  );
}
