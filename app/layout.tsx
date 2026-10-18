import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://yanmife-portfolio.com'),
  title: 'Yanmife — UI/UX Designer & Web Developer in Lagos',
  description:
    `Hi, I'm Yanmife. I design and build clean, easy-to-use websites and apps. Based in Lagos, Nigeria. Available for freelance work.`,
  keywords: [
    'UI/UX Designer',
    'Web Developer',
    'Lagos',
    'Nigeria',
    'Figma',
    'Next.js',
    'React',
    'Freelance Designer',
    'Yanmife',
  ],
  authors: [{ name: 'Yanmife' }],
  creator: 'Yanmife',
  openGraph: {
    title: 'Yanmife — UI/UX Designer & Web Developer in Lagos',
    description:
      'I design and build clean, easy-to-use websites and apps. Based in Lagos, Nigeria.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Yanmife',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Yanmife — UI/UX Designer & Web Developer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yanmife — UI/UX Designer & Web Developer',
    description:
      'I design and build clean, easy-to-use websites and apps. Based in Lagos, Nigeria.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
