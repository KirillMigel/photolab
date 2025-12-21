import React, { useState } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'

// Для симулятора используйте localhost, для реального устройства - ваш Vercel URL
// В симуляторе localhost работает, на реальном устройстве нужен публичный URL
const API_URL = __DEV__ 
  ? 'http://localhost:3000/api/remove-bg'  // Для симулятора
  : 'https://your-vercel-url.vercel.app/api/remove-bg'  // Production

export default function App() {
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const pickImage = async () => {
    try {
      // Запрашиваем разрешение
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Нужно разрешение на доступ к фото')
        return
      }

      // Выбираем изображение
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      })

      // Если пользователь отменил выбор - просто выходим
      if (result.canceled) {
        return
      }

      if (result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri
        setOriginalImage(imageUri)
        setProcessedImage(null)
        await removeBackground(imageUri)
      }
    } catch (error: any) {
      console.error('Error picking image:', error)
      Alert.alert('Ошибка', 'Не удалось выбрать изображение')
    }
  }

  const takePhoto = async () => {
    try {
      // Запрашиваем разрешение на камеру
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Нужно разрешение на использование камеры')
        return
      }

      // Делаем фото
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 1,
      })

      // Если пользователь отменил - просто выходим
      if (result.canceled) {
        return
      }

      if (result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri
        setOriginalImage(imageUri)
        setProcessedImage(null)
        await removeBackground(imageUri)
      }
    } catch (error: any) {
      console.error('Error taking photo:', error)
      Alert.alert('Ошибка', 'Не удалось сделать фото')
    }
  }

  const removeBackground = async (imageUri: string) => {
    setIsProcessing(true)
    try {
      // Читаем файл как base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      // Определяем MIME тип
      const mimeType = imageUri.endsWith('.png') ? 'image/png' : 'image/jpeg'
      const dataUri = `data:${mimeType};base64,${base64}`

      // Создаем FormData
      const formData = new FormData()
      formData.append('image', {
        uri: imageUri,
        type: mimeType,
        name: 'image.jpg',
      } as any)

      // Отправляем на API
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(error.error || 'Failed to remove background')
      }

      const data = await response.json()

      if (data.url) {
        setProcessedImage(data.url)
      } else {
        throw new Error('No image URL in response')
      }
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось удалить фон')
      console.error('Error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadImage = async () => {
    if (!processedImage) return

    try {
      // Скачиваем изображение
      const fileUri = FileSystem.documentDirectory + 'removed-background.png'
      const downloadResult = await FileSystem.downloadAsync(processedImage, fileUri)

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadResult.uri)
      } else {
        Alert.alert('Успешно', 'Изображение сохранено')
      }
    } catch (error: any) {
      Alert.alert('Ошибка', 'Не удалось сохранить изображение')
      console.error('Error:', error)
    }
  }

  const reset = () => {
    setOriginalImage(null)
    setProcessedImage(null)
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Photolab</Text>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Удаление фона</Text>
          <Text style={styles.subtitle}>
            Бесплатно стирайте фоны изображений с помощью AI
          </Text>
        </View>

        {/* Upload Buttons */}
        {!originalImage && (
          <View style={styles.uploadContainer}>
            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
              <Text style={styles.uploadButtonText}>📷 Выбрать фото</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
              <Text style={styles.uploadButtonText}>📸 Сделать фото</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#26251E" />
            <Text style={styles.processingText}>Обрабатываем изображение...</Text>
          </View>
        )}

        {/* Original Image */}
        {originalImage && !isProcessing && (
          <View style={styles.imageContainer}>
            <Text style={styles.imageLabel}>Оригинал</Text>
            <Image source={{ uri: originalImage }} style={styles.image} />
          </View>
        )}

        {/* Processed Image */}
        {processedImage && (
          <View style={styles.imageContainer}>
            <Text style={styles.imageLabel}>Результат</Text>
            <Image source={{ uri: processedImage }} style={styles.image} />
            <TouchableOpacity style={styles.downloadButton} onPress={downloadImage}>
              <Text style={styles.downloadButtonText}>💾 Сохранить</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Reset Button */}
        {(originalImage || processedImage) && !isProcessing && (
          <TouchableOpacity style={styles.resetButton} onPress={reset}>
            <Text style={styles.resetButtonText}>🔄 Новое фото</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F4',
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
  },
  logo: {
    fontSize: 24,
    fontWeight: '600',
    color: '#26251E',
    fontFamily: 'System',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#26251E',
    marginBottom: 8,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 16,
    color: '#26251E',
    opacity: 0.8,
    textAlign: 'center',
    paddingHorizontal: 20,
    fontFamily: 'System',
  },
  uploadContainer: {
    width: '100%',
    gap: 16,
    marginTop: 40,
  },
  uploadButton: {
    backgroundColor: '#26251E',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#F7F7F4',
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'System',
  },
  processingContainer: {
    alignItems: 'center',
    marginTop: 40,
    gap: 16,
  },
  processingText: {
    fontSize: 16,
    color: '#26251E',
    opacity: 0.6,
    fontFamily: 'System',
  },
  imageContainer: {
    width: '100%',
    marginTop: 24,
    alignItems: 'center',
    gap: 12,
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#26251E',
    opacity: 0.6,
    fontFamily: 'System',
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  downloadButton: {
    backgroundColor: '#26251E',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  downloadButtonText: {
    color: '#F7F7F4',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'System',
  },
  resetButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#26251E',
  },
  resetButtonText: {
    color: '#26251E',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'System',
  },
})
