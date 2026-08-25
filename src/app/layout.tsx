import type { Metadata, Viewport } from 'next'
import './globals.css'
import TopNav from '@/components/TopNav'

export const viewport: Viewport = {
  themeColor: '#D8322A',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://ed-vantage.np'),
  title: {
    default: 'Ed-Vantage — EdTech Readiness Assessment for Schools',
    template: '%s | Ed-Vantage',
  },
  description:
    'Ed-Vantage helps NGOs, municipalities and school networks evaluate whether an EdTech tool is right for their schools — before they spend a budget on it.',
  appleWebApp: {
    capable: true,
    title: 'Ed-Vantage',
    statusBarStyle: 'default',
  },
  openGraph: {
    type: 'website',
    siteName: 'Ed-Vantage',
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
    <html lang="en">
      <body>
        <TopNav />
        <main>{children}</main>
      </body>
    </html>
  )
}
