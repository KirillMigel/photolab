import { NextRequest, NextResponse } from 'next/server'

const KIE_API_KEY = process.env.KIE_API_KEY || 'd889d48eead533eba92ea30c1564077d'
const KIE_API_BASE = 'https://api.kie.ai'

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params

    const statusResponse = await fetch(`${KIE_API_BASE}/api/v1/jobs/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
        'X-API-Key': KIE_API_KEY,
      },
    })

    const responseText = await statusResponse.text()
    console.log('Task status response:', responseText)

    let statusData
    try {
      statusData = JSON.parse(responseText)
    } catch {
      return NextResponse.json(
        { error: 'Invalid response', raw: responseText },
        { status: 500 }
      )
    }

    const status = statusData.data?.status || statusData.status
    
    if (['completed', 'succeeded', 'success', 'done'].includes(status)) {
      const result = statusData.data?.output || statusData.output || statusData.data?.video || statusData.video || statusData.data?.url || statusData.url
      const videoUrl = typeof result === 'string' ? result : (result?.video || result?.url || result?.[0])
      
      return NextResponse.json({
        status: 'completed',
        videoUrl: videoUrl
      })
    }

    if (['failed', 'error'].includes(status)) {
      return NextResponse.json({
        status: 'failed',
        error: statusData.data?.error || statusData.error || 'Generation failed'
      })
    }

    // Ещё в процессе
    return NextResponse.json({
      status: 'processing',
      progress: statusData.data?.progress || statusData.progress
    })

  } catch (error) {
    console.error('Check status error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error}` },
      { status: 500 }
    )
  }
}

