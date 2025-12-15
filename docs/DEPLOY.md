# Деплой на Render.com + Cloudflare R2

Пошаговая инструкция для деплоя сервиса одной кнопкой.

---

## Шаг 1: Настройка Cloudflare R2 (хранилище файлов)

R2 — S3-совместимое хранилище без egress fees (бесплатная отдача файлов).

### 1.1 Создать аккаунт Cloudflare
1. Перейти на [dash.cloudflare.com](https://dash.cloudflare.com)
2. Зарегистрироваться (бесплатно)

### 1.2 Создать R2 bucket
1. В Dashboard → **R2** → **Create bucket**
2. Имя bucket: `photolab` (или любое другое, запомните)
3. Регион: **Automatic** (будет выбран ближайший)
4. Создать

### 1.3 Получить API токен
1. **R2** → **Manage R2 API Tokens** → **Create API Token**
2. Permissions: **Object Read & Write**
3. TTL: **Forever** (или срок)
4. **Create API Token**
5. Сохраните:
   - **Access Key ID** (S3_ACCESS_KEY)
   - **Secret Access Key** (S3_SECRET_KEY)
   - **Endpoint** (должен быть вида `https://[account_id].r2.cloudflarestorage.com`)

---

## Шаг 2: Настройка Render.com (хостинг API)

### 2.1 Залить код на GitHub
```bash
cd /Users/kirillmigel/Desktop/Photolab
git init
git add .
git commit -m "Initial commit"

# Создайте репозиторий на GitHub и залейте код:
git remote add origin https://github.com/ваш-username/photolab.git
git branch -M main
git push -u origin main
```

### 2.2 Подключить репозиторий к Render
1. Перейти на [render.com](https://render.com)
2. Зарегистрироваться (GitHub OAuth)
3. **New** → **Blueprint** (Render автоматом прочитает `render.yaml`)
4. Выбрать ваш GitHub репозиторий `photolab`
5. **Apply**

### 2.3 Задать секретные переменные
Render создаст 3 сервиса:
- `photolab-api` (Web Service)
- `photolab-worker` (Background Worker)
- `photolab-redis` (Redis)

Для **photolab-api** и **photolab-worker**:
1. Перейти в **Environment** каждого сервиса
2. Добавить переменные (те, что `sync: false` в render.yaml):

```
REPLICATE_API_TOKEN=ваш_токен_replicate
S3_ENDPOINT_URL=https://[account_id].r2.cloudflarestorage.com
S3_ACCESS_KEY=ваш_r2_access_key
S3_SECRET_KEY=ваш_r2_secret_key
```

3. **Save Changes**

---

## Шаг 3: Получить Replicate API токен

1. Перейти на [replicate.com](https://replicate.com)
2. Зарегистрироваться
3. **Account Settings** → **API Tokens** → **Create token**
4. Скопировать токен и добавить в Render Environment

---

## Шаг 4: Деплой

1. Render автоматически соберёт и задеплоит сервисы после пуша в GitHub
2. Дождитесь статуса **Live** для `photolab-api`
3. URL будет вида: `https://photolab-api.onrender.com`

---

## Шаг 5: Проверка

```bash
# Health check
curl https://photolab-api.onrender.com/health

# Загрузить файл
curl -X POST https://photolab-api.onrender.com/remove-bg \
  -F "file=@test.jpg" \
  -F "mode=quality"
```

---

## Цены

### Render.com Free Tier
- Web Service: 750 часов/мес бесплатно (спит после 15 мин бездействия)
- Worker: 750 часов/мес бесплатно
- Redis: 25MB бесплатно (достаточно для очереди задач)

**После превышения free tier:**
- Starter ($7/мес за сервис): без сна, больше CPU/RAM

### Cloudflare R2 Free Tier
- 10GB хранения
- Unlimited бесплатная отдача (egress)
- 10 млн запросов/мес (достаточно для 100-1000 запросов/день)

**Итого на старте:** $0-7/мес (зависит от нагрузки)

---

## Автоматический деплой

После первой настройки:
- Каждый `git push` в `main` автоматически пересобирает и деплоит сервисы
- Render показывает логи и статус деплоя в Dashboard

---

## Альтернатива: Upstash Redis (вместо Render Redis)

Если хотите больше надёжности для Redis:
1. Создайте бесплатную базу на [upstash.com](https://upstash.com)
2. Скопируйте `UPSTASH_REDIS_REST_URL`
3. Замените `REDIS_URL` в Render Environment на Upstash URL
4. Удалите `photolab-redis` из `render.yaml`

**Free tier Upstash:** 10k запросов/день

---

## Troubleshooting

**Проблема:** Render service спит (cold start 30-60 сек)  
**Решение:** Апгрейд на Starter ($7/мес) или используйте UptimeRobot для пинга каждые 5 мин (костыль для free tier)

**Проблема:** Worker не подключается к Redis  
**Решение:** Проверьте, что `REDIS_URL` задан одинаково для api и worker

**Проблема:** S3 ошибка "bucket not found"  
**Решение:** Убедитесь, что бакет создан в R2 Dashboard и `S3_BUCKET_NAME` совпадает

---

## Следующие шаги

После успешного деплоя:
1. Добавить фронтенд (Next.js) и задеплоить на Vercel/Netlify (бесплатно)
2. Настроить кастомный домен
3. Добавить rate limiting и базовую аутентификацию
4. Настроить мониторинг (Sentry для ошибок)

