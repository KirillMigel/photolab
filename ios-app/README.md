# 📱 Photolab iOS App

iOS приложение для удаления фона с фотографий с помощью AI.

## 🚀 Быстрый старт

### Установка зависимостей

```bash
npm install
```

### Запуск на симуляторе

```bash
npm run ios
```

### Запуск на устройстве

1. Установите Expo Go на iPhone
2. Запустите `npm start`
3. Отсканируйте QR код

## 📦 Подготовка к App Store

### 1. Установите EAS CLI

```bash
npm install -g eas-cli
```

### 2. Войдите в Expo

```bash
eas login
```

### 3. Настройте проект

```bash
eas build:configure
```

### 4. Создайте build для App Store

```bash
eas build --platform ios --profile production
```

### 5. Отправьте в App Store Connect

После завершения билда:

1. Зайдите в [App Store Connect](https://appstoreconnect.apple.com)
2. Создайте новое приложение
3. Загрузите билд через Transporter или Xcode
4. Заполните метаданные (описание, скриншоты, иконки)
5. Отправьте на ревью

## ⚙️ Настройки

### API URL

Обновите `API_URL` в `App.tsx` на ваш Vercel URL:

```typescript
const API_URL = 'https://your-app.vercel.app/api/remove-bg'
```

### Bundle Identifier

В `app.json` обновите `bundleIdentifier`:

```json
"bundleIdentifier": "com.yourcompany.photolab"
```

### Иконки и Splash Screen

Замените файлы в `assets/`:
- `icon.png` - 1024x1024
- `splash-icon.png` - 2048x2048

## 📋 Требования для App Store

- ✅ Уникальный Bundle Identifier
- ✅ Описание приложения
- ✅ Скриншоты (минимум 1 для iPhone)
- ✅ Иконка приложения (1024x1024)
- ✅ Политика конфиденциальности (URL)
- ✅ Apple Developer Account ($99/год)

## 🔐 Apple Developer Account

1. Зарегистрируйтесь на [developer.apple.com](https://developer.apple.com)
2. Оплатите подписку ($99/год)
3. Создайте App ID в Certificates, Identifiers & Profiles
4. Настройте App Store Connect

## 📝 Чеклист перед публикацией

- [ ] Обновлен API URL
- [ ] Настроен Bundle Identifier
- [ ] Добавлены иконки и splash screen
- [ ] Протестировано на реальном устройстве
- [ ] Написано описание для App Store
- [ ] Подготовлены скриншоты
- [ ] Добавлена политика конфиденциальности
- [ ] Создан Apple Developer Account
- [ ] Настроен App Store Connect

## 🛠 Полезные команды

```bash
# Запуск в режиме разработки
npm start

# Сборка для App Store
eas build --platform ios --profile production

# Обновление OTA (без пересборки)
eas update --branch production

# Просмотр логов
eas build:list
```

## 📚 Документация

- [Expo Documentation](https://docs.expo.dev)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [App Store Connect](https://developer.apple.com/app-store-connect/)

---

**Photolab iOS © 2025**

