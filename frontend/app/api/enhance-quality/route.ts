import { NextRequest, NextResponse } from 'next/server'

const KIE_API_KEY = process.env.KIE_API_KEY || 'd889d48eead533eba92ea30c1564077d'
const KIE_API_BASE = 'https://api.kie.ai'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null

    if (!imageFile) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    console.log('Enhancing image quality with Kie.ai...')
    console.log('File name:', imageFile.name)
    console.log('File size:', imageFile.size)

    // Конвертируем изображение в base64
    const imageBuffer = await imageFile.arrayBuffer()
    const base64Image = Buffer.from(imageBuffer).toString('base64')
    const imageDataUrl = `data:${imageFile.type};base64,${base64Image}`

    // Пробуем разные модели для улучшения качества (upscaling/enhancement)
    const models = [
      '4o-image-upscale',      // Upscaling через 4o Image
      'flux-upscale',          // Upscaling через Flux
      'flux-1-upscale',
      'upscale',               // Общий upscale
      'image-upscale',
      'super-resolution',
      '4o-image',              // Fallback - может улучшить качество
      'flux-context',          // Fallback
    ]

    let taskData = null
    let lastError = null

    for (const model of models) {
      console.log(`Trying model: ${model}`)

      try {
        // Создаем задачу на улучшение качества
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
              image: imageDataUrl,
              image_url: imageDataUrl,
              input_image: imageDataUrl,
              // Параметры для upscaling
              scale: 2,              // Увеличить в 2 раза
              upscale_factor: 2,
              enhance: true,
              remove_noise: true,
              improve_quality: true,
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
      console.log('All models failed, returning original image')
      return NextResponse.json({
        success: true,
        url: imageDataUrl,
        message: 'Using original image (upscaling API not available)',
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
    console.error('Enhance quality error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    )
  }
}

