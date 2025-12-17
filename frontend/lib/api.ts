import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
})

export interface BatchResponse {
  job_id: string
  status: string
}

export interface BatchStatusResponse {
  status: 'queued' | 'started' | 'finished' | 'failed'
  progress?: string
  results?: Array<{
    filename: string
    data_url: string
  }>
}

export const removeBackground = async (
  file: File,
  mode: 'quality' | 'fast' = 'quality'
): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('mode', mode)

  const response = await api.post('/remove-bg', formData, {
    responseType: 'blob',
  })
  
  // Конвертируем blob в data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(response.data)
  })
}

export const batchRemoveBackground = async (
  files: File[],
  mode: 'quality' | 'fast' = 'quality'
): Promise<BatchResponse> => {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file)
  })
  formData.append('mode', mode)

  const response = await api.post<BatchResponse>('/batch', formData)
  return response.data
}

export const getBatchStatus = async (jobId: string): Promise<BatchStatusResponse> => {
  const response = await api.get<BatchStatusResponse>(`/batch/${jobId}`)
  return response.data
}

export const healthCheck = async (): Promise<{ status: string }> => {
  const response = await api.get('/health')
  return response.data
}

