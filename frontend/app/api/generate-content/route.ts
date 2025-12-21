import { NextRequest, NextResponse } from 'next/server'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

// Промпты для разных платформ и типов контента
const PLATFORM_PROMPTS: Record<string, Record<string, string>> = {
  instagram: {
    post: `You are a social media content creator for Instagram. Generate an engaging Instagram post.

Requirements:
- Write in Russian (unless the topic requires English)
- Make it engaging, authentic, and relatable
- Length: 150-300 words
- Include emojis naturally (2-4 emojis)
- End with a call-to-action or question
- Generate 10-15 relevant hashtags in Russian

Format your response as JSON:
{
  "text": "the post text",
  "hashtags": ["#hashtag1", "#hashtag2", ...]
}`,

    story: `You are a social media content creator for Instagram Stories. Generate a short, engaging Instagram Story text.

Requirements:
- Write in Russian
- Very short: 50-100 words max
- Include 1-2 emojis
- Make it catchy and attention-grabbing
- Generate 5-8 relevant hashtags

Format your response as JSON:
{
  "text": "the story text",
  "hashtags": ["#hashtag1", "#hashtag2", ...]
}`,

    reel: `You are a social media content creator for Instagram Reels. Generate a catchy description for an Instagram Reel.

Requirements:
- Write in Russian
- Short and punchy: 80-150 words
- Include emojis (2-3 emojis)
- Make it engaging and encourage engagement
- Generate 8-12 trending hashtags

Format your response as JSON:
{
  "text": "the reel description",
  "hashtags": ["#hashtag1", "#hashtag2", ...]
}`,
  },

  tiktok: {
    reel: `You are a TikTok content creator. Generate a catchy TikTok video description.

Requirements:
- Write in Russian
- Short and engaging: 50-100 words
- Include 1-2 emojis
- Make it trendy and attention-grabbing
- Generate 5-10 trending TikTok hashtags

Format your response as JSON:
{
  "text": "the video description",
  "hashtags": ["#hashtag1", "#hashtag2", ...]
}`,
  },

  twitter: {
    tweet: `You are a Twitter content creator. Generate a Twitter post (tweet).

Requirements:
- Write in Russian
- Maximum 280 characters (including spaces)
- Make it concise, witty, or informative
- Include 1-2 emojis if appropriate
- Generate 3-5 relevant hashtags

Format your response as JSON:
{
  "text": "the tweet text",
  "hashtags": ["#hashtag1", "#hashtag2", ...]
}`,
  },

  linkedin: {
    post: `You are a LinkedIn content creator. Generate a professional LinkedIn post.

Requirements:
- Write in Russian
- Professional but engaging tone
- Length: 200-400 words
- Include value, insights, or tips
- Use 1-2 emojis sparingly
- Generate 3-5 professional hashtags

Format your response as JSON:
{
  "text": "the post text",
  "hashtags": ["#hashtag1", "#hashtag2", ...]
}`,
  },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { platform, contentType, topic } = body

    if (!platform || !contentType || !topic) {
      return NextResponse.json(
        { error: 'Platform, contentType, and topic are required' },
        { status: 400 }
      )
    }

    const prompt = PLATFORM_PROMPTS[platform]?.[contentType]

    if (!prompt) {
      return NextResponse.json(
        { error: 'Invalid platform or content type' },
        { status: 400 }
      )
    }

    const fullPrompt = `${prompt}

Topic: ${topic}

Generate the content now. Return ONLY valid JSON, no other text.`

    console.log('Generating content for:', { platform, contentType, topic })

    // Если нет API ключа - возвращаем демо-контент
    if (!GROQ_API_KEY) {
      return NextResponse.json({
        text: getDemoContent(platform, contentType, topic),
        hashtags: getDemoHashtags(platform),
      })
    }

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are a professional social media content creator. Always respond with valid JSON only.' },
          { role: 'user', content: fullPrompt },
        ],
        temperature: 0.8,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Groq API error:', errorText)
      
      // Fallback на демо-контент
      return NextResponse.json({
        text: getDemoContent(platform, contentType, topic),
        hashtags: getDemoHashtags(platform),
      })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No content generated')
    }

    // Парсим JSON ответ
    let parsedContent
    try {
      parsedContent = JSON.parse(content)
    } catch {
      // Если не JSON, пытаемся извлечь текст и хештеги
      const lines = content.split('\n').filter(l => l.trim())
      const text = lines.filter(l => !l.startsWith('#')).join('\n')
      const hashtags = lines.filter(l => l.startsWith('#')).map(t => t.trim())
      
      return NextResponse.json({
        text: text || content,
        hashtags: hashtags.length > 0 ? hashtags : getDemoHashtags(platform),
      })
    }

    return NextResponse.json({
      text: parsedContent.text || content,
      hashtags: parsedContent.hashtags || getDemoHashtags(platform),
    })

  } catch (error: any) {
    console.error('Generate content error:', error)
    return NextResponse.json(
      { error: `Failed to generate content: ${error.message}` },
      { status: 500 }
    )
  }
}

// Демо-контент когда нет API ключа
function getDemoContent(platform: string, contentType: string, topic: string): string {
  const demos: Record<string, Record<string, string>> = {
    instagram: {
      post: `Сегодня хочу поделиться с вами темой: ${topic} ✨

Это действительно важная тема, которая заслуживает внимания. Давайте обсудим это вместе!

Что вы думаете об этом? Поделитесь своими мыслями в комментариях 👇`,

      story: `Новая тема: ${topic} 🎯

Свайп вверх, чтобы узнать больше! 👆`,

      reel: `${topic} — это то, о чем нужно говорить! 💪

Ставь лайк, если согласен! ❤️`,
    },
    tiktok: {
      reel: `${topic} — кто со мной? 🔥

#тренды #вирус`,
    },
    twitter: {
      tweet: `${topic} — важная тема, которую нужно обсудить. Что думаете? 💭`,
    },
    linkedin: {
      post: `Сегодня хочу поделиться размышлениями о ${topic}.

Это тема, которая актуальна для многих профессионалов. Давайте обсудим практические аспекты и поделимся опытом.

Какие у вас есть мысли по этому поводу?`,
    },
  }

  return demos[platform]?.[contentType] || `Контент о ${topic}`
}

function getDemoHashtags(platform: string): string[] {
  const hashtags: Record<string, string[]> = {
    instagram: ['#контент', '#инстаграм', '#пост', '#мотивация', '#жизнь', '#интересное', '#полезное', '#тренды'],
    tiktok: ['#tiktok', '#вирус', '#тренды', '#развлечения', '#контент'],
    twitter: ['#твиттер', '#новости', '#обсуждение', '#актуальное'],
    linkedin: ['#linkedin', '#профессионализм', '#бизнес', '#карьера', '#развитие'],
  }

  return hashtags[platform] || ['#контент']
}

