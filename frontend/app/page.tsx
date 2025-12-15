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
    <main className="min-h-screen bg-white">
      {/* Header - Minimalist like Cursor */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-black">
              Photolab
            </h1>
            <nav className="flex gap-8 text-sm">
              <a href="#" className="text-gray-600 hover:text-black transition">Features</a>
              <a href="#" className="text-gray-600 hover:text-black transition">Pricing</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section - Cursor style */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-12 text-center">
        <h2 className="text-6xl font-semibold text-black leading-tight mb-6">
          Удаляйте фон с изображений за секунды
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Загрузите фото и получите профессиональный результат с помощью AI. Быстро, просто, бесплатно.
        </p>
      </section>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        {/* Tabs - Clean minimal style */}
        <div className="flex gap-3 mb-8 justify-center">
          <button
            onClick={() => setActiveTab('single')}
            className={`px-6 py-3 rounded-lg font-medium transition text-sm ${
              activeTab === 'single'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Одно изображение
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`px-6 py-3 rounded-lg font-medium transition text-sm ${
              activeTab === 'batch'
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Пакетная обработка
          </button>
        </div>

        {/* Single Image Mode */}
        {activeTab === 'single' && (
          <div className="space-y-6">
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
        )}

        {/* Batch Mode */}
        {activeTab === 'batch' && (
          <BatchUploader />
        )}
      </div>

      {/* Footer - Minimal */}
      <footer className="border-t border-gray-200 mt-20 py-12">
        <div className="max-w-5xl mx-auto px-6 text-center text-sm text-gray-500">
          <p>Powered by AI • Fast • Free</p>
        </div>
      </footer>
    </main>
  )
}

