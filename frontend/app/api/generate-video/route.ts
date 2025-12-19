import { NextRequest, NextResponse } from 'next/server'

const KIE_API_KEY = process.env.KIE_API_KEY || 'd889d48eead533eba92ea30c1564077d'
const KIE_API_BASE = 'https://api.kie.ai'

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
    console.log('Resolution:', resolution)

    // Создаём задачу на генерацию видео
    const createTaskResponse = await fetch(`${KIE_API_BASE}/api/v1/jobs/createTask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIE_API_KEY}`,
        'X-API-Key': KIE_API_KEY,
      },
      body: JSON.stringify({
        model: 'wan/2.6-t2v',
        input: {
          prompt: prompt,
          duration: duration,
          resolution: resolution,
        },
      }),
    })

    const responseText = await createTaskResponse.text()
    console.log('Kie.ai response status:', createTaskResponse.status)
    console.log('Kie.ai response:', responseText)

    let taskData
    try {
      taskData = JSON.parse(responseText)
    } catch {
      return NextResponse.json(
        { error: 'Invalid response from API', raw: responseText },
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

    // Проверяем на синхронный ответ с результатом
    if (!taskId) {
      const directResult = taskData.data?.output || taskData.output || taskData.data?.video || taskData.video || taskData.data?.url || taskData.url
      if (directResult) {
        return NextResponse.json({ success: true, videoUrl: directResult, status: 'completed' })
      }
      return NextResponse.json(
        { error: 'No task ID in response', response: taskData },
        { status: 500 }
      )
    }

    // Возвращаем task ID для polling на клиенте
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

