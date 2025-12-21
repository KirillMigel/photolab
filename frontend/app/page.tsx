'use client'

import { useState } from 'react'

type Platform = 'instagram' | 'tiktok' | 'twitter' | 'linkedin'
type ContentType = 'post' | 'story' | 'reel' | 'tweet'

const PLATFORMS = [
  { id: 'instagram' as Platform, name: 'Instagram', icon: '📷', color: '#E4405F' },
  { id: 'tiktok' as Platform, name: 'TikTok', icon: '🎵', color: '#000000' },
  { id: 'twitter' as Platform, name: 'Twitter', icon: '🐦', color: '#1DA1F2' },
  { id: 'linkedin' as Platform, name: 'LinkedIn', icon: '💼', color: '#0077B5' },
]

const CONTENT_TYPES: Record<Platform, { id: ContentType; name: string }[]> = {
  instagram: [
    { id: 'post', name: 'Пост' },
    { id: 'story', name: 'История' },
    { id: 'reel', name: 'Reels' },
  ],
  tiktok: [
    { id: 'reel', name: 'Видео' },
  ],
  twitter: [
    { id: 'tweet', name: 'Твит' },
  ],
  linkedin: [
    { id: 'post', name: 'Пост' },
  ],
}

type GeneratedContent = {
  text: string
  hashtags: string[]
  platform: Platform
  contentType: ContentType
  timestamp: number
}

export default function Home() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [selectedContentType, setSelectedContentType] = useState<ContentType | null>(null)
  const [topic, setTopic] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [savedPosts, setSavedPosts] = useState<GeneratedContent[]>([])

  const handleGenerate = async () => {
    if (!selectedPlatform || !selectedContentType || !topic.trim()) return

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform,
          contentType: selectedContentType,
          topic: topic.trim(),
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const newContent: GeneratedContent = {
        text: data.text,
        hashtags: data.hashtags || [],
        platform: selectedPlatform,
        contentType: selectedContentType,
        timestamp: Date.now(),
      }

      setGeneratedContent(newContent)
    } catch (error: any) {
      alert(`Ошибка: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = () => {
    if (generatedContent) {
      setSavedPosts([...savedPosts, generatedContent])
      alert('Пост сохранен в планировщик!')
    }
  }

  const handleCopy = (text: string, hashtags: string[]) => {
    const fullText = `${text}\n\n${hashtags.join(' ')}`
    navigator.clipboard.writeText(fullText)
    alert('Скопировано в буфер обмена!')
  }

  const handleReset = () => {
    setSelectedPlatform(null)
    setSelectedContentType(null)
    setTopic('')
    setGeneratedContent(null)
  }

  return (
    <main className="min-h-screen" style={{ background: '#F7F7F4' }}>
      {/* Header */}
      <header>
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✨</span>
              <span 
                className="font-semibold text-xl"
                style={{ color: '#26251E', fontFamily: 'Inter, sans-serif' }}
              >
                ContentAI
              </span>
            </div>
            <div className="flex items-center gap-4">
              {savedPosts.length > 0 && (
                <span 
                  className="text-sm"
                  style={{ color: '#26251E', opacity: 0.6 }}
                >
                  Сохранено: {savedPosts.length}
                </span>
              )}
              <button
                className="px-5 py-2 rounded-full text-sm font-medium transition"
                style={{ background: '#26251E', color: '#F7F7F4' }}
              >
                Войти
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-8 pt-12 pb-8 text-center">
        <h1
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
          Создавай контент с AI
        </h1>
        <p
          className="mb-8 max-w-2xl mx-auto"
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
          Генерируй посты для Instagram, TikTok, Twitter и LinkedIn за секунды
        </p>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 pb-12">
        {!selectedPlatform ? (
          // Выбор платформы
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className="p-6 rounded-2xl text-left transition-all hover:scale-[1.02] hover:shadow-lg"
                style={{ 
                  background: '#FFFFFF',
                  border: '2px solid transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = platform.color
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent'
                }}
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{platform.icon}</span>
                  <span 
                    className="font-semibold text-lg"
                    style={{ color: '#26251E' }}
                  >
                    {platform.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : !selectedContentType ? (
          // Выбор типа контента
          <div>
            <button
              onClick={() => setSelectedPlatform(null)}
              className="mb-6 text-sm flex items-center gap-2 hover:opacity-70 transition"
              style={{ color: '#26251E', opacity: 0.6 }}
            >
              ← Назад
            </button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CONTENT_TYPES[selectedPlatform].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedContentType(type.id)}
                  className="p-6 rounded-2xl text-center transition-all hover:scale-[1.02] hover:shadow-lg"
                  style={{ 
                    background: '#FFFFFF',
                    border: '2px solid rgba(38, 37, 30, 0.1)',
                  }}
                >
                  <span 
                    className="font-semibold text-lg"
                    style={{ color: '#26251E' }}
                  >
                    {type.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Генерация контента
          <div>
            <button
              onClick={handleReset}
              className="mb-6 text-sm flex items-center gap-2 hover:opacity-70 transition"
              style={{ color: '#26251E', opacity: 0.6 }}
            >
              ← Начать заново
            </button>

            <div className="bg-white rounded-2xl p-8 shadow-sm">
              {/* Информация о выборе */}
              <div className="flex items-center gap-3 mb-6 pb-6 border-b" style={{ borderColor: 'rgba(38, 37, 30, 0.1)' }}>
                <span className="text-2xl">
                  {PLATFORMS.find(p => p.id === selectedPlatform)?.icon}
                </span>
                <div>
                  <p 
                    className="font-semibold"
                    style={{ color: '#26251E' }}
                  >
                    {PLATFORMS.find(p => p.id === selectedPlatform)?.name}
                  </p>
                  <p 
                    className="text-sm"
                    style={{ color: '#26251E', opacity: 0.6 }}
                  >
                    {CONTENT_TYPES[selectedPlatform].find(t => t.id === selectedContentType)?.name}
                  </p>
                </div>
              </div>

              {/* Поле ввода темы */}
              <div className="mb-6">
                <label 
                  className="block mb-2 text-sm font-medium"
                  style={{ color: '#26251E' }}
                >
                  О чем пост?
                </label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Например: новый продукт, полезный совет, мотивационная цитата..."
                  className="w-full p-4 rounded-lg border-2 outline-none resize-none"
                  style={{ 
                    borderColor: 'rgba(38, 37, 30, 0.2)',
                    color: '#26251E',
                    fontFamily: 'Inter, sans-serif',
                    minHeight: '100px'
                  }}
                  disabled={isGenerating}
                />
              </div>

              {/* Кнопка генерации */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim()}
                className="w-full py-4 rounded-lg font-medium transition hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: '#26251E', color: '#F7F7F4' }}
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Генерируем контент...
                  </>
                ) : (
                  <>
                    ✨ Сгенерировать контент
                  </>
                )}
              </button>

              {/* Сгенерированный контент */}
              {generatedContent && (
                <div className="mt-8 pt-8 border-t" style={{ borderColor: 'rgba(38, 37, 30, 0.1)' }}>
                  <div className="mb-4">
                    <p 
                      className="text-sm font-medium mb-2"
                      style={{ color: '#26251E', opacity: 0.6 }}
                    >
                      Текст поста:
                    </p>
                    <div 
                      className="p-4 rounded-lg"
                      style={{ background: '#F7F7F4', color: '#26251E' }}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{generatedContent.text}</p>
                    </div>
                  </div>

                  {generatedContent.hashtags.length > 0 && (
                    <div className="mb-6">
                      <p 
                        className="text-sm font-medium mb-2"
                        style={{ color: '#26251E', opacity: 0.6 }}
                      >
                        Хештеги:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {generatedContent.hashtags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-full text-sm"
                            style={{ background: '#F7F7F4', color: '#26251E' }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Действия */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleCopy(generatedContent.text, generatedContent.hashtags)}
                      className="flex-1 py-3 rounded-lg font-medium transition hover:opacity-80"
                      style={{ background: '#26251E', color: '#F7F7F4' }}
                    >
                      📋 Копировать
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex-1 py-3 rounded-lg font-medium transition hover:opacity-80 border-2"
                      style={{ 
                        borderColor: '#26251E', 
                        color: '#26251E',
                        background: 'transparent'
                      }}
                    >
                      💾 Сохранить
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-8">
        <div className="max-w-7xl mx-auto px-8 text-center text-sm" style={{ color: '#26251E', opacity: 0.5 }}>
          <p>ContentAI © 2025 — Создавай контент с помощью AI</p>
        </div>
      </footer>
    </main>
  )
}
