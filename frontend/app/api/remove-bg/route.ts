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

    console.log('File name:', file.name)
    console.log('File type:', file.type)
    console.log('File size:', file.size)

    // Создаём новый FormData для отправки в Kie.ai
    const kieFormData = new FormData()
    kieFormData.append('model', 'recraft/remove-background')
    kieFormData.append('image', file, file.name || 'image.png')

    console.log('Sending request to Kie.ai with FormData...')

    // Создаём задачу на удаление фона
    const createTaskResponse = await fetch(`${KIE_API_BASE}/api/v1/jobs/createTask`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
        'X-API-Key': KIE_API_KEY,
      },
      body: kieFormData,
    })

    const responseText = await createTaskResponse.text()
    console.log('Kie.ai response status:', createTaskResponse.status)
    console.log('Kie.ai response:', responseText)

    if (!createTaskResponse.ok) {
      return NextResponse.json(
        { error: `Kie.ai API error: ${createTaskResponse.status} - ${responseText}` },
        { status: createTaskResponse.status }
      )
    }

    let taskData
    try {
      taskData = JSON.parse(responseText)
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON response from Kie.ai' },
        { status: 500 }
      )
    }

    console.log('Parsed task data:', JSON.stringify(taskData, null, 2))

    // Проверяем на ошибку в ответе
    if (taskData.code && taskData.code !== 200 && taskData.code !== 0) {
      return NextResponse.json(
        { error: taskData.msg || 'API error', details: taskData },
        { status: 500 }
      )
    }

    // Пробуем разные варианты получения task ID
    const taskId = taskData.data?.id || taskData.data?.taskId || taskData.data?.job_id || taskData.id || taskData.taskId || taskData.job_id

    if (!taskId) {
      // Может быть синхронный ответ с результатом сразу
      const directResult = taskData.data?.output || taskData.output || taskData.data?.result || taskData.result || taskData.data?.image || taskData.image || taskData.data?.url || taskData.url
      
      if (directResult) {
        console.log('Got direct result:', directResult)
        return NextResponse.json({ success: true, url: directResult })
      }
      
      return NextResponse.json(
        { error: 'No task ID or result in response', response: taskData },
        { status: 500 }
      )
    }

    console.log('Task ID:', taskId)

    // Ждём результат (polling)
    let result = null
    let attempts = 0
    const maxAttempts = 60

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const statusResponse = await fetch(`${KIE_API_BASE}/api/v1/jobs/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${KIE_API_KEY}`,
          'X-API-Key': KIE_API_KEY,
        },
      })

      const statusText = await statusResponse.text()
      console.log(`Poll attempt ${attempts + 1}:`, statusText.substring(0, 200))

      if (!statusResponse.ok) {
        attempts++
        continue
      }

      let statusData
      try {
        statusData = JSON.parse(statusText)
      } catch {
        attempts++
        continue
      }

      const status = statusData.data?.status || statusData.status
      console.log('Job status:', status)

      if (status === 'completed' || status === 'succeeded' || status === 'success' || status === 'done') {
        result = statusData.data?.output || statusData.output || statusData.data?.result || statusData.result || statusData.data?.image || statusData.image || statusData.data?.url || statusData.url
        break
      } else if (status === 'failed' || status === 'error') {
        return NextResponse.json(
          { error: 'Processing failed', details: statusData },
          { status: 500 }
        )
      }

      attempts++
    }

    if (!result) {
      return NextResponse.json({ error: 'Timeout waiting for result' }, { status: 504 })
    }

    // Возвращаем URL результата
    const outputUrl = typeof result === 'string' ? result : (result.image || result.url || result[0])
    console.log('Final output URL:', outputUrl)
    
    return NextResponse.json({ 
      success: true, 
      url: outputUrl 
    })

  } catch (error) {
    console.error('Remove background error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error}` },
      { status: 500 }
    )
  }
}
