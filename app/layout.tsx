import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'Prometrix - AI Prompt Engineering Command Center',
  description: 'An AI-powered prompt engineering command center for developers. Write, refine, and optimize prompts with precision.',
  icons: {
    icon: '/favicon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#1a1a2e',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'oklch(0.18 0.015 260)',
              border: '1px solid oklch(0.24 0.02 260)',
              color: 'oklch(0.95 0.01 260)',
            },
          }}
        />
        <Analytics />
      </body>
    </html>
  )
}
