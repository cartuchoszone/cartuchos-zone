import type { Metadata } from 'next';
import './globals.css';
import { SITE_CONFIG } from '@/config/site';

export const metadata: Metadata = {
  title: `${SITE_CONFIG.name} ${SITE_CONFIG.highlightName} | ${SITE_CONFIG.tagline}`,
  description:
    'Explore 326 cartuchos clássicos de Super Nintendo (SNES) e ROM Hacks, filtre por gênero, ano e série, ou carregue sua própria ROM (.sfc/.smc/.zip) para jogar online no navegador.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    title: `${SITE_CONFIG.name} ${SITE_CONFIG.highlightName}`,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="antialiased min-h-screen bg-[#0f0d17] text-gray-100">
        {children}
      </body>
    </html>
  );
}
