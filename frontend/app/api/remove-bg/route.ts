import { NextRequest, NextResponse } from 'next/server'

const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY || 'GtSKYXFmAtxHjSvVQxcgD8db'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    console.log('Processing with Remove.bg...')
    console.log('File name:', file.name)
    console.log('File type:', file.type)
    console.log('File size:', file.size)

    // Создаём FormData для Remove.bg API
    const removeBgFormData = new FormData()
    removeBgFormData.append('image_file', file)
    removeBgFormData.append('size', 'auto') // auto, preview, small, regular, medium, hd, full, 4k

    // Отправляем запрос к Remove.bg
    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': REMOVE_BG_API_KEY,
      },
      body: removeBgFormData,
    })

    console.log('Remove.bg response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Remove.bg error:', errorText)
      
      let errorMessage = 'Failed to remove background'
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.errors?.[0]?.title || errorJson.error || errorMessage
      } catch {
        errorMessage = errorText || errorMessage
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    // Remove.bg возвращает PNG изображение напрямую
    const imageBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(imageBuffer).toString('base64')
    const dataUrl = `data:image/png;base64,${base64}`

    console.log('Successfully processed image!')
    
    return NextResponse.json({ 
      success: true, 
      url: dataUrl 
    })

  } catch (error) {
    console.error('Remove background error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error}` },
      { status: 500 }
    )
  }
}
