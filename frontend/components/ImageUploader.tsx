'use client'

import { useCallback, useRef, useState } from 'react'
import { removeBackground } from '@/lib/api'

interface ImageUploaderProps {
  onImageSelect: (image: string) => void
  onProcessed: (image: string) => void
  isProcessing: boolean
  setIsProcessing: (processing: boolean) => void
  processedImage: string | null
}

export default function ImageUploader({
  onImageSelect,
  onProcessed,
  isProcessing,
  setIsProcessing,
  processedImage,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'quality' | 'fast'>('quality')
  const [isHover, setIsHover] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError('Пожалуйста, загрузите изображение')
        return
      }

      if (file.size > 15 * 1024 * 1024) {
        setError('Файл слишком большой. Максимум 15 МБ')
        return
      }

      setError(null)
      setIsProcessing(true)

      // Показать превью оригинала
      const reader = new FileReader()
      reader.onload = (e) => {
        onImageSelect(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      try {
        const dataUrl = await removeBackground(file, mode)
        onProcessed(dataUrl)
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Ошибка обработки. Попробуйте снова.')
        console.error(err)
      } finally {
        setIsProcessing(false)
      }
    },
    [mode, onImageSelect, onProcessed, setIsProcessing]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

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

  const handleReset = () => {
    onImageSelect('')
    onProcessed('')
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6 w-full">
      {/* Upload Zone / Result Display */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => {
          handleDragLeave()
          setIsHover(false)
        }}
        onMouseEnter={() => !processedImage && setIsHover(true)}
        onMouseLeave={() => !processedImage && setIsHover(false)}
        onClick={() => {
          if (!isProcessing && !processedImage) inputRef.current?.click()
        }}
        className={`border-2 border-dashed rounded-lg text-center transition ${
          processedImage ? '' : 'cursor-pointer'
        } ${
          isDragging || isHover ? 'scale-[1.01]' : ''
        } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
        style={{
          borderColor: isDragging || isHover ? '#26251E' : 'rgba(38, 37, 30, 0.2)',
          background: '#fff',
          minHeight: '380px',
          padding: processedImage ? '40px' : '60px 80px',
          maxWidth: '640px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: processedImage ? 'flex-start' : 'center',
          alignItems: 'center'
        }}
      >
        <input
          ref={inputRef}
          type="file"
          id="file-input"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={isProcessing}
        />
        
        {isProcessing ? (
          <div className="flex flex-col items-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-t-transparent" style={{ borderColor: '#26251E', borderTopColor: 'transparent' }}></div>
            <p className="mt-6 text-base" style={{ color: '#26251E', opacity: 0.6 }}>
              Обрабатываем изображение...
            </p>
          </div>
        ) : processedImage ? (
          // Показываем результат с прозрачным фоном в клеточку
          <div className="w-full flex flex-col items-center space-y-4">
            <div 
              className="w-full rounded-lg overflow-hidden"
              style={{
                backgroundImage: 
                  'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), ' +
                  'linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), ' +
                  'linear-gradient(45deg, transparent 75%, #e5e7eb 75%), ' +
                  'linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                minHeight: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
              }}
            >
              <img
                src={processedImage}
                alt="Processed"
                className="max-w-full max-h-[400px] object-contain"
              />
            </div>
          </div>
        ) : (
          // Показываем зону загрузки
          <>
            <div className="flex justify-center">
              <img src="/images/upload.svg" alt="Upload" className="w-12 h-12" style={{ opacity: 0.4 }} />
            </div>
            
            <div className="space-y-2">
              <p
                className="text-base font-medium"
                style={{ color: isHover ? '#FC8C1D' : '#26251E' }}
              >
                Загрузите фото
              </p>
              <p className="text-sm" style={{ color: '#26251E', opacity: 0.6 }}>
                Или перетащите изображение
              </p>
            </div>
          </>
        )}
      </div>

      {/* Кнопка скачивания (только когда есть результат) */}
      {processedImage && !isProcessing && (
        <div className="flex justify-center gap-3">
          <button
            onClick={() => downloadImage(processedImage, 'photolab-result.png')}
            className="px-6 py-3 rounded-lg font-medium transition hover:opacity-80 flex items-center gap-2"
            style={{ 
              background: '#26251E',
              color: '#F7F7F4'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            Скачать
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 rounded-lg font-medium transition hover:opacity-80 border-2"
            style={{ 
              borderColor: '#26251E',
              color: '#26251E',
              background: 'transparent'
            }}
          >
            Загрузить новое
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  )
}
