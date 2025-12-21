'use client'

import { useState } from 'react'
import ImageUploader from '@/components/ImageUploader'
import ImagePreview from '@/components/ImagePreview'
import QualityEnhancer from '@/components/QualityEnhancer'

type Tab = 'remove-bg' | 'quality-enhance'

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('remove-bg')
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    setOriginalImage(null)
    setProcessedImage(null)
  }

  return (
    <main className="min-h-screen" style={{ background: '#F7F7F4' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: 'rgba(38, 37, 30, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <img src="/images/logo.svg" alt="Photolab" className="h-6" />
            
            {/* Navigation Tabs */}
            <nav className="flex items-center gap-2">
              <button
                onClick={() => handleTabChange('remove-bg')}
                className="px-4 py-2 rounded-full text-sm font-medium transition"
                style={{
                  background: activeTab === 'remove-bg' ? '#26251E' : 'transparent',
                  color: activeTab === 'remove-bg' ? '#F7F7F4' : '#26251E',
                  opacity: activeTab === 'remove-bg' ? 1 : 0.7
                }}
              >
                Удаление фона
              </button>
              <button
                onClick={() => handleTabChange('quality-enhance')}
                className="px-4 py-2 rounded-full text-sm font-medium transition flex items-center gap-1.5"
                style={{
                  background: activeTab === 'quality-enhance' ? '#26251E' : 'transparent',
                  color: activeTab === 'quality-enhance' ? '#F7F7F4' : '#26251E',
                  opacity: activeTab === 'quality-enhance' ? 1 : 0.7
                }}
              >
                <span>📸</span>
                <span>Улучшение качества</span>
              </button>
            </nav>

            <button
              className="px-5 py-2 rounded-full text-sm font-medium transition hover:opacity-80"
              style={{
                background: '#26251E',
                color: '#F7F7F4'
              }}
            >
              Войти
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-8 pt-16 pb-8 text-center">
        <h1
          className="mb-4"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: '42px',
            lineHeight: '1.1',
            letterSpacing: '-0.04em',
            color: '#26251E'
          }}
        >
          {activeTab === 'remove-bg' ? 'Удаление фона' : 'Улучшение качества'}
        </h1>
        <p
          className="mb-10 max-w-2xl mx-auto"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: '18px',
            lineHeight: '1.5',
            letterSpacing: '-0.02em',
            color: '#26251E',
            opacity: 0.8
          }}
        >
          {activeTab === 'remove-bg' 
            ? 'Бесплатно стирайте фоны изображений с помощью AI'
            : 'Увеличьте разрешение и улучшите качество ваших фотографий'}
        </p>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 pb-12 -mt-8">
        <div
          className="overflow-hidden"
          style={{
            backgroundImage: 'url("/images/bg-upload3.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            minHeight: '580px',
            padding: '80px',
            borderRadius: '4px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {activeTab === 'remove-bg' ? (
            <ImageUploader
              onImageSelect={setOriginalImage}
              onProcessed={setProcessedImage}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            />
          ) : (
            <QualityEnhancer
              onImageSelect={setOriginalImage}
              onProcessed={setProcessedImage}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            />
          )}
        </div>

        {(originalImage || processedImage) && (
          <div className="mt-8">
            <ImagePreview
              originalImage={originalImage}
              processedImage={processedImage}
              isProcessing={isProcessing}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t" style={{ borderColor: 'rgba(38, 37, 30, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center text-sm mb-4" style={{ color: '#26251E', opacity: 0.5 }}>
            <p>Photolab © 2025</p>
          </div>
          <div className="flex justify-center gap-6 text-xs" style={{ color: '#26251E', opacity: 0.4 }}>
            <a href="#" className="hover:opacity-70 transition">Политика конфиденциальности</a>
            <a href="#" className="hover:opacity-70 transition">Условия использования</a>
            <a href="#" className="hover:opacity-70 transition">Контакты</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
