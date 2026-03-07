# Deployment Guide

## Требования

- Docker и Docker Compose
- PostgreSQL 16 (или используйте готовый Docker контейнер)
- Node.js 18+ (для локальной разработки)

## Варианты развертывания

### 1. Локальный Docker

```bash
# 1. Копировать .env файл
cp .env.example .env

# 2. Отредактировать .env
# Обязательно измените SECRET_TOKEN и DB_PASSWORD

# 3. Запустить контейнеры
docker-compose up -d

# 4. Проверить статус
docker-compose ps

# 5. Проверить здоровье приложения
curl http://localhost:3000/api/health
```

### 2. Production сервер

#### Предварительные требования

1. Сервер с Linux (Ubuntu 22.04 рекомендуется)
2. Docker и Docker Compose установлены
3. Открытые порты: 3000 (приложение), 5432 (PostgreSQL - только для localhost)

#### Шаги развертывания

```bash
# 1. Клонировать репозиторий
git clone https://github.com/rammnic/knowledge-database.git
cd knowledge-database

# 2. Настроить переменные окружения
cp .env.example .env
nano .env  # Изменить все пароли и ключи

# 3. Собрать и запустить
docker-compose up -d --build

# 4. Проверить логи
docker-compose logs -f knowledge-app

# 5. Проверить здоровье
curl http://localhost:3000/api/health
```

#### Настройка Nginx (рекомендуется)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Переменные окружения

| Переменная | Описание | Пример |
|------------|----------|--------|
| `DATABASE_URL` | Строка подключения к PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `DB_PASSWORD` | Пароль для PostgreSQL (в docker-compose) | `secure-password` |
| `SECRET_TOKEN` | Секретный токен для админ-доступа | `your-secret-token` |
| `NEXT_PUBLIC_SECRET_TOKEN` | Токен для клиентской части | `your-secret-token` |
| `OPENROUTER_API_KEY` | API ключ OpenRouter | `sk-or-v1-...` |
| `OPENROUTER_MODEL` | Модель для AI | `google/gemini-2.0-flash-001` |
| `NEXT_PUBLIC_URL` | URL приложения | `https://your-domain.com` |

## Обновление приложения

```bash
# 1. Остановить контейнеры
docker-compose down

# 2. Стянуть обновления
git pull origin main

# 3. Пересобрать и запустить
docker-compose up -d --build
```

## Резервное копирование

```bash
# Создать дамп базы данных
docker-compose exec knowledge-db pg_dump -U knowledge knowledge > backup_$(date +%Y%m%d).sql

# Восстановить из дампа
docker-compose exec -T knowledge-db psql -U knowledge knowledge < backup_20240101.sql
```

## Мониторинг

```bash
# Просмотр логов приложения
docker-compose logs -f knowledge-app

# Просмотр логов базы данных
docker-compose logs -f knowledge-db

# Использование ресурсов
docker stats
```

## Troubleshooting

### Приложение не запускается

1. Проверить логи: `docker-compose logs knowledge-app`
2. Убедиться что DATABASE_URL корректен
3. Проверить что PostgreSQL запущен и здоров: `docker-compose ps`

### Ошибки подключения к БД

1. Проверить что контейнер БД здоров: `docker-compose ps`
2. Проверить переменную DATABASE_URL
3. Подождать пока БД инициализируется (может занять до 30 секунд)

### Проблемы с AI функциями

1. Проверить OPENROUTER_API_KEY
2. Проверить логи: `docker-compose logs knowledge-app | grep -i error`

## Структура Docker

```
knowledge-database/
├── docker-compose.yml    # Orchestration
├── Dockerfile            # Multi-stage build
├── .env.example          # Шаблон переменных
└── ...
```

## Безопасность

- Всегда меняйте SECRET_TOKEN в production
- Используйте сильные пароли для PostgreSQL
- Не публикуйте .env файл в репозитории
- Используйте HTTPS в production (Nginx с Let's Encrypt)
- Ограничьте доступ к порту PostgreSQL (только localhost)