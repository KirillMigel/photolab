import { NextRequest, NextResponse } from 'next/server'

const KIE_API_KEY = process.env.KIE_API_KEY || 'd889d48eead533eba92ea30c1564077d'
const KIE_API_BASE = 'https://api.kie.ai'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Конвертируем файл в base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    // Шаг 1: Создаём задачу на удаление фона
    const createTaskResponse = await fetch(`${KIE_API_BASE}/api/v1/jobs/createTask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'recraft/remove-background',
        input: {
          image: dataUrl,
        },
      }),
    })

    if (!createTaskResponse.ok) {
      const errorText = await createTaskResponse.text()
      console.error('Kie.ai createTask error:', errorText)
      return NextResponse.json(
        { error: `API error: ${createTaskResponse.status}` },
        { status: createTaskResponse.status }
      )
    }

    const taskData = await createTaskResponse.json()
    const taskId = taskData.data?.id || taskData.id

    if (!taskId) {
      console.error('No task ID in response:', taskData)
      return NextResponse.json({ error: 'No task ID returned' }, { status: 500 })
    }

    // Шаг 2: Ждём результат (polling)
    let result = null
    let attempts = 0
    const maxAttempts = 60 // 60 секунд максимум

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)) // Ждём 1 секунду
      
      const statusResponse = await fetch(`${KIE_API_BASE}/api/v1/jobs/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${KIE_API_KEY}`,
        },
      })

      if (!statusResponse.ok) {
        attempts++
        continue
      }

      const statusData = await statusResponse.json()
      const status = statusData.data?.status || statusData.status

      if (status === 'completed' || status === 'succeeded') {
        result = statusData.data?.output || statusData.output
        break
      } else if (status === 'failed' || status === 'error') {
        return NextResponse.json(
          { error: 'Processing failed' },
          { status: 500 }
        )
      }

      attempts++
    }

    if (!result) {
      return NextResponse.json({ error: 'Timeout waiting for result' }, { status: 504 })
    }

    // Возвращаем URL результата
    const outputUrl = typeof result === 'string' ? result : result.image || result.url || result[0]
    
    return NextResponse.json({ 
      success: true, 
      url: outputUrl 
    })

  } catch (error) {
    console.error('Remove background error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

