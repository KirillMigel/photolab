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
    <div className="bg-white rounded-2xl p-8 space-y-6" style={{ border: '1px solid rgba(38, 37, 30, 0.1)' }}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: '#26251E' }}>Результат</h2>
        
        {processedImage && !isProcessing && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="px-4 py-2 text-sm font-medium rounded-lg transition"
              style={{ 
                background: 'rgba(38, 37, 30, 0.05)',
                color: '#26251E'
              }}
            >
              {showComparison ? 'Только результат' : 'Сравнить'}
            </button>
            <button
              onClick={() => downloadImage(processedImage, 'photolab-result.png')}
              className="px-5 py-2 text-sm font-medium rounded-lg transition"
              style={{ 
                background: '#26251E',
                color: '#F7F7F4'
              }}
            >
              Скачать
            </button>
          </div>
        )}
      </div>

      {/* Images */}
      <div className={`grid gap-6 ${showComparison && originalImage && processedImage ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Original */}
        {showComparison && originalImage && (
          <div className="space-y-3">
            <p className="text-sm font-medium" style={{ color: '#26251E', opacity: 0.6 }}>До</p>
            <div className="relative rounded-xl overflow-hidden" style={{ background: '#F7F7F4' }}>
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
          <div className="space-y-3">
            <p className="text-sm font-medium" style={{ color: '#26251E', opacity: 0.6 }}>После</p>
            <div className="relative rounded-xl overflow-hidden bg-checker">
              {isProcessing ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-2 border-t-transparent" style={{ borderColor: '#26251E', borderTopColor: 'transparent' }}></div>
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
    </div>
  )
}

