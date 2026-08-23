import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import TopNav from '@/components/TopNav'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://edufit.nepal'),
  title: {
    default: 'EduFit Nepal — EdTech Readiness Assessment for Schools',
    template: '%s | EduFit Nepal',
  },
  description:
    'EduFit Nepal helps NGOs, municipalities and school networks evaluate whether an EdTech tool is right for their schools — before they spend a budget on it.',
  openGraph: {
    type: 'website',
    siteName: 'EduFit Nepal',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <TopNav />
        <main>{children}</main>
      </body>
    </html>
  )
}
