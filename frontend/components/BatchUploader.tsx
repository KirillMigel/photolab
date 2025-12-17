'use client'

import { useCallback, useState } from 'react'
import { batchRemoveBackground } from '@/lib/api'

interface BatchResult {
  filename: string
  data_url: string
}

export default function BatchUploader() {
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [mode, setMode] = useState<'quality' | 'fast'>('quality')
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<BatchResult[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const validFiles = Array.from(newFiles).filter((file) => {
      if (!file.type.startsWith('image/')) return false
      if (file.size > 15 * 1024 * 1024) return false
      return true
    })

    setFiles((prev) => [...prev, ...validFiles])
    setError(null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
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
      if (e.target.files) {
        handleFiles(e.target.files)
      }
    },
    [handleFiles]
  )

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const processBatch = async () => {
    if (files.length === 0) return

    setIsProcessing(true)
    setError(null)
    setResults([])

    try {
      const response = await batchRemoveBackground(files, mode)
      setResults(response)
      setIsProcessing(false)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка обработки')
      setIsProcessing(false)
    }
  }

  const downloadAll = () => {
    if (results.length === 0) return
    results.forEach((result) => {
      const link = document.createElement('a')
      link.href = result.data_url
      link.download = result.filename
      link.click()
    })
  }

  return (
    <div className="space-y-6">
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
            disabled={isProcessing}
          />
          <span className="text-sm">Качество</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            value="fast"
            checked={mode === 'fast'}
            onChange={() => setMode('fast')}
            className="w-4 h-4 text-primary-500"
            disabled={isProcessing}
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
          id="batch-file-input"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          className="hidden"
          disabled={isProcessing}
        />
        
        <div className="space-y-4">
          <div className="text-6xl">📁</div>
          <p className="text-lg font-medium text-gray-700">
            Перетащите несколько изображений
          </p>
          <p className="text-sm text-gray-500">или</p>
          <label htmlFor="batch-file-input">
            <span className="inline-block px-6 py-3 bg-primary-500 text-white rounded-lg cursor-pointer hover:bg-primary-600 transition">
              Выберите файлы
            </span>
          </label>
          <p className="text-xs text-gray-400 mt-4">
            PNG, JPEG, WebP до 15 МБ каждый
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">
              Файлов: {files.length}
            </h3>
            {!isProcessing && results.length === 0 && (
              <button
                onClick={processBatch}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
              >
                Обработать все
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-sm text-gray-700 truncate flex-1">
                  {file.name}
                </span>
                <span className="text-xs text-gray-500 mr-2">
                  {(file.size / 1024 / 1024).toFixed(2)} МБ
                </span>
                {!isProcessing && results.length === 0 && (
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress */}
      {isProcessing && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Обрабатываем изображения...
              </span>
              <div className="animate-spin h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              ✅ Готово! ({results.length} файлов)
            </h3>
            <button
              onClick={downloadAll}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
            >
              ⬇️ Скачать все
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {results.map((result, index) => (
              <div key={index} className="space-y-2">
                <div className="relative rounded-lg overflow-hidden bg-checker aspect-square">
                  <img
                    src={result.data_url}
                    alt={result.filename}
                    className="w-full h-full object-contain"
                  />
                </div>
                <a
                  href={result.data_url}
                  download={result.filename}
                  className="block text-xs text-primary-600 hover:text-primary-700 truncate"
                >
                  {result.filename}
                </a>
              </div>
            ))}
          </div>
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

