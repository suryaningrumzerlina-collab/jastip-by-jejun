import type { Metadata, Viewport } from 'next'
import { Nunito_Sans } from 'next/font/google'
import { PwaInstallBanner } from '@/components/pwa/PwaInstallBanner'
import './globals.css'

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['700', '900'],
  variable: '--font-nunito-sans',
  display: 'swap',
})

export const viewport: Viewport = {
  themeColor: '#FAF5EB',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'Admin — Jastip by Jejun',
  description: 'Aplikasi admin pencatatan pesanan dan pengiriman Jastip by Jejun',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Jastip Jejun',
  },
  icons: {
    apple: '/icons/icon-192.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={nunitoSans.variable}>
      <body className="font-sans antialiased bg-[#FAF5EB] text-[#2D3436] min-h-dvh selection:bg-[#FFE66D] selection:text-[#2D3436]">
        {children}
        <PwaInstallBanner />
      </body>
    </html>
  )
}