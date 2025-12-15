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
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-gray-900">
            ✨ Photolab
          </h1>
          <p className="text-gray-600 mt-1">
            Удаление фона с изображений за секунды
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('single')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeTab === 'single'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Одно изображение
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeTab === 'batch'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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

      {/* Footer */}
      <footer className="border-t mt-16 py-8 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-600">
          <p>Сделано с помощью AI • Быстро • Бесплатно</p>
          <p className="text-sm mt-2">
            Powered by Replicate & FastAPI
          </p>
        </div>
      </footer>
    </main>
  )
}

