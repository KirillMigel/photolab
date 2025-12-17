'use client'

import { useState } from 'react'
import ImageUploader from '@/components/ImageUploader'
import ImagePreview from '@/components/ImagePreview'
import BatchUploader from '@/components/BatchUploader'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single')
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  return (
    <main className="min-h-screen" style={{ background: '#F7F7F4' }}>
      {/* Header */}
      <header>
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <img src="/images/logo.svg" alt="Photolab" className="h-6" />
            <button
              className="px-5 py-2 rounded-full text-sm font-medium transition"
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
        <h2
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
          Удаление фона
        </h2>
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
          Бесплатно стирайте фоны изображений
        </p>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 pb-12 -mt-8">
        <div
          className="overflow-hidden"
          style={{
            backgroundImage: 'url("/images/bg-upload.png")',
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
          <ImageUploader
            onImageSelect={setOriginalImage}
            onProcessed={setProcessedImage}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
          />
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
      <footer className="mt-16 py-8">
        <div
          className="max-w-7xl mx-auto px-8 text-center text-sm"
          style={{ color: '#26251E', opacity: 0.5 }}
        >
          <p>Photolab © 2025</p>
        </div>
      </footer>
    </main>
  )
}

