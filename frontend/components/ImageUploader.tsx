'use client'

import { useCallback, useState } from 'react'
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
    <div className="space-y-4">
      {/* Mode Selector */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
        <span className="text-sm font-medium text-gray-700">Режим:</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            value="quality"
            checked={mode === 'quality'}
            onChange={() => setMode('quality')}
            className="w-4 h-4 text-primary-500"
          />
          <span className="text-sm">Качество (медленнее)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            value="fast"
            checked={mode === 'fast'}
            onChange={() => setMode('fast')}
            className="w-4 h-4 text-primary-500"
          />
          <span className="text-sm">Быстро</span>
        </label>
      </div>

      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`upload-zone border-2 border-dashed rounded-xl p-12 text-center transition ${
          isDragging
            ? 'border-primary-500 bg-primary-50 scale-105'
            : 'border-gray-300 bg-white hover:border-primary-400'
        } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          type="file"
          id="file-input"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={isProcessing}
        />
        
        <div className="space-y-4">
          <div className="text-6xl">📷</div>
          
          {isProcessing ? (
            <div>
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <p className="mt-4 text-gray-600">Обрабатываем изображение...</p>
            </div>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-700">
                Перетащите изображение сюда
              </p>
              <p className="text-sm text-gray-500">или</p>
              <label htmlFor="file-input">
                <span className="inline-block px-6 py-3 bg-primary-500 text-white rounded-lg cursor-pointer hover:bg-primary-600 transition">
                  Выберите файл
                </span>
              </label>
              <p className="text-xs text-gray-400 mt-4">
                PNG, JPEG, WebP до 15 МБ
              </p>
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

