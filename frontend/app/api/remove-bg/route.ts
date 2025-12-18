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

    // Конвертируем файл в base64 URL
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    
    // Определяем MIME тип
    let mimeType = file.type
    if (!mimeType || mimeType === 'application/octet-stream') {
      // Пробуем определить по расширению
      const name = file.name.toLowerCase()
      if (name.endsWith('.png')) mimeType = 'image/png'
      else if (name.endsWith('.jpg') || name.endsWith('.jpeg')) mimeType = 'image/jpeg'
      else if (name.endsWith('.webp')) mimeType = 'image/webp'
      else mimeType = 'image/png' // default
    }

    console.log('File name:', file.name)
    console.log('File type:', mimeType)
    console.log('File size:', file.size)

    // Пробуем JSON формат с input объектом
    const requestBody = {
      model: 'recraft/remove-background',
      input: {
        image: `data:${mimeType};base64,${base64}`
      }
    }

    console.log('Sending JSON request to Kie.ai...')

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
    console.log('Kie.ai response status:', createTaskResponse.status)
    console.log('Kie.ai response:', responseText)

    let taskData
    try {
      taskData = JSON.parse(responseText)
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON response', raw: responseText },
        { status: 500 }
      )
    }

    // Проверяем на ошибку
    if (taskData.code && taskData.code !== 200 && taskData.code !== 0) {
      // Пробуем альтернативный формат - просто image без input wrapper
      console.log('First format failed, trying alternative...')
      
      const altRequestBody = {
        model: 'recraft/remove-background',
        image: `data:${mimeType};base64,${base64}`
      }

      const altResponse = await fetch(`${KIE_API_BASE}/api/v1/jobs/createTask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${KIE_API_KEY}`,
          'X-API-Key': KIE_API_KEY,
        },
        body: JSON.stringify(altRequestBody),
      })

      const altText = await altResponse.text()
      console.log('Alternative response:', altText)

      try {
        taskData = JSON.parse(altText)
      } catch {
        return NextResponse.json(
          { error: 'Both formats failed', response1: responseText, response2: altText },
          { status: 500 }
        )
      }
    }

    // Проверяем на ошибку снова
    if (taskData.code && taskData.code !== 200 && taskData.code !== 0) {
      return NextResponse.json(
        { error: taskData.msg || 'API error', details: taskData },
        { status: 500 }
      )
    }

    // Получаем task ID
    const taskId = taskData.data?.id || taskData.data?.taskId || taskData.id || taskData.taskId

    // Может быть синхронный ответ
    if (!taskId) {
      const directResult = taskData.data?.output || taskData.output || taskData.data?.image || taskData.image || taskData.data?.url || taskData.url
      if (directResult) {
        return NextResponse.json({ success: true, url: directResult })
      }
      return NextResponse.json(
        { error: 'No task ID or result', response: taskData },
        { status: 500 }
      )
    }

    console.log('Task ID:', taskId)

    // Polling для результата
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 1000))
      
      const statusRes = await fetch(`${KIE_API_BASE}/api/v1/jobs/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${KIE_API_KEY}`,
          'X-API-Key': KIE_API_KEY,
        },
      })

      if (!statusRes.ok) continue

      const statusData = await statusRes.json().catch(() => null)
      if (!statusData) continue

      const status = statusData.data?.status || statusData.status
      console.log(`Poll ${i + 1}: status = ${status}`)

      if (['completed', 'succeeded', 'success', 'done'].includes(status)) {
        const result = statusData.data?.output || statusData.output || statusData.data?.image || statusData.image
        const url = typeof result === 'string' ? result : result?.image || result?.url || result?.[0]
        return NextResponse.json({ success: true, url })
      }

      if (['failed', 'error'].includes(status)) {
        return NextResponse.json({ error: 'Processing failed', details: statusData }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'Timeout' }, { status: 504 })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
