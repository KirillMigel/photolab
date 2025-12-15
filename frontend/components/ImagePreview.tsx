'use client'

import { useState } from 'react'

interface ImagePreviewProps {
  originalImage: string | null
  processedImage: string | null
  isProcessing: boolean
}

export default function ImagePreview({
  originalImage,
  processedImage,
  isProcessing,
}: ImagePreviewProps) {
  const [showComparison, setShowComparison] = useState(true)

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('Download error:', err)
    }
  }

  if (!originalImage && !processedImage) return null

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Результат</h2>
        
        {processedImage && !isProcessing && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              {showComparison ? 'Только результат' : 'Сравнить'}
            </button>
            <button
              onClick={() => downloadImage(processedImage, 'photolab-result.png')}
              className="px-4 py-2 text-sm bg-primary-500 text-white hover:bg-primary-600 rounded-lg transition"
            >
              ⬇️ Скачать
            </button>
          </div>
        )}
      </div>

      {/* Images */}
      <div className={`grid gap-4 ${showComparison && originalImage && processedImage ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Original */}
        {showComparison && originalImage && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">До</p>
            <div className="relative rounded-lg overflow-hidden bg-gray-100">
              <img
                src={originalImage}
                alt="Original"
                className="w-full h-auto"
              />
            </div>
          </div>
        )}

        {/* Processed */}
        {processedImage && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">После</p>
            <div className="relative rounded-lg overflow-hidden bg-checker">
              {isProcessing ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
              ) : (
                <img
                  src={processedImage}
                  alt="Processed"
                  className="w-full h-auto"
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      {processedImage && !isProcessing && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            ✅ Фон успешно удалён! Изображение сохранено в формате PNG с прозрачным фоном.
          </p>
        </div>
      )}
    </div>
  )
}

