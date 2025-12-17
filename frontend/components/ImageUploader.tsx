'use client'

import { useCallback, useRef, useState } from 'react'
import { removeBackground } from '@/lib/api'

interface ImageUploaderProps {
  onImageSelect: (image: string) => void
  onProcessed: (image: string) => void
  isProcessing: boolean
  setIsProcessing: (processing: boolean) => void
}

export default function ImageUploader({
  onImageSelect,
  onProcessed,
  isProcessing,
  setIsProcessing,
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

  return (
    <div className="space-y-6">

      {/* Upload Zone - Cursor style */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => {
          handleDragLeave()
          setIsHover(false)
        }}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        onClick={() => {
          if (!isProcessing) inputRef.current?.click()
        }}
        className={`upload-zone border-2 border-dashed rounded-2xl text-center transition cursor-pointer ${
          isDragging || isHover ? 'scale-[1.01]' : ''
        } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
        style={{
          borderColor: isDragging || isHover ? '#26251E' : 'rgba(38, 37, 30, 0.2)',
          background: '#fff',
          minHeight: '380px',
          padding: '60px 80px',
          maxWidth: '640px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
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
        
        <div className="space-y-6">
          {isProcessing ? (
            <div>
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-t-transparent" style={{ borderColor: '#26251E', borderTopColor: 'transparent' }}></div>
              <p className="mt-6 text-base" style={{ color: '#26251E', opacity: 0.6 }}>
                Обрабатываем изображение...
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <img src="/images/upload.svg" alt="Upload" className="w-12 h-12" style={{ opacity: 0.4 }} />
              </div>
              
              <div className="space-y-3">
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
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  )
}

