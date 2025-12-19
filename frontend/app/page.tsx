'use client'

import { useState, useRef } from 'react'

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [duration, setDuration] = useState<'5' | '10' | '15'>('5')
  const [resolution, setResolution] = useState<'720p' | '1080p'>('1080p')
  const [isGenerating, setIsGenerating] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  const generateVideo = async () => {
    if (!prompt.trim()) {
      setError('Введите описание видео')
      return
    }

    setIsGenerating(true)
    setError(null)
    setVideoUrl(null)
    setStatus('Отправляем запрос...')

    try {
      // Создаём задачу
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, duration, resolution }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to start generation')
      }

      // Если сразу получили результат
      if (data.videoUrl) {
        setVideoUrl(data.videoUrl)
        setStatus('Готово!')
        setIsGenerating(false)
        return
      }

      // Polling для получения результата
      const taskId = data.taskId
      setStatus('Генерируем видео... Это может занять 1-3 минуты')

      let attempts = 0
      const maxAttempts = 180 // 3 минуты

      while (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 1000))

        const statusResponse = await fetch(`/api/generate-video/${taskId}`)
        const statusData = await statusResponse.json()

        if (statusData.status === 'completed' && statusData.videoUrl) {
          setVideoUrl(statusData.videoUrl)
          setStatus('Готово!')
          setIsGenerating(false)
          return
        }

        if (statusData.status === 'failed') {
          throw new Error(statusData.error || 'Generation failed')
        }

        if (statusData.progress) {
          setStatus(`Генерируем... ${statusData.progress}`)
        }

        attempts++
      }

      throw new Error('Timeout: генерация заняла слишком много времени')

    } catch (err: any) {
      setError(err.message || 'Произошла ошибка')
      setStatus('')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isGenerating) {
      generateVideo()
    }
  }

  return (
    <main className="min-h-screen" style={{ background: '#F7F7F4' }}>
      {/* Header */}
      <header>
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <img src="/images/logo.svg" alt="Photolab" className="h-6" />
            <button
              className="px-5 py-2 rounded-full text-sm font-medium transition"
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

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-8 pt-16 pb-8 text-center">
        <h2
          className="mb-4"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: '42px',
            lineHeight: '1.1',
            letterSpacing: '-0.04em',
            color: '#26251E'
          }}
        >
          Генерация видео из текста
        </h2>
        <p
          className="mb-10 max-w-2xl mx-auto"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            fontSize: '18px',
            lineHeight: '1.5',
            letterSpacing: '-0.02em',
            color: '#26251E',
            opacity: 0.8
          }}
        >
          Опишите видео, которое хотите создать
        </p>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 pb-12">
        {/* Background Image Container */}
        <div
          className="overflow-hidden"
          style={{
            backgroundImage: 'url("/images/bg-upload3.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            minHeight: '480px',
            borderRadius: '4px',
            padding: '60px 40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Text Input */}
          <div
            className="rounded-full flex items-center w-full max-w-2xl shadow-lg"
            style={{
              background: '#FFFFFF',
              padding: '8px 8px 8px 24px',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Опишите видео, например: Кот играет с мячиком на зелёной лужайке"
              disabled={isGenerating}
              className="flex-1 bg-transparent outline-none text-base"
              style={{
                color: '#26251E',
                fontFamily: 'Inter, sans-serif',
              }}
            />
            <button
              onClick={generateVideo}
              disabled={isGenerating || !prompt.trim()}
              className="rounded-full p-3 transition hover:opacity-80 disabled:opacity-50"
              style={{
                background: '#26251E',
                color: '#F7F7F4'
              }}
            >
              {isGenerating ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              )}
            </button>
          </div>

          {/* Settings */}
          <div className="flex justify-center gap-6 mt-6">
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: '#26251E', opacity: 0.7 }}>Длительность:</span>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value as '5' | '10' | '15')}
                disabled={isGenerating}
                className="bg-white rounded-lg px-3 py-2 text-sm border-0 outline-none shadow-sm"
                style={{ color: '#26251E' }}
              >
                <option value="5">5 сек</option>
                <option value="10">10 сек</option>
                <option value="15">15 сек</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: '#26251E', opacity: 0.7 }}>Качество:</span>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as '720p' | '1080p')}
                disabled={isGenerating}
                className="bg-white rounded-lg px-3 py-2 text-sm border-0 outline-none shadow-sm"
                style={{ color: '#26251E' }}
              >
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
              </select>
            </div>
          </div>

          {/* Status */}
          {status && (
            <div className="text-center mt-6">
              <p className="bg-white/80 px-4 py-2 rounded-lg" style={{ color: '#26251E' }}>{status}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center max-w-md">
              {error}
            </div>
          )}
        </div>

        {/* Video Result */}
        {videoUrl && (
          <div className="mt-8">
            <div className="rounded-2xl overflow-hidden bg-black">
              <video
                src={videoUrl}
                controls
                autoPlay
                loop
                className="w-full"
                style={{ maxHeight: '500px' }}
              />
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <a
                href={videoUrl}
                download="generated-video.mp4"
                className="px-6 py-2 rounded-full text-sm font-medium transition hover:opacity-80"
                style={{
                  background: '#26251E',
                  color: '#F7F7F4'
                }}
              >
                ⬇️ Скачать видео
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 py-8">
        <div
          className="max-w-7xl mx-auto px-8 text-center text-sm"
          style={{ color: '#26251E', opacity: 0.5 }}
        >
          <p>Photolab © 2025 • Powered by Wan 2.6</p>
        </div>
      </footer>
    </main>
  )
}
