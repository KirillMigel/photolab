'use client'

import { useCallback, useRef, useState } from 'react'

interface ProductEnhancerProps {
  onImageSelect: (image: string) => void
  onProcessed: (image: string) => void
  isProcessing: boolean
  setIsProcessing: (processing: boolean) => void
}

export default function ProductEnhancer({
  onImageSelect,
  onProcessed,
  isProcessing,
  setIsProcessing,
}: ProductEnhancerProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('professional product photography, studio lighting, clean white background, high quality')
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
        const formData = new FormData()
        formData.append('image', file)
        formData.append('prompt', prompt)

        const response = await fetch('/api/enhance-product', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(error.error || 'Failed to enhance product')
        }

        const data = await response.json()

        if (data.url) {
          onProcessed(data.url)
        } else if (data.taskId) {
          // Если асинхронная обработка, опрашиваем статус
          let attempts = 0
          const maxAttempts = 60

          const pollStatus = async () => {
            while (attempts < maxAttempts) {
              await new Promise(r => setTimeout(r, 2000))

              const statusResponse = await fetch(`/api/enhance-product/${data.taskId}`)
              const statusData = await statusResponse.json()

              if (statusData.status === 'completed' && statusData.url) {
                onProcessed(statusData.url)
                return
              }

              if (statusData.status === 'failed') {
                throw new Error(statusData.error || 'Enhancement failed')
              }

              attempts++
            }

            throw new Error('Timeout: обработка заняла слишком много времени')
          }

          await pollStatus()
        } else {
          throw new Error('Unexpected response format')
        }
      } catch (err: any) {
        setError(err.message || 'Ошибка обработки. Попробуйте снова.')
        console.error(err)
      } finally {
        setIsProcessing(false)
      }
    },
    [prompt, onImageSelect, onProcessed, setIsProcessing]
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
      {/* Промпт для улучшения */}
      <div>
        <label 
          className="block mb-2 text-sm font-medium"
          style={{ color: '#26251E' }}
        >
          Описание улучшения (опционально):
        </label>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="professional product photography, studio lighting..."
          className="w-full p-3 rounded-lg border-2 outline-none"
          style={{ 
            borderColor: 'rgba(38, 37, 30, 0.2)',
            color: '#26251E',
            fontFamily: 'Inter, sans-serif'
          }}
          disabled={isProcessing}
        />
        <p 
          className="mt-1 text-xs"
          style={{ color: '#26251E', opacity: 0.5 }}
        >
          Опишите, как улучшить изображение продукта
        </p>
      </div>

      {/* Upload Zone */}
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
        className={`upload-zone border-2 border-dashed rounded-lg text-center transition cursor-pointer ${
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
                Улучшаем изображение продукта...
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <span className="text-5xl">✨</span>
              </div>
              
              <div className="space-y-2">
                <p
                  className="text-base font-medium"
                  style={{ color: isHover ? '#FC8C1D' : '#26251E' }}
                >
                  Загрузите фото продукта
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

