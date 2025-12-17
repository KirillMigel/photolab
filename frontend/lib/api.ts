// Удаление фона происходит полностью в браузере через WebAssembly
// Библиотека загружается динамически только на клиенте

export const removeBackground = async (
  file: File,
  _mode: 'quality' | 'fast' = 'quality'
): Promise<string> => {
  // @ts-ignore — загружаем внешнюю ESM-библиотеку с CDN, у неё нет типов
  const { removeBackground: imglyRemoveBackground } = await import(
    /* webpackIgnore: true */ 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/dist/background-removal.esm.js'
  )
  
  // Конвертируем File в Blob URL для imgly
  const imageUrl = URL.createObjectURL(file)
  
  try {
    // Удаляем фон в браузере
    const blob = await imglyRemoveBackground(imageUrl, {
      model: 'medium',
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
    URL.revokeObjectURL(imageUrl)
  }
}

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
