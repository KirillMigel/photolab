import { NextRequest, NextResponse } from 'next/server'

const KIE_API_KEY = process.env.KIE_API_KEY || 'd889d48eead533eba92ea30c1564077d'
const KIE_API_BASE = 'https://api.kie.ai'

// Попробуем разные варианты названий модели
const MODEL_NAMES = [
  'wan2.6/text-to-video',
  'wan-2.6/t2v',
  'wan/2.6-text-to-video',
  'alibaba/wan-2.6-t2v',
  'wan-2.6-t2v',
  'wan/t2v',
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, duration = '5', resolution = '1080p' } = body

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    console.log('Generating video with Wan 2.6...')
    console.log('Prompt:', prompt)
    console.log('Duration:', duration)

    let lastError = null
    let taskData = null

    // Пробуем разные названия модели
    for (const modelName of MODEL_NAMES) {
      console.log(`Trying model: ${modelName}`)
      
      const createTaskResponse = await fetch(`${KIE_API_BASE}/api/v1/jobs/createTask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${KIE_API_KEY}`,
          'X-API-Key': KIE_API_KEY,
        },
        body: JSON.stringify({
          model: modelName,
          input: {
            prompt: prompt,
            duration: duration,
            resolution: resolution,
          },
        }),
      })

      const responseText = await createTaskResponse.text()
      console.log(`Response for ${modelName}:`, responseText.substring(0, 200))

      try {
        taskData = JSON.parse(responseText)
      } catch {
        lastError = `Invalid JSON: ${responseText}`
        continue
      }

      // Если нет ошибки, выходим из цикла
      if (!taskData.code || taskData.code === 200 || taskData.code === 0) {
        console.log(`Success with model: ${modelName}`)
        break
      }

      // Если ошибка "page does not exist" - пробуем следующую модель
      if (taskData.msg?.includes('not exist') || taskData.msg?.includes('not published')) {
        lastError = taskData.msg
        taskData = null
        continue
      }

      // Другая ошибка - возвращаем её
      lastError = taskData.msg || 'Unknown API error'
    }

    if (!taskData) {
      return NextResponse.json(
        { error: lastError || 'All model names failed. API may not support this model.' },
        { status: 500 }
      )
    }

    // Проверяем на ошибку
    if (taskData.code && taskData.code !== 200 && taskData.code !== 0) {
      return NextResponse.json(
        { error: taskData.msg || 'API error', details: taskData },
        { status: 500 }
      )
    }

    // Получаем task ID
    const taskId = taskData.data?.id || taskData.data?.taskId || taskData.id || taskData.taskId

    // Проверяем на синхронный ответ
    if (!taskId) {
      const directResult = taskData.data?.output || taskData.output || taskData.data?.video || taskData.video
      if (directResult) {
        return NextResponse.json({ success: true, videoUrl: directResult, status: 'completed' })
      }
      return NextResponse.json(
        { error: 'No task ID in response', response: taskData },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      taskId: taskId,
      status: 'processing'
    })

  } catch (error) {
    console.error('Generate video error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error}` },
      { status: 500 }
    )
  }
}
