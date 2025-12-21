import { NextRequest, NextResponse } from 'next/server'

const KIE_API_KEY = process.env.KIE_API_KEY || 'd889d48eead533eba92ea30c1564077d'
const KIE_API_BASE = 'https://api.kie.ai'

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    console.log(`Polling status for task ID: ${taskId}`)

    const statusResponse = await fetch(`${KIE_API_BASE}/api/v1/jobs/getTask?id=${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
        'X-API-Key': KIE_API_KEY,
      },
    })

    const responseText = await statusResponse.text()
    console.log('Kie.ai status response status:', statusResponse.status)
    console.log('Kie.ai status response:', responseText)

    let taskStatusData
    try {
      taskStatusData = JSON.parse(responseText)
    } catch {
      return NextResponse.json(
        { error: 'Invalid response from API', raw: responseText },
        { status: 500 }
      )
    }

    if (taskStatusData.code && taskStatusData.code !== 200 && taskStatusData.code !== 0) {
      return NextResponse.json(
        { error: taskStatusData.msg || 'API error', details: taskStatusData },
        { status: 500 }
      )
    }

    const status = taskStatusData.data?.status || 'unknown'
    const imageUrl = taskStatusData.data?.output || taskStatusData.data?.image || taskStatusData.data?.url

    if (status === 'completed' && imageUrl) {
      return NextResponse.json({ success: true, status: 'completed', url: imageUrl })
    } else if (status === 'failed') {
      return NextResponse.json({ success: true, status: 'failed', error: taskStatusData.data?.msg || 'Image enhancement failed' })
    } else {
      return NextResponse.json({ success: true, status: 'processing' })
    }
  } catch (error: any) {
    console.error('Get enhancement status error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    )
  }
}

