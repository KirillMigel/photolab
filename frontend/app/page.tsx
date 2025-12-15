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
      {/* Header - Cursor style */}
      <header className="border-b" style={{ borderColor: 'rgba(38, 37, 30, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <img src="/images/logo.svg" alt="Photolab" className="h-6" />
            <button 
              className="px-5 py-2 rounded-lg text-sm font-medium transition"
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

      {/* Hero Section - Clean like Cursor */}
      <section className="max-w-4xl mx-auto px-8 pt-24 pb-16 text-center">
        <h2 
          className="text-7xl font-semibold leading-tight mb-6"
          style={{ color: '#26251E' }}
        >
          Удаление фона
        </h2>
        <p 
          className="text-xl mb-12 max-w-2xl mx-auto"
          style={{ color: '#26251E', opacity: 0.6 }}
        >
          Бесплатно стирайте фоны изображений
        </p>
      </section>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-8 pb-20">
        {/* Upload Interface */}
        <div className="space-y-8">
          <ImageUploader
            onImageSelect={setOriginalImage}
            onProcessed={setProcessedImage}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
          />
          
          {(originalImage || processedImage) && (
            <ImagePreview
              originalImage={originalImage}
              processedImage={processedImage}
              isProcessing={isProcessing}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-20 py-8" style={{ borderColor: 'rgba(38, 37, 30, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-8 text-center text-sm" style={{ color: '#26251E', opacity: 0.5 }}>
          <p>Photolab © 2025</p>
        </div>
      </footer>
    </main>
  )
}

