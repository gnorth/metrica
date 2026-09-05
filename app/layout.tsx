import type { Metadata } from 'next';
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
  title: 'Metrika — приватний трекер звичок',
  description: 'Розумій свої ритми, відстежуй звички та будуй кращі ритуали.',
  openGraph: {
    title: 'Metrika — приватний трекер твоїх ритмів',
    description: 'Розумій свої ритми, відстежуй звички та будуй кращі ритуали.',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Metrika — приватний трекер твоїх ритмів',
    description: 'Розумій свої ритми, відстежуй звички та будуй кращі ритуали.',
    images: ['/og.png'],
  },
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
