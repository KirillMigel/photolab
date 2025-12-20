'use client'

import { useState, useRef, useEffect } from 'react'

// Типы личностей учителя
const PERSONALITIES = [
  {
    id: 'strict',
    name: 'Строгий профессор',
    emoji: '🎓',
    description: 'Исправляет каждую ошибку, требовательный',
    color: '#4A5568',
  },
  {
    id: 'friendly',
    name: 'Дружелюбный бадди',
    emoji: '😊',
    description: 'Поддерживает, хвалит, мотивирует',
    color: '#38A169',
  },
  {
    id: 'sarcastic',
    name: 'Саркастичный ментор',
    emoji: '😏',
    description: 'С юмором, немного дерзкий',
    color: '#9F7AEA',
  },
  {
    id: 'moviestar',
    name: 'Голливудская звезда',
    emoji: '🌟',
    description: 'Говорит как в кино, драматичный',
    color: '#ED8936',
  },
]

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type Personality = typeof PERSONALITIES[number]

export default function Home() {
  const [selectedPersonality, setSelectedPersonality] = useState<Personality | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Прокрутка вниз при новых сообщениях
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Фокус на инпут при выборе личности
  useEffect(() => {
    if (selectedPersonality) {
      inputRef.current?.focus()
    }
  }, [selectedPersonality])

  const sendMessage = async () => {
    if (!input.trim() || !selectedPersonality || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          personality: selectedPersonality.id,
          history: messages.slice(-10), // Последние 10 сообщений для контекста
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (error: any) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Ошибка: ${error.message}. Попробуйте ещё раз.` 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault()
      sendMessage()
    }
  }

  const resetChat = () => {
    setSelectedPersonality(null)
    setMessages([])
    setInput('')
  }

  // Экран выбора личности
  if (!selectedPersonality) {
    return (
      <main className="min-h-screen" style={{ background: '#F7F7F4' }}>
        {/* Header */}
        <header>
          <div className="max-w-7xl mx-auto px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🗣️</span>
                <span 
                  className="font-semibold text-xl"
                  style={{ color: '#26251E', fontFamily: 'Inter, sans-serif' }}
                >
                  SpeakMate
                </span>
              </div>
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
            Выбери своего учителя
          </h1>
          <p
            className="mb-12 max-w-2xl mx-auto"
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
            Каждый учитель имеет свой характер и стиль общения.<br/>
            Практикуй английский так, как тебе комфортно.
          </p>
        </section>

        {/* Personality Cards */}
        <div className="max-w-4xl mx-auto px-8 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PERSONALITIES.map((personality) => (
              <button
                key={personality.id}
                onClick={() => setSelectedPersonality(personality)}
                className="p-6 rounded-2xl text-left transition-all hover:scale-[1.02] hover:shadow-lg"
                style={{ 
                  background: '#FFFFFF',
                  border: '2px solid transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = personality.color
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent'
                }}
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{personality.emoji}</span>
                  <div>
                    <h3 
                      className="font-semibold text-lg mb-1"
                      style={{ color: '#26251E' }}
                    >
                      {personality.name}
                    </h3>
                    <p 
                      className="text-sm"
                      style={{ color: '#26251E', opacity: 0.7 }}
                    >
                      {personality.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="py-8">
          <div className="max-w-7xl mx-auto px-8 text-center text-sm" style={{ color: '#26251E', opacity: 0.5 }}>
            <p>SpeakMate © 2025 — Учи английский с AI</p>
          </div>
        </footer>
      </main>
    )
  }

  // Экран чата
  return (
    <main className="min-h-screen flex flex-col" style={{ background: '#F7F7F4' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: 'rgba(38, 37, 30, 0.1)' }}>
        <div className="max-w-4xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={resetChat}
              className="flex items-center gap-2 hover:opacity-70 transition"
            >
              <span className="text-xl">🗣️</span>
              <span 
                className="font-semibold"
                style={{ color: '#26251E', fontFamily: 'Inter, sans-serif' }}
              >
                SpeakMate
              </span>
            </button>
            
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedPersonality.emoji}</span>
              <span 
                className="font-medium text-sm"
                style={{ color: selectedPersonality.color }}
              >
                {selectedPersonality.name}
              </span>
              <button
                onClick={resetChat}
                className="ml-4 px-3 py-1 rounded-full text-xs transition hover:bg-gray-100"
                style={{ color: '#26251E', opacity: 0.6 }}
              >
                Сменить
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-6">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <span className="text-6xl mb-4 block">{selectedPersonality.emoji}</span>
              <h2 
                className="text-xl font-semibold mb-2"
                style={{ color: '#26251E' }}
              >
                {selectedPersonality.name}
              </h2>
              <p 
                className="text-sm mb-6"
                style={{ color: '#26251E', opacity: 0.6 }}
              >
                Напиши что-нибудь на английском — я помогу улучшить!
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {['Hello, how are you?', 'Tell me about yourself', 'Help me practice'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="px-4 py-2 rounded-full text-sm transition hover:bg-gray-100"
                    style={{ 
                      background: '#FFFFFF', 
                      color: '#26251E',
                      border: '1px solid rgba(38, 37, 30, 0.1)'
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  message.role === 'user' 
                    ? 'rounded-br-md' 
                    : 'rounded-bl-md'
                }`}
                style={{
                  background: message.role === 'user' ? '#26251E' : '#FFFFFF',
                  color: message.role === 'user' ? '#F7F7F4' : '#26251E',
                  boxShadow: message.role === 'assistant' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <p 
                  className="text-sm leading-relaxed whitespace-pre-wrap"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {message.content}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="mb-4 flex justify-start">
              <div
                className="px-4 py-3 rounded-2xl rounded-bl-md"
                style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
              >
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t" style={{ borderColor: 'rgba(38, 37, 30, 0.1)', background: '#FFFFFF' }}>
        <div className="max-w-3xl mx-auto px-8 py-4">
          <div 
            className="flex items-center gap-3 rounded-full px-6 py-3"
            style={{ background: '#F7F7F4' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write in English..."
              disabled={isLoading}
              className="flex-1 bg-transparent outline-none text-base"
              style={{ color: '#26251E', fontFamily: 'Inter, sans-serif' }}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 rounded-full flex items-center justify-center transition hover:opacity-80 disabled:opacity-40"
              style={{ background: '#26251E' }}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F7F7F4" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              )}
            </button>
          </div>
          <p 
            className="text-center text-xs mt-3"
            style={{ color: '#26251E', opacity: 0.4 }}
          >
            Пиши на английском — учитель исправит ошибки и поможет улучшить
          </p>
        </div>
      </div>
    </main>
  )
}
