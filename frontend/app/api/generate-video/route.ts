import { NextRequest, NextResponse } from 'next/server'

const KIE_API_KEY = process.env.KIE_API_KEY || 'd889d48eead533eba92ea30c1564077d'
const KIE_API_BASE = 'https://api.kie.ai'

// Пробуем ВСЕ возможные варианты названий модели Grok
const MODEL_NAMES = [
  // Основные варианты
  'grok-imagine',
  'grok_imagine',
  'grokimagine',
  // С версией
  'grok-imagine-v1',
  'grok-imagine/t2v',
  'grok-imagine/text-to-video',
  // Короткие названия
  'grok',
  'grok-t2v',
  'grok-video',
  // С вендором
  'xai/grok-imagine',
  'xai/grok',
  // CamelCase
  'GrokImagine',
  'Grok-Imagine',
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, aspectRatio = '3:2', mode = 'normal' } = body

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    console.log('=== Starting Grok Imagine video generation ===')
    console.log('Prompt:', prompt)
    console.log('Aspect Ratio:', aspectRatio)
    console.log('Mode:', mode)
    console.log('API Key (first 8 chars):', KIE_API_KEY.substring(0, 8))

    let lastError = null
    let taskData = null
    let successModel = null

    // Пробуем разные названия модели
    for (const modelName of MODEL_NAMES) {
      console.log(`\n--- Trying model: "${modelName}" ---`)
      
      const requestBody = {
        model: modelName,
        input: {
          prompt: prompt,
          aspect_ratio: aspectRatio,
          mode: mode,
        },
      }
      
      console.log('Request body:', JSON.stringify(requestBody))
      
      try {
        const createTaskResponse = await fetch(`${KIE_API_BASE}/api/v1/jobs/createTask`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${KIE_API_KEY}`,
            'X-API-Key': KIE_API_KEY,
          },
          body: JSON.stringify(requestBody),
        })

        const responseText = await createTaskResponse.text()
        console.log(`Status: ${createTaskResponse.status}`)
        console.log(`Response: ${responseText.substring(0, 500)}`)

        try {
          taskData = JSON.parse(responseText)
        } catch {
          lastError = `Invalid JSON from API`
          continue
        }

        // Проверяем на успех
        if (taskData.code === 0 || taskData.code === 200 || (!taskData.code && !taskData.error)) {
          console.log(`✅ SUCCESS with model: "${modelName}"`)
          successModel = modelName
          break
        }

        // Если ошибка "не существует" - пробуем следующую модель
        if (taskData.msg?.includes('not exist') || taskData.msg?.includes('not published') || taskData.msg?.includes('not found')) {
          lastError = `Model "${modelName}": ${taskData.msg}`
          taskData = null
          continue
        }

        // Другая ошибка - сохраняем и пробуем дальше
        lastError = taskData.msg || taskData.error || 'Unknown error'
        taskData = null
        
      } catch (fetchError: any) {
        console.log(`Fetch error for ${modelName}:`, fetchError.message)
        lastError = fetchError.message
      }
    }

    console.log('\n=== Final result ===')
    console.log('Success model:', successModel)
    console.log('Task data:', taskData ? 'exists' : 'null')
    console.log('Last error:', lastError)

    if (!taskData) {
      return NextResponse.json(
        { 
          error: lastError || 'All model names failed',
          hint: 'Check Kie.ai dashboard for correct model identifier'
        },
        { status: 500 }
      )
    }

    // Получаем task ID
    const taskId = taskData.data?.id || taskData.data?.taskId || taskData.id || taskData.taskId

    // Проверяем на синхронный ответ (видео сразу готово)
    if (!taskId) {
      const directResult = taskData.data?.output || taskData.output || taskData.data?.video || taskData.video || taskData.data?.url || taskData.url
      if (directResult) {
        return NextResponse.json({ success: true, videoUrl: directResult, status: 'completed' })
      }
      
      // Может это массив результатов?
      if (Array.isArray(taskData.data) && taskData.data.length > 0) {
        const firstResult = taskData.data[0]
        if (firstResult.url || firstResult.output || firstResult.video) {
          return NextResponse.json({ 
            success: true, 
            videoUrl: firstResult.url || firstResult.output || firstResult.video, 
            status: 'completed' 
          })
        }
      }
      
      return NextResponse.json(
        { error: 'Unexpected response format', response: taskData },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      taskId: taskId,
      status: 'processing'
    })

  } catch (error: any) {
    console.error('Generate video error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    )
  }
}
