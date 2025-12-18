// API для удаления фона через Kie.ai (Recraft)

export const removeBackground = async (
  file: File,
  _mode: 'quality' | 'fast' = 'quality'
): Promise<string> => {
  const formData = new FormData()
  formData.append('image', file)

  const response = await fetch('/api/remove-bg', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || 'Failed to remove background')
  }

  const data = await response.json()
  
  // Если API вернул URL изображения, конвертируем в data URL
  if (data.url) {
    // Если это уже data URL, возвращаем как есть
    if (data.url.startsWith('data:')) {
      return data.url
    }
    
    // Иначе загружаем изображение и конвертируем в data URL
    const imageResponse = await fetch(data.url)
    const blob = await imageResponse.blob()
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  throw new Error('No result URL in response')
}

// Batch обработка - обрабатываем файлы последовательно
export const batchRemoveBackground = async (
  files: File[],
  mode: 'quality' | 'fast' = 'quality'
): Promise<Array<{ filename: string; data_url: string }>> => {
  const results: Array<{ filename: string; data_url: string }> = []
  
  for (const file of files) {
    const dataUrl = await removeBackground(file, mode)
    results.push({
      filename: file.name.replace(/\.[^.]+$/, '_nobg.png'),
      data_url: dataUrl,
    })
  }
  
  return results
}
