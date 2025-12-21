import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Photolab - Удаление фона и улучшение качества фото | Бесплатный AI-сервис',
  description: 'Бесплатный AI-сервис для удаления фона и улучшения качества фотографий. Обрабатывайте изображения онлайн за секунды. Без регистрации.',
  keywords: [
    'удаление фона',
    'remove background',
    'улучшение качества фото',
    'upscale изображений',
    'AI обработка изображений',
    'фоторедактор онлайн',
    'бесплатный редактор фото',
    'обработка изображений',
  ],
  authors: [{ name: 'Photolab' }],
  creator: 'Photolab',
  publisher: 'Photolab',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://photolab.vercel.app'),
  openGraph: {
    title: 'Photolab - Удаление фона и улучшение качества фото',
    description: 'Бесплатный AI-сервис для удаления фона и улучшения качества фотографий',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://photolab.vercel.app',
    siteName: 'Photolab',
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Photolab - Удаление фона и улучшение качества фото',
    description: 'Бесплатный AI-сервис для удаления фона и улучшения качества фотографий',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Добавьте здесь коды верификации для Google Search Console, Yandex и т.д.
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#F7F7F4" />
      </head>
      <body>{children}</body>
    </html>
  )
}
