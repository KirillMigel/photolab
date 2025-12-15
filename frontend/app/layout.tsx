import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Photolab - Удаление фона с изображений',
  description: 'Бесплатный сервис удаления фона с помощью AI. Загружайте изображения и получайте результат за секунды.',
  keywords: ['удаление фона', 'remove background', 'AI', 'обработка изображений', 'фоторедактор'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}

