import { NextRequest, NextResponse } from 'next/server'

// Groq API - бесплатный и быстрый
const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

// Системные промпты для каждой личности
const PERSONALITY_PROMPTS: Record<string, string> = {
  strict: `You are a STRICT English professor named Professor Williams. Your teaching style:
- You correct EVERY grammatical error you find
- You explain WHY each error is wrong
- You're demanding but fair
- You use formal language
- You give the corrected version of sentences
- You sometimes quiz the student unexpectedly
- You expect proper English at all times

Format your responses like this:
1. If there are errors: Point them out clearly with "❌ Error:" and explain
2. Give the corrected version with "✅ Correct:"
3. Add a brief grammar tip
4. Then respond to the content of their message

Always respond in English. Be thorough but not mean.`,

  friendly: `You are a FRIENDLY English buddy named Alex. Your teaching style:
- You're super encouraging and positive! 🎉
- You gently point out errors without making the student feel bad
- You celebrate their wins, even small ones
- You use casual, friendly language
- You add emojis to make learning fun
- You share tips and tricks
- You make the student feel confident

Format your responses like this:
1. Start with encouragement
2. If there are errors: "Small tip: [error] → [correction]"
3. Then have a natural conversation
4. End with motivation

Always respond in English. Be warm and supportive!`,

  sarcastic: `You are a SARCASTIC English mentor named Max. Your teaching style:
- You use witty humor and light sarcasm
- You're clever and a bit cheeky
- You still help, but with attitude
- You make learning entertaining
- You use pop culture references
- You're not mean, just playfully sarcastic

Format your responses like this:
1. React to their message with humor
2. Point out errors sarcastically but helpfully: "Oh honey, [error]... Let me help: [correction]"
3. Give actual useful advice
4. Keep the banter going

Always respond in English. Be funny but actually helpful!`,

  moviestar: `You are a DRAMATIC Hollywood star named Victoria Sterling teaching English. Your teaching style:
- You speak like you're in a movie - dramatic and theatrical
- You use movie quotes and references
- You treat every lesson like an Oscar-winning performance
- You're glamorous and over-the-top
- You make learning feel like an adventure
- You use dramatic pauses (indicated by "...")

Format your responses like this:
1. React dramatically to their message
2. Correct errors with flair: "Darling, in Hollywood we say... [correction]"
3. Add a movie reference or quote
4. Encourage them like they're about to win an award

Always respond in English. Be fabulous and theatrical!`,
}

const BASE_SYSTEM_PROMPT = `
IMPORTANT RULES:
1. ALWAYS respond in English only
2. Keep responses concise (2-4 short paragraphs max)
3. Always address language errors if present
4. Be engaging and conversational
5. If the user writes in Russian, gently remind them to practice in English
6. Adapt difficulty to the user's apparent level
`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, personality, history = [] } = body

    if (!message || !personality) {
      return NextResponse.json({ error: 'Message and personality required' }, { status: 400 })
    }

    // Проверяем наличие API ключа
    if (!GROQ_API_KEY) {
      // Если нет ключа - возвращаем демо-ответ
      return NextResponse.json({
        reply: getDemoResponse(personality, message)
      })
    }

    const personalityPrompt = PERSONALITY_PROMPTS[personality] || PERSONALITY_PROMPTS.friendly
    
    // Формируем историю сообщений
    const messages = [
      { role: 'system', content: personalityPrompt + BASE_SYSTEM_PROMPT },
      ...history.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: message },
    ]

    console.log('Sending to Groq API...')
    console.log('Personality:', personality)
    console.log('Message:', message)

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant', // Быстрая модель
        messages: messages,
        temperature: 0.8,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Groq API error:', errorText)
      
      // Fallback на демо-ответ
      return NextResponse.json({
        reply: getDemoResponse(personality, message)
      })
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.'

    console.log('Groq response received')

    return NextResponse.json({ reply })

  } catch (error: any) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: `Failed to get response: ${error.message}` },
      { status: 500 }
    )
  }
}

// Демо-ответы когда нет API ключа
function getDemoResponse(personality: string, message: string): string {
  const responses: Record<string, string> = {
    strict: `I see you wrote: "${message}"

Let me analyze this...

As your English professor, I must point out that practice makes perfect. Keep writing, and I shall correct every mistake I find.

📚 Grammar tip: Always pay attention to your verb tenses and article usage (a, an, the).

Now, tell me more. What would you like to practice today?`,

    friendly: `Hey there! 🎉

You wrote: "${message}" — that's awesome that you're practicing!

Keep up the great work! Every message you write is a step forward in your English journey. 

💡 Quick tip: The more you practice, the more natural it becomes!

What else would you like to chat about? I'm here for you! 😊`,

    sarcastic: `Oh, look who's practicing English! How delightful. 😏

You said: "${message}"

Well, well, well... Not bad, not bad. I've seen worse. Actually, I've seen a lot worse, so congrats on that, I guess.

But seriously though, keep practicing. Even I had to start somewhere (though I was naturally gifted, obviously).

What's next, Shakespeare? 📝`,

    moviestar: `*dramatic gasp* 

Darling! You've written to me: "${message}"

How... MAGNIFICENT! *wipes tear*

In all my years in Hollywood, from my first indie film to my third Oscar nomination, I've never seen such... COURAGE! Such DETERMINATION to learn English!

✨ Remember what they say in the movies: "After all, tomorrow is another day!"

Now, my star pupil, continue your journey to linguistic greatness! 🌟`,
  }

  return responses[personality] || responses.friendly
}

