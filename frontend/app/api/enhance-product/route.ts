import { NextRequest, NextResponse } from 'next/server'

const KIE_API_KEY = process.env.KIE_API_KEY || 'd889d48eead533eba92ea30c1564077d'
const KIE_API_BASE = 'https://api.kie.ai'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null
    const prompt = formData.get('prompt') as string | null || 'professional product photography, studio lighting, clean white background, high quality, commercial photography'

    if (!imageFile) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    console.log('Enhancing product image with Kie.ai...')
    console.log('File name:', imageFile.name)
    console.log('File size:', imageFile.size)
    console.log('Prompt:', prompt)

    // Конвертируем изображение в base64
    const imageBuffer = await imageFile.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString('base64')
    const imageDataUrl = `data:${imageFile.type};base64,${base64Image}`

    // Пробуем разные модели для улучшения продукта
    const models = [
      'flux-1-context',
      'flux-context',
      'flux/context',
      '4o-image',
      '4o-image-api',
      'nano-banana',
    ]

    let taskData = null
    let lastError = null

    for (const model of models) {
      console.log(`Trying model: ${model}`)

      try {
        // Создаем задачу на улучшение изображения
        const createTaskResponse = await fetch(`${KIE_API_BASE}/api/v1/jobs/createTask`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${KIE_API_KEY}`,
            'X-API-Key': KIE_API_KEY,
          },
          body: JSON.stringify({
            model: model,
            input: {
              prompt: prompt,
              image: imageDataUrl, // Отправляем изображение
              // Альтернативные варианты параметров
              image_url: imageDataUrl,
              input_image: imageDataUrl,
              reference_image: imageDataUrl,
            },
          }),
        })

        const responseText = await createTaskResponse.text()
        console.log(`Response for ${model}:`, responseText.substring(0, 300))

        try {
          taskData = JSON.parse(responseText)
        } catch {
          lastError = `Invalid JSON: ${responseText}`
          continue
        }

        // Проверяем на успех
        if (!taskData.code || taskData.code === 200 || taskData.code === 0) {
          console.log(`✅ Success with model: ${model}`)
          break
        }

        // Если ошибка "не существует" - пробуем следующую модель
        if (taskData.msg?.includes('not exist') || taskData.msg?.includes('not published') || taskData.msg?.includes('not found')) {
          lastError = taskData.msg
          taskData = null
          continue
        }

        lastError = taskData.msg || 'Unknown error'
        taskData = null

      } catch (fetchError: any) {
        console.log(`Fetch error for ${model}:`, fetchError.message)
        lastError = fetchError.message
      }
    }

    if (!taskData) {
      // Если все модели не сработали, возвращаем оригинальное изображение
      return NextResponse.json({
        success: true,
        url: imageDataUrl,
        message: 'Using original image (API enhancement not available)',
      })
    }

    // Получаем task ID
    const taskId = taskData.data?.id || taskData.data?.taskId || taskData.id || taskData.taskId

    // Проверяем на синхронный ответ (изображение сразу готово)
    if (!taskId) {
      const directResult = taskData.data?.output || taskData.output || taskData.data?.image || taskData.image || taskData.data?.url || taskData.url
      if (directResult) {
        return NextResponse.json({ success: true, url: directResult, status: 'completed' })
      }
    }

    // Если есть task ID, возвращаем его для последующего опроса
    return NextResponse.json({
      success: true,
      taskId: taskId,
      status: 'processing',
    })

  } catch (error: any) {
    console.error('Enhance product error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    )
  }
}

