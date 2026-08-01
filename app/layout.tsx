import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'
import { ConsentBanner } from '@/components/rgpd/ConsentBanner'
import { PwaInstallPrompt } from '@/components/ui/PwaInstallPrompt'

export const metadata: Metadata = {
  title: {
    default: 'TransAfrik — Gestion de transport logistique Afrique',
    template: '%s | TransAfrik',
  },
  description:
    'SaaS de gestion de transport terrestre pour entrepreneurs africains. Gérez vos camions, voyages, chauffeurs et finances en FCFA.',
  keywords: [
    'gestion transport',
    'logistique Afrique',
    'SaaS transport Mali',
    'gestion camions',
    'FCFA',
    'TransAfrik',
  ],
  authors: [{ name: 'TransAfrik' }],
  creator: 'TransAfrik',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: '/',
    siteName: 'TransAfrik',
    title: 'TransAfrik — Gestion de transport logistique Afrique',
    description: 'SaaS de gestion de transport terrestre pour entrepreneurs africains.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TransAfrik',
    description: 'SaaS de gestion de transport terrestre pour entrepreneurs africains.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" data-theme="transafrik" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#F97316" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TransAfrik" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1" />
      </head>
      <body className="font-dmsans bg-bg-base text-text-primary antialiased">
        {children}
        <PwaInstallPrompt />
        <ConsentBanner />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0F1117',
              border: '1px solid #252E42',
              color: '#EDF2FF',
            },
          }}
          richColors
        />
      </body>
    </html>
  )
}
