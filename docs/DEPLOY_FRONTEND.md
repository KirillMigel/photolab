# Деплой фронтенда на Vercel

Пошаговая инструкция деплоя Next.js приложения на Vercel (бесплатно).

---

## Шаг 1: Подготовка репозитория

Убедитесь, что код залит на GitHub (см. основную инструкцию деплоя в `DEPLOY.md`).

---

## Шаг 2: Деплой на Vercel

### 2.1 Создать аккаунт
1. Перейти на [vercel.com](https://vercel.com)
2. Sign in with GitHub

### 2.2 Импортировать проект
1. **Add New** → **Project**
2. Выбрать репозиторий `photolab`
3. **Framework Preset:** Next.js (автоопределение)
4. **Root Directory:** `frontend` ⚠️ ВАЖНО указать!
5. **Build Command:** `npm run build` (автоматически)
6. **Output Directory:** `.next` (автоматически)

### 2.3 Настроить переменные окружения
В разделе **Environment Variables** добавить:

```
NEXT_PUBLIC_API_URL=https://photolab-api.onrender.com
```

⚠️ Замените на ваш реальный URL Render API (получите после деплоя backend).

### 2.4 Deploy
1. Нажать **Deploy**
2. Дождаться завершения сборки (~2-3 минуты)
3. Ваш фронт будет доступен на `https://photolab-xxx.vercel.app`

---

## Шаг 3: Настроить CORS на backend

После деплоя фронтенда нужно разрешить запросы с Vercel домена.

### Вариант A: Разрешить все origin (для MVP)
В `backend/app/main.py` уже стоит:
```python
allow_origins=["*"]
```
Это работает, но небезопасно для продакшена.

### Вариант B: Указать конкретные домены (рекомендуется)
Обновить в `backend/app/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Локальная разработка
        "https://photolab-xxx.vercel.app",  # Ваш Vercel домен
        "https://your-custom-domain.com",  # Если подключите свой домен
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Закоммитить и пушнуть → Render автоматически пересоберёт backend.

---

## Шаг 4: Кастомный домен (опционально)

### На Vercel
1. В настройках проекта → **Domains**
2. Добавить свой домен (например, `photolab.ru`)
3. Настроить DNS согласно инструкциям Vercel

### На Render (для API)
1. В настройках API сервиса → **Settings** → **Custom Domain**
2. Добавить поддомен (например, `api.photolab.ru`)
3. Настроить DNS CNAME
4. Обновить `NEXT_PUBLIC_API_URL` в Vercel Environment Variables

---

## Автоматический деплой

После первой настройки:
- Каждый `git push` в `main` автоматически деплоит:
  - **Backend** на Render
  - **Frontend** на Vercel
- Preview deployments для pull requests (Vercel feature)

---

## Проверка

1. Открыть `https://photolab-xxx.vercel.app`
2. Загрузить изображение
3. Проверить, что запрос идёт на Render API и результат отображается

---

## Troubleshooting

**Проблема:** CORS ошибка в консоли браузера  
**Решение:** Проверить `allow_origins` в `backend/app/main.py` и пересобрать backend

**Проблема:** API недоступен  
**Решение:** Убедиться, что Render backend в статусе Live, проверить `NEXT_PUBLIC_API_URL`

**Проблема:** Vercel не находит Next.js  
**Решение:** Убедиться, что Root Directory = `frontend`

**Проблема:** 404 при переходе на страницу  
**Решение:** Проверить, что в `frontend/` есть `app/page.tsx`

---

## Стоимость

**Vercel Free Tier:**
- Unlimited deployments
- 100 GB bandwidth/month
- Serverless Functions (для API routes, если нужно)

Достаточно для 1000+ пользователей/день на старте.

---

## Следующие шаги

После деплоя:
1. Подключить кастомный домен
2. Настроить аналитику (Vercel Analytics или Google Analytics)
3. Добавить Яндекс.Метрику для RU аудитории
4. Начать писать SEO-статьи и вести блог

