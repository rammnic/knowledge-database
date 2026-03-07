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
├── nginx/                # Nginx конфиги
│   └── smart.rammnic.space
└── .github/
    └── workflows/
        └── deploy.yml    # CI/CD
```

## Первичная настройка сервера

### 1. Клонирование репозитория
```bash
mkdir -p /opt/knowledge-database
cd /opt/knowledge-database
git clone https://github.com/rammnic/knowledge-database.git .
```

### 2. Настройка переменных окружения
```bash
cp .env.example .env
nano .env
# Заполнить:
# DB_PASSWORD=your-secure-password
# SECRET_TOKEN=your-admin-secret-token
# OPENROUTER_API_KEY=sk-or-v1-...
```

### 3. Настройка Nginx
```bash
# Скопировать конфиг
sudo cp nginx/smart.rammnic.space /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/smart.rammnic.space /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Получить SSL сертификат
sudo certbot --nginx -d smart.rammnic.space
```

### 4. Запуск контейнеров
```bash
docker-compose up -d
docker-compose ps
```

### 5. Проверка
```bash
curl http://127.0.0.1:3002/api/health
```

---

## Настройка GitHub Secrets

В репозитории GitHub добавить Secrets:

| Секрет | Описание | Пример |
|--------|----------|--------|
| `DOCKER_USERNAME` | Docker Hub username | `rammnic1` |
| `DOCKER_PASSWORD` | Docker Hub password/token | `***` |
| `DEPLOY_HOST` | IP сервера | `159.681.xx.xx` |
| `DEPLOY_USER` | SSH пользователь | `root` |
| `SSH_PRIVATE_KEY` | Приватный SSH ключ | `-----BEGIN OPENSSH...` |
| `DB_PASSWORD` | Пароль PostgreSQL | `secure-password` |
| `SECRET_TOKEN` | Токен админки | `your-secret-token` |
| `OPENROUTER_API_KEY` | API ключ OpenRouter | `sk-or-v1-...` |
| `OPENROUTER_MODEL` | Модель AI | `minimax/minimax-m2.5` |
| `OPENROUTER_PROVIDER_ORDER` | Провайдеры | `sambanova,fireworks` |
| `OPENROUTER_CONCURRENCY` | Параллельные запросы | `10` |
| `NEXT_PUBLIC_URL` | URL приложения | `https://smart.rammnic.space` |

### Генерация SSH ключа для GitHub Actions
```bash
ssh-keygen -t ed25519 -C "github-actions" -f deploy_key
# Публичный ключ добавить в ~/.authorized_keys на сервере
# Приватный ключ добавить в GitHub Secrets как SSH_PRIVATE_KEY
```

## Первичная настройка сервера

### 1. Клонирование и настройка
```bash
mkdir -p /opt/knowledge-database
cd /opt/knowledge-database
git clone https://github.com/rammnic/knowledge-database.git .

# Создать .env файл (все переменные передаются из GitHub Secrets)
# CI/CD создаст .env автоматически при первом деплое
```

### 2. Nginx
```bash
# Скопировать конфиг
sudo cp nginx/smart.rammnic.space /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/smart.rammnic.space /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Получить SSL сертификат
sudo certbot --nginx -d smart.rammnic.space
```

### 3. Первый деплой
После настройки GitHub Secrets — запушить в main, CI/CD запустится автоматически.

### 4. Проверка
```bash
# Проверить контейнеры
docker-compose ps

# Проверить здоровье
curl http://127.0.0.1:3002/api/health

# Логи
docker-compose logs -f knowledge-app
```

## Безопасность

- Всегда меняйте SECRET_TOKEN в production
- Используйте сильные пароли для PostgreSQL
- Не публикуйте .env файл в репозитории
- Используйте HTTPS в production (Nginx с Let's Encrypt)
- Ограничьте доступ к порту PostgreSQL (только localhost)