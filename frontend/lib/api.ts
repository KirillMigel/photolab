import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal'

// Удаление фона происходит полностью в браузере через WebAssembly
// Никакого бэкенда не требуется - бесплатно и без лимитов!

export const removeBackground = async (
  file: File,
  _mode: 'quality' | 'fast' = 'quality'
): Promise<string> => {
  // Конвертируем File в Blob URL для imgly
  const imageUrl = URL.createObjectURL(file)
  
  try {
    // Удаляем фон в браузере
    const blob = await imglyRemoveBackground(imageUrl, {
      model: 'medium', // 'small' | 'medium' | 'large'
      output: {
        format: 'image/png',
        quality: 0.8,
      },
    })
    
    // Конвертируем результат в data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } finally {
    // Освобождаем память
    URL.revokeObjectURL(imageUrl)
  }
}

// Batch обработка - обрабатываем файлы последовательно в браузере
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
