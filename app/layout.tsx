import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://metrika-private-tracker.gnorth-13.chatgpt.site'),
  title: 'Metrika Solo — приватний трекер сесій',
  description: 'Приватний solo-first трекер: сесії, таймер, категорії, цілі та персональні інсайти.',
  manifest: '/manifest.webmanifest',
  applicationName: 'Metrika',
  themeColor: '#172723',
  appleWebApp: { capable: true, title: 'Metrika', statusBarStyle: 'black-translucent' },
  icons: { icon: '/app-icon.svg', apple: '/apple-touch-icon.png' },
  openGraph: {
    title: 'Metrika Solo — приватний трекер твоїх ритмів',
    description: 'Сесії, таймер, категорії, цілі та персональні інсайти — приватно.',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Metrika Solo — приватний трекер твоїх ритмів',
    description: 'Сесії, таймер, категорії, цілі та персональні інсайти — приватно.',
    images: ['/og.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#172723',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
