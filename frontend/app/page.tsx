'use client'

import { useState, useRef } from 'react'

type AspectRatio = '3:2' | '2:3' | '1:1'
type Mode = 'normal' | 'fun' | 'spicy'

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('3:2')
  const [mode, setMode] = useState<Mode>('normal')
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
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, aspectRatio, mode }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to start generation')
      }

      if (data.videoUrl) {
        setVideoUrl(data.videoUrl)
        setStatus('')
        setIsGenerating(false)
        return
      }

      const taskId = data.taskId
      setStatus('Генерируем видео... Это может занять 1-3 минуты')

      let attempts = 0
      const maxAttempts = 180

      while (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 2000))

        const statusResponse = await fetch(`/api/generate-video/${taskId}`)
        const statusData = await statusResponse.json()

        if (statusData.status === 'completed' && statusData.videoUrl) {
          setVideoUrl(statusData.videoUrl)
          setStatus('')
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

  // Если есть видео — показываем другой layout
  if (videoUrl) {
    return (
      <main className="min-h-screen" style={{ background: '#F7F7F4' }}>
        {/* Header */}
        <header>
          <div className="max-w-7xl mx-auto px-8 py-6">
            <div className="flex items-center justify-between">
              <img src="/images/logo-videolab.svg" alt="Videolab" className="h-6" />
              <button
                className="px-5 py-2 rounded-full text-sm font-medium transition"
                style={{ background: '#26251E', color: '#F7F7F4' }}
              >
                Войти
              </button>
            </div>
          </div>
        </header>

        {/* Video Result */}
        <div className="max-w-4xl mx-auto px-8 pt-8 pb-4">
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
        </div>

        {/* Input Below Video */}
        <div className="max-w-4xl mx-auto px-8 pb-12">
          <div className="flex items-center gap-3">
            {/* Input Field */}
            <div
              className="rounded-full flex items-center flex-1 shadow-sm"
              style={{
                background: '#FFFFFF',
                padding: '6px 6px 6px 24px',
                border: '1px solid #E5E5E5',
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Введите новый запрос..."
                disabled={isGenerating}
                className="flex-1 bg-transparent outline-none text-base"
                style={{ color: '#26251E', fontFamily: 'Inter, sans-serif' }}
              />
              
              {/* Aspect Ratio Dropdown */}
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                disabled={isGenerating}
                className="bg-gray-100 rounded-full px-3 py-2 text-sm border-0 outline-none cursor-pointer mr-2"
                style={{ color: '#26251E', fontFamily: 'Inter, sans-serif' }}
              >
                <option value="3:2">16:9</option>
                <option value="2:3">9:16</option>
                <option value="1:1">1:1</option>
              </select>

              {/* Generate Button */}
              <button
                onClick={generateVideo}
                disabled={isGenerating || !prompt.trim()}
                className="rounded-full px-4 py-2 text-sm font-medium transition hover:opacity-80 disabled:opacity-50 flex items-center gap-2"
                style={{ background: '#26251E', color: '#F7F7F4' }}
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Генерируем...
                  </>
                ) : (
                  <>
                    Сделать видео
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 19V5M5 12l7-7 7 7"/>
                    </svg>
                  </>
                )}
              </button>
            </div>

            {/* Download Button */}
            <a
              href={videoUrl}
              download="generated-video.mp4"
              className="rounded-full p-3 transition hover:bg-gray-100"
              style={{ border: '1px solid #E5E5E5', background: '#FFFFFF' }}
              title="Скачать видео"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#26251E" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
            </a>

            {/* Share Button */}
            <button
              className="rounded-full p-3 transition hover:bg-gray-100"
              style={{ border: '1px solid #E5E5E5', background: '#FFFFFF' }}
              title="Поделиться"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: 'Видео от Videolab', url: videoUrl })
                } else {
                  navigator.clipboard.writeText(videoUrl)
                  alert('Ссылка скопирована!')
                }
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#26251E" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>
              </svg>
            </button>
          </div>

          {status && (
            <div className="text-center mt-4">
              <p style={{ color: '#26251E', opacity: 0.7 }}>{status}</p>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-16 py-8">
          <div className="max-w-7xl mx-auto px-8 text-center text-sm" style={{ color: '#26251E', opacity: 0.5 }}>
            <p>Videolab © 2025</p>
          </div>
        </footer>
      </main>
    )
  }

  // Начальный экран — без видео
  return (
    <main className="min-h-screen" style={{ background: '#F7F7F4' }}>
      {/* Header */}
      <header>
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <img src="/images/logo-videolab.svg" alt="Videolab" className="h-6" />
            <button
              className="px-5 py-2 rounded-full text-sm font-medium transition"
              style={{ background: '#26251E', color: '#F7F7F4' }}
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
        <div
          className="overflow-hidden"
          style={{
            backgroundImage: 'url("/images/bg-upload3.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            backgroundRepeat: 'no-repeat',
            minHeight: '540px',
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
            className="rounded-full flex items-center w-full max-w-xl shadow-lg"
            style={{ background: '#FFFFFF', padding: '6px 6px 6px 24px' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Кот играет на балалайке"
              disabled={isGenerating}
              className="flex-1 bg-transparent outline-none text-base"
              style={{ color: '#26251E', fontFamily: 'Inter, sans-serif' }}
            />
            
            {/* Aspect Ratio Selector */}
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
              disabled={isGenerating}
              className="bg-gray-100 rounded-full px-4 py-2 text-sm border-0 outline-none cursor-pointer mr-2"
              style={{ color: '#26251E', fontFamily: 'Inter, sans-serif' }}
            >
              <option value="3:2">16:9</option>
              <option value="2:3">9:16</option>
              <option value="1:1">1:1</option>
            </select>

            <button
              onClick={generateVideo}
              disabled={isGenerating || !prompt.trim()}
              className="transition hover:opacity-80 disabled:opacity-50 flex-shrink-0"
            >
              {isGenerating ? (
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#26251E' }}>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <img src="/images/send-icon.svg" alt="Send" className="w-8 h-8" />
              )}
            </button>
          </div>

          {status && (
            <div className="text-center mt-6">
              <p className="bg-white/90 px-4 py-2 rounded-lg shadow-sm" style={{ color: '#26251E' }}>{status}</p>
            </div>
          )}

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center max-w-md">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 py-8">
        <div className="max-w-7xl mx-auto px-8 text-center text-sm" style={{ color: '#26251E', opacity: 0.5 }}>
          <p>Videolab © 2025</p>
        </div>
      </footer>
    </main>
  )
}
