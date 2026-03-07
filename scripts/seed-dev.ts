/**
 * Seed-скрипт для создания тестовых заметок (dev only)
 * Запустить: npx tsx scripts/seed-dev.ts
 * 
 * ВНИМАНИЕ: Не добавлять в prisma db seed!
 * Этот скрипт только для локальной разработки.
 */
import { prisma } from "@/lib/prisma";

const devNotes = [
  // ===========================================
  // 1. Linux администрирование (база)
  // ===========================================
  {
    title: "Основы командной строки Linux",
    slug: "linux-command-line-basics",
    content: `# Основы командной строки Linux

Базовые команды для работы в терминале Linux.

## Навигация по файловой системе

\`\`\`bash
# Переход в директорию
cd /path/to/directory

# Просмотр содержимого
ls -la          # подробный список
ls -lh          # читабельные размеры файлов

# Текущая директория
pwd

# Домашняя директория
cd ~
cd $HOME
\`\`\`

## Работа с файлами

\`\`\`bash
# Создание файлов и директорий
touch file.txt
mkdir -p dir1/dir2/dir3

# Копирование и перемещение
cp source.txt destination.txt
cp -r source_dir/ dest_dir/
mv oldname.txt newname.txt

# Удаление
rm file.txt
rm -rf directory/    # рекурсивно и принудительно
\`\`\`

## Просмотр и редактирование файлов

\`\`\`bash
# Просмотр содержимого
cat file.txt          # весь файл
head -n 20 file.txt   # первые 20 строк
tail -n 20 file.txt   # последние 20 строк
less file.txt         # постраничный просмотр

# Поиск по файлам
grep "pattern" file.txt
grep -r "pattern" directory/
\`\`\`

## Системная информация

\`\`\`bash
# Информация о системе
uname -a
cat /etc/os-release

# Использование ресурсов
top
htop
df -h
free -h
\`\`\`

## Связанные заметки

Смотрите также: [[Linux User Management]] и [[Linux File Permissions]]`,
    excerpt: "Базовые команды Linux: навигация, работа с файлами, системная информация",
    status: "PUBLIC" as const,
    maturity: "SEED" as const,
  },
  {
    title: "Управление пользователями в Linux",
    slug: "linux-user-management",
    content: `# Управление пользователями в Linux

Работа с пользователями и группами в Linux.

## Основные команды

\`\`\`bash
# Создание пользователя
useradd -m -s /bin/bash username
adduser username    # интерактивный режим

# Удаление пользователя
userdel -r username

# Изменение пароля
passwd username

# Изменение информации о пользователе
usermod -aG groupname username  # добавление в группу
\`\`\`

## Работа с группами

\`\`\`bash
# Создание группы
groupadd groupname

# Добавление пользователя в группу
usermod -aG sudo username    # для Ubuntu
usermod -aG wheel username   # для CentOS

# Просмотр групп пользователя
groups username
id username
\`\`\`

## Файлы конфигурации

\`\`\`bash
# База данных пользователей
cat /etc/passwd

# База данных паролей (теневые пароли)
cat /etc/shadow

# Группы
cat /etc/group
\`\`\`

## Связанные темы

Смотрите также: [[Linux Command Line Basics]] и [[Linux File Permissions]]`,
    excerpt: "Управление пользователями и группами в Linux: useradd, usermod, groups",
    status: "PUBLIC",
    maturity: "SEED",
  },
  {
    title: "Права доступа в Linux",
    slug: "linux-file-permissions",
    content: `# Права доступа в Linux

Понимание и управление правами доступа к файлам.

## Типы прав

- **r** (read) — чтение
- **w** (write) — запись
- **x** (execute) — выполнение

## Представление прав

\`\`\`bash
# Символьное представление
-rwxr-xr-x

# Числовое представление (octal)
755 = rwxr-xr-x
644 = rw-r--r--
600 = rw-------
777 = rwxrwxrwx
\`\`\`

## Владельцы файла

- **u** (user) — владелец
- **g** (group) — группа
- **o** (others) — остальные
- **a** (all) — все

## Команды chmod

\`\`\`bash
# Символьный режим
chmod u+x file.sh          # добавить execute для владельца
chmod g-w file.txt         # убрать write для группы
chmod o=rw file.txt        # установить read/write для остальных
chmod a+x script.sh        # добавить execute для всех

# Числовой режим
chmod 755 file.sh
chmod 644 config.txt
chmod 600 private.key
\`\`\`

## Команда chown

\`\`\`bash
# Изменить владельца
chown username file.txt

# Изменить владельца и группу
chown username:groupname file.txt

# Рекурсивно для директории
chown -R username:groupname directory/
\`\`\`

## Специальные биты

\`\`\`bash
# SUID (4000) — выполнение от имени владельца
chmod 4755 /usr/bin/special-command

# SGID (2000) — выполнение от имени группы
chmod 2755 /shared/folder

# Sticky bit (1000) — удаление только владельцем
chmod 1777 /tmp
\`\`\`

## Связанные темы

Смотрите также: [[Linux Command Line Basics]] и [[Linux User Management]]`,
    excerpt: "Права доступа в Linux: chmod, chown, числовое и символьное представление",
    status: "PUBLIC",
    maturity: "SAPLING",
  },

  // ===========================================
  // 2. Windows Server администрирование
  // ===========================================
  {
    title: "Active Directory и GPO",
    slug: "active-directory-gpo",
    content: `# Active Directory и GPO

Управление Active Directory и Group Policy Objects.

## Основные компоненты AD

- **Domain** — домен
- **OU (Organizational Unit)** — организационная единица
- **DC (Domain Controller)** — контроллер домена
- **Forest** — лес (множество доменов)

## PowerShell команды

\`\`\`powershell
# Получить информацию о домене
Get-ADDomain

# Получить список контроллеров домена
Get-ADDomainController -Filter *

# Создать пользователя
New-ADUser -Name "John Doe" -SamAccountName "jdoe" -UserPrincipalName "jdoe@domain.local" -AccountPassword (ConvertTo-SecureString "P@ssw0rd" -AsPlainText) -Enabled $true

# Добавить пользователя в группу
Add-ADGroupMember -Identity "Domain Admins" -Members "jdoe"

# Список членов группы
Get-ADGroupMember -Identity "Domain Admins"
\`\`\`

## Group Policy (GPO)

\`\`\`powershell
# Создать GPO
New-GPO -Name "Workstation Settings"

# Связать GPO с OU
New-GPLink -Name "Workstation Settings" -Target "ou=computers,dc=domain,dc=local"

# Обновить политики на компьютере
gpupdate /force

# Экспорт политик
Backup-GPO -All -Path "C:\\GPO-Backup"
\`\`\`

## Связанные темы

Смотрите также: [[Windows Server PowerShell]] и [[Windows Server Services]]`,
    excerpt: "Active Directory: управление пользователями, GPO, PowerShell команды",
    status: "PUBLIC",
    maturity: "SAPLING",
  },
  {
    title: "PowerShell для администрирования Windows Server",
    slug: "windows-server-powershell",
    content: `# PowerShell для администрирования Windows Server

Основные команды PowerShell для управления Windows Server.

## Базовые операции

\`\`\`powershell
# Информация о системе
Get-ComputerInfo
Get-ComputerInfo | Select-Object WindowsProductName, OsVersion

# Список запущенных процессов
Get-Process
Get-Process | Sort-Object CPU -Descending | Select-Object -First 10

# Службы
Get-Service
Get-Service | Where-Object Status -eq "Running"
\`\`\`

## Управление службами

\`\`\`powershell
# Запустить службу
Start-Service -Name "Spooler"

# Остановить службу
Stop-Service -Name "Spooler"

# Перезапустить службу
Restart-Service -Name "Spooler"

# Изменить тип запуска
Set-Service -Name "Spooler" -StartupType Automatic
\`\`\`

## Работа с сетью

\`\`\`powershell
# IP-конфигурация
Get-NetIPConfiguration
Get-NetIPAddress

# Тестирование connectivity
Test-NetConnection -ComputerName "server.domain.local" -Port 443

# DNS
Resolve-DnsName "google.com"
\`\`\`

## Удалённое управление

\`\`\`powershell
# Удалённая сессия
Enter-PSSession -ComputerName "server01" -Credential (Get-Credential)

# Выполнение команды на удалённом ПК
Invoke-Command -ComputerName "server01" -ScriptBlock { Get-Process }

# Удалённый скрипт
Invoke-Command -ComputerName "server01" -FilePath "C:\\script.ps1"
\`\`\`

## Связанные темы

Смотрите также: [[Active Directory GPO]] и [[Windows Server Services]]`,
    excerpt: "PowerShell: управление службами, сетью, дисками, удалённое управление",
    status: "PUBLIC",
    maturity: "SAPLING",
  },
  {
    title: "Службы и сервисы Windows Server",
    slug: "windows-server-services",
    content: `# Службы и сервисы Windows Server

Управление службами в Windows Server.

## Основные службы

### DNS Server
\`\`\`powershell
# Установка DNS роли
Install-WindowsFeature DNS

# Управление зонами
Get-DnsServerZone
Add-DnsServerPrimaryZone -ZoneName "example.local" -ZoneFile "example.local.dns"
\`\`\`

### DHCP Server
\`\`\`powershell
# Установка DHCP роли
Install-WindowsFeature DHCP

# Создание области
Add-DhcpServerV4Scope -Name "Corp Network" -StartRange 192.168.1.100 -EndRange 192.168.1.200 -SubnetMask 255.255.255.0
\`\`\`

### IIS (Web Server)
\`\`\`powershell
# Установка IIS
Install-WindowsFeature Web-Server -IncludeManagementTools

# Управление сайтами
Get-Website
New-Website -Name "MySite" -Port 80 -PhysicalPath "C:\\inetpub\\wwwroot"

# Пулы приложений
Get-Item IIS:\\AppPools\\DefaultAppPool
\`\`\`

## Управление через Services.msc

\`\`\`powershell
# Открыть консоль служб
services.msc

# Типы запуска
# Automatic (Delayed Start) — автоматически с задержкой
# Automatic — автоматически при загрузке
# Manual — вручную
# Disabled — отключена
\`\`\`

## Мониторинг служб

\`\`\`powershell
# Проверка статуса критических служб
$services = @("DNS", "DHCP Server", "Active Directory Domain Services")
foreach ($svc in $services) {
  $status = Get-Service -Name $svc -ErrorAction SilentlyContinue
  Write-Host "$($svc): $($status.Status)"
}

# Логи служб
Get-WinEvent -LogName System -MaxEvents 50 | Where-Object { $_.LevelDisplayName -eq "Error" }
\`\`\`

## Связанные темы

Смотрите также: [[Active Directory GPO]] и [[Windows Server PowerShell]]`,
    excerpt: "Управление службами Windows Server: DNS, DHCP, IIS",
    status: "PUBLIC",
    maturity: "SEED",
  },

  // ===========================================
  // 3. Виртуализация и контейнеры
  // ===========================================
  {
    title: "Docker основы",
    slug: "docker-basics",
    content: `# Docker основы

Введение в контейнеризацию с Docker.

## Основные概念

- **Image** — образ (шаблон для контейнера)
- **Container** — запущенный экземпляр образа
- **Volume** — постоянное хранилище
- **Network** — сеть для контейнеров

## Основные команды

\`\`\`bash
# Работа с образами
docker images
docker pull nginx:latest
docker rmi nginx:latest

# Работа с контейнерами
docker ps              # запущенные
docker ps -a           # все
docker run -d -p 8080:80 nginx
docker run -it ubuntu /bin/bash
docker stop container_id
docker rm container_id

# Логи и мониторинг
docker logs -f container_id
docker stats container_id
docker exec -it container_id /bin/bash
\`\`\`

## Dockerfile пример

\`\`\`dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

## Docker Compose

\`\`\`yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/app
    depends_on:
      - db
    volumes:
      - ./data:/app/data
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: app
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
\`\`\`

## Связанные темы

Смотрите также: [[Docker Compose]] и [[Kubernetes Architecture]]`,
    excerpt: "Docker: основы, команды, Dockerfile, Docker Compose",
    status: "PUBLIC",
    maturity: "SEED",
  },
  {
    title: "Docker Compose для разработки",
    slug: "docker-compose",
    content: `# Docker Compose для разработки

Оркестрация multi-container приложений.

## Основной файл docker-compose.yml

\`\`\`yaml
version: '3.8'
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://backend:4000
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/app
      - REDIS_URL=redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
\`\`\`

## Команды Docker Compose

\`\`\`bash
# Запуск всех сервисов
docker-compose up -d

# Запуск с пересборкой
docker-compose up -d --build

# Просмотр логов
docker-compose logs -f
docker-compose logs -f backend

# Остановка
docker-compose down
docker-compose down -v    # удалить тома

# Масштабирование
docker-compose up -d --scale backend=3
\`\`\`

## Связанные темы

Смотрите также: [[Docker Basics]] и [[Kubernetes Architecture]]`,
    excerpt: "Docker Compose: multi-container приложения, команды, примеры конфигурации",
    status: "PUBLIC",
    maturity: "SAPLING",
  },
  {
    title: "Kubernetes архитектура",
    slug: "kubernetes-architecture",
    content: `# Kubernetes архитектура

Обзор архитектуры и компонентов Kubernetes.

## Компоненты кластера

### Control Plane (Master Node)
- **kube-apiserver** — API сервер
- **etcd** — хранилище состояния
- **kube-controller-manager** — управление контроллерами
- **kube-scheduler** — планировщик подов

### Worker Node
- **kubelet** — агент на узле
- **kube-proxy** — сетевой прокси
- **container runtime** — Docker или containerd

## Основные объекты

### Pod
\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-app
  labels:
    app: my-app
spec:
  containers:
  - name: app
    image: myapp:latest
    ports:
    - containerPort: 8080
    resources:
      limits:
        memory: "128Mi"
        cpu: "500m"
      requests:
        memory: "64Mi"
        cpu: "250m"
\`\`\`

### Deployment
\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: myapp:latest
        ports:
        - containerPort: 8080
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
\`\`\`

### Service
\`\`\`yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app
spec:
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP
\`\`\`

## Основные команды

\`\`\`bash
# Управление подами
kubectl get pods
kubectl describe pod my-app
kubectl logs my-app
kubectl exec -it my-app -- /bin/bash

# Управление деплойментами
kubectl apply -f deployment.yaml
kubectl rollout status deployment/my-app
kubectl rollout undo deployment/my-app

# Масштабирование
kubectl scale deployment my-app --replicas=5
\`\`\`

## Связанные темы

Смотрите также: [[Docker Basics]] и [[Docker Compose]]`,
    excerpt: "Kubernetes: архитектура, компоненты, Pod, Deployment, Service",
    status: "PUBLIC",
    maturity: "SAPLING",
  },

  // ===========================================
  // 4. Базы данных
  // ===========================================
  {
    title: "PostgreSQL администрирование",
    slug: "postgresql-admin",
    content: `# PostgreSQL администрирование

Основы администрирования PostgreSQL.

## Подключение

\`\`\`bash
# Подключение к БД
psql -U username -d database_name
psql -h localhost -p 5432 -U username -d database_name

# Из командной строки psql
\\c database_name  # подключиться к БД
\\q                # выход
\\dt               # список таблиц
\\d table_name     # описание таблицы
\`\`\`

## Управление пользователями

\`\`\`sql
-- Создание пользователя
CREATE USER username WITH PASSWORD 'password';

-- Создание БД
CREATE DATABASE dbname OWNER username;

-- Выдача прав
GRANT ALL PRIVILEGES ON DATABASE dbname TO username;
GRANT ALL ON SCHEMA public TO username;

-- Права на таблицы
GRANT SELECT, INSERT, UPDATE, DELETE ON table_name TO username;
\`\`\`

## Резервное копирование

\`\`\`bash
# Дамп одной БД
pg_dump -U username -Fc database_name > backup.dump

# Дамп всех БД
pg_dumpall -U postgres > all_databases.sql

# Восстановление
pg_restore -U username -d database_name backup.dump

# Восстановление из SQL
psql -U username -d database_name < backup.sql
\`\`\`

## Мониторинг и оптимизация

\`\`\`sql
-- Текущие активные запросы
SELECT pid, usename, query, state 
FROM pg_stat_activity 
WHERE state != 'idle';

-- Размер БД
SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname))
FROM pg_database;

-- Размер таблиц
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 10;

-- Индексы и их использование
SELECT indexrelname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
\`\`\`

## Настройка производительности

\`\`\`sql
-- Анализ запроса
EXPLAIN ANALYZE SELECT * FROM table_name WHERE condition;

-- Настройка автовакуума
ALTER TABLE table_name SET (autovacuum_vacuum_threshold = 50);
\`\`\`

## Связанные темы

Смотрите также: [[Oracle Database Basics]] и [[MongoDB Basics]]`,
    excerpt: "PostgreSQL: управление пользователями, резервное копирование, мониторинг",
    status: "PUBLIC",
    maturity: "SAPLING",
  },
  {
    title: "Oracle Database основы",
    slug: "oracle-database-basics",
    content: `# Oracle Database основы

Введение в администрирование Oracle Database.

## Подключение

\`\`\`bash
# SQL*Plus
sqlplus / as sysdba
sqlplus username/password@database

# SQLcl
sql username/password@database
\`\`\`

## Основные представления

\`\`\`sql
-- Пользователи
SELECT username, created, account_status 
FROM dba_users;

-- Табличные пространства
SELECT tablespace_name, status, contents 
FROM dba_tablespaces;

-- Сессии
SELECT sid, serial#, username, program, status 
FROM v$session;

-- Активные запросы
SELECT sql_text, elapsed_time 
FROM v$sqlarea 
ORDER BY elapsed_time DESC;
\`\`\`

## Управление табличными пространствами

\`\`\`sql
-- Создание tablespace
CREATE TABLESPACE app_data
DATAFILE '/u01/oradata/db/app_data01.dbf'
SIZE 100M
AUTOEXTEND ON NEXT 10M
MAXSIZE UNLIMITED;

-- Добавление datafile
ALTER TABLESPACE app_data
ADD DATAFILE '/u01/oradata/db/app_data02.dbf'
SIZE 100M;

-- Изменение размера
ALTER DATABASE DATAFILE '/u01/oradata/db/app_data01.dbf' RESIZE 200M;
\`\`\`

## Резервное копирование

\`\`\`bash
# RMAN подключение
rman target /

# Полный бэкап
BACKUP DATABASE;

# Бэкап tablespace
BACKUP TABLESPACE app_data;

# Инкрементальный бэкап
BACKUP INCREMENTAL LEVEL 1 DATABASE;
\`\`\`

## Управление памятью

\`\`\`sql
-- Параметры SGA
SHOW sga_target
SHOW sga_max_size

-- Настройка PGA
SHOW pga_aggregate_target

-- Текущее использование
SELECT * FROM v$sgastat;
\`\`\`

## Связанные темы

Смотрите также: [[PostgreSQL Admin]] и [[MongoDB Basics]]`,
    excerpt: "Oracle Database: основы, tablespace, RMAN, управление памятью",
    status: "PUBLIC",
    maturity: "SAPLING",
  },
  {
    title: "MongoDB основы",
    slug: "mongodb-basics",
    content: `# MongoDB основы

Работа с MongoDB — документной базой данных.

## Подключение

\`\`\`bash
# Подключение к локальному серверу
mongosh
mongosh "mongodb://localhost:27017"

# Подключение к удалённому серверу
mongosh "mongodb://hostname:27017" -u username -p

# Подключение к БД
use mydatabase
\`\`\`

## CRUD операции

\`\`\`javascript
// Создание (Create)
db.users.insertOne({
  name: "John",
  email: "john@example.com",
  age: 30,
  tags: ["admin", "user"]
});

db.users.insertMany([
  { name: "Alice", email: "alice@example.com" },
  { name: "Bob", email: "bob@example.com" }
]);

// Чтение (Read)
db.users.findOne({ name: "John" });
db.users.find({ age: { $gte: 25 } });
db.users.find({}, { name: 1, email: 1, _id: 0 });

// Обновление (Update)
db.users.updateOne(
  { name: "John" },
  { $set: { age: 31 } }
);

db.users.updateMany(
  { status: "active" },
  { $set: { lastLogin: new Date() } }
);

// Удаление (Delete)
db.users.deleteOne({ name: "John" });
db.users.deleteMany({ status: "inactive" });
\`\`\`

## Индексы

\`\`\`javascript
// Создание индекса
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ name: 1, age: -1 });
db.users.createIndex({ tags: 1 });

// Список индексов
db.users.getIndexes();

// Удаление индекса
db.users.dropIndex("email_1");
\`\`\`

## Агрегация

\`\`\`javascript
// Pipeline агрегации
db.orders.aggregate([
  { $match: { status: "completed" } },
  { $group: { 
    _id: "$customerId", 
    total: { $sum: "$amount" }
  }},
  { $sort: { total: -1 } },
  { $limit: 10 }
]);
\`\`\`

## Резервное копирование

\`\`\`bash
# Дамп всех БД
mongodump --out=/backup/dump

# Дамп конкретной БД
mongodump -d mydatabase -o /backup/dump

# Восстановление
mongorestore /backup/dump
\`\`\`

## Связанные темы

Смотрите также: [[PostgreSQL Admin]] и [[Oracle Database Basics]]`,
    excerpt: "MongoDB: CRUD операции, индексы, агрегация, резервное копирование",
    status: "PUBLIC",
    maturity: "SEED",
  },

  // ===========================================
  // 5. Очереди сообщений
  // ===========================================
  {
    title: "RabbitMQ основы",
    slug: "rabbitmq-basics",
    content: `# RabbitMQ основы

Работа с RabbitMQ — брокером сообщений.

## Основные概念

- **Producer** — отправитель сообщений
- **Consumer** — получатель сообщений
- **Queue** — очередь сообщений
- **Exchange** — точка обмена (роутинг)
- **Binding** — связь между exchange и queue

## Типы Exchange

1. **Direct** — точное соответствие routing key
2. **Fanout** — рассылка всем подключённым очередям
3. **Topic** — паттерн matching (wildcards)
4. **Headers** — по заголовкам сообщения

## Подключение и управление

\`\`\`python
import pika

# Подключение
connection = pika.BlockingConnection(
    pika.ConnectionParameters(host='localhost', port=5672)
)
channel = connection.channel()

# Создание очереди
channel.queue_declare(queue='task_queue', durable=True)

# Отправка сообщения
channel.basic_publish(
    exchange='',
    routing_key='task_queue',
    body='Hello World!',
    properties=pika.BasicProperties(
        delivery_mode=2,  # persistent
    )
)

# Получение сообщения
def callback(ch, method, properties, body):
    print(f"Received: {body}")
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_qos(prefetch_count=1)
channel.basic_consume(queue='task_queue', on_message_callback=callback)
channel.start_consuming()
\`\`\`

## Управление через CLI

\`\`\`bash
# Запуск RabbitMQ
rabbitmq-server -detached

# Управление плагинами
rabbitmq-plugins enable rabbitmq_management
rabbitmq-plugins list

# Информация о очередях
rabbitmqctl list_queues name messages consumers

# Информация об exchange
rabbitmqctl list_exchanges name type

# Очистка очереди
rabbitmqctl purge_queue queue_name
\`\`\`

## Мониторинг

\`\`\`bash
# Статус
rabbitmqctl status

# Список соединений
rabbitmqctl list_connections

# Логи
tail -f /var/log/rabbitmq/rabbit@hostname.log
\`\`\`

## Связанные темы

Смотрите также: [[Kafka Basics]] и [[IBM MQ Overview]]`,
    excerpt: "RabbitMQ: очереди, exchange, producer/consumer, Python клиент",
    status: "PUBLIC",
    maturity: "SEED",
  },
  {
    title: "Apache Kafka основы",
    slug: "kafka-basics",
    content: `# Apache Kafka основы

Распределённая платформа потоковой передачи сообщений.

## Архитектура

- **Topic** — категория сообщений
- **Partition** — часть топика (для параллелизма)
- **Broker** — сервер Kafka
- **Producer** — отправитель
- **Consumer** — получатель
- **Consumer Group** — группа потребителей

## Основные команды

\`\`\`bash
# Создание топика
kafka-topics.sh --create --topic my-topic --partitions 3 --replication-factor 1 --bootstrap-server localhost:9092

# Список топиков
kafka-topics.sh --list --bootstrap-server localhost:9092

# Информация о топике
kafka-topics.sh --describe --topic my-topic --bootstrap-server localhost:9092

# Удаление топика
kafka-topics.sh --delete --topic my-topic --bootstrap-server localhost:9092
\`\`\`

## Producer и Consumer

\`\`\`bash
# Producer (консольный)
kafka-console-producer.sh --topic my-topic --bootstrap-server localhost:9092

# Consumer (консольный)
kafka-console-consumer.sh --topic my-topic --bootstrap-server localhost:9092 --from-beginning

# Consumer group
kafka-console-consumer.sh --topic my-topic --group my-group --bootstrap-server localhost:9092
\`\`\`

## Python пример

\`\`\`python
from kafka import KafkaProducer, KafkaConsumer

# Producer
producer = KafkaProducer(
    bootstrap_servers=['localhost:9092'],
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

producer.send('my-topic', {'key': 'value'})
producer.flush()

# Consumer
consumer = KafkaConsumer(
    'my-topic',
    bootstrap_servers=['localhost:9092'],
    group_id='my-group',
    value_deserializer=lambda m: json.loads(m.decode('utf-8'))
)

for message in consumer:
    print(f"Received: {message.value}")
\`\`\`

## Настройка производительности

\`\`\`properties
# producer.properties
batch.size=16384
linger.ms=10
acks=all
retries=3

# consumer.properties
fetch.min.bytes=1
max.poll.records=500
auto.offset.reset=earliest
\`\`\`

## Связанные темы

Смотрите также: [[RabbitMQ Basics]] и [[IBM MQ Overview]]`,
    excerpt: "Apache Kafka: топики, partitions, producer/consumer, Python клиент",
    status: "PUBLIC",
    maturity: "SAPLING",
  },
  {
    title: "IBM MQ обзор",
    slug: "ibm-mq-overview",
    content: `# IBM MQ обзор

Корпоративная система очередей сообщений от IBM.

## Основные概念

- **Queue Manager** — менеджер очередей
- **Queue** — очередь сообщений
- **Channel** — канал связи
- **Listener** — прослушиватель соединений
- **Topic** — для pub/sub

## Основные команды

\`\`\`bash
# Запуск queue manager
strmqm QMA

# Остановка queue manager
endmqm QMA

# Создание очереди
DEFINE QLOCAL('MY.QUEUE') DESCR('My Queue')

# Список очередей
DISPLAY QSTATUS(*)

# Отправка сообщения
AMQSPUT MY.QUEUE
# Ввести сообщение и нажать Enter дважды
\`\`\`

## MQSC команды

\`\`\`mqsc
-- Создание queue manager
DEFINE QMGR NAME(QMA) DEFPSIST(YES)

-- Создание локальной очереди
DEFINE QLOCAL('APP.QUEUE') + DESCR('Application Queue') + MAXDEPTH(10000) + DEFPSIST(YES)

-- Создание listener
DEFINE LISTENER('LISTENER.TCP') + TRPTYPE(TCP) + PORT(1414) + CONTROL(QMGR)

START LISTENER('LISTENER.TCP')

-- Создание channel
DEFINE CHANNEL('APP.CHANNEL') + CHLTYPE(SDR) + CONNAME('remote.host.com') + XMITQ('REMOTE.QUEUE')
\`\`\`

## Подключение из приложения

\`\`\`python
import pymqi

# Подключение
qmgr = pymqi.connect('QMA', 'APP.CHANNEL', 'localhost(1414)')

# Отправка сообщения
q = pymqi.Queue(qmgr, 'APP.QUEUE')
q.put(b'Hello IBM MQ!')
q.close()

# Получение сообщения
q = pymqi.Queue(qmgr, 'APP.QUEUE')
message = q.get()
q.close()

qmgr.disconnect()
\`\`\`

## Безопасность

\`\`\`mqsc
-- Настройка авторизации
SET AUTHREC OBJTYPE(QMGR) PRINCIPAL('user@domain') AUTHADD(ALL)

-- SSL/TLS настройка
DEFINE CHANNEL('SSL.CHANNEL') CHLTYPE(SVRCONN) SSLCIPH(TLS_RSA_WITH_AES_256_CBC_SHA)
\`\`\`

## Связанные темы

Смотрите также: [[RabbitMQ Basics]] и [[Kafka Basics]]`,
    excerpt: "IBM MQ: queue manager, очереди, каналы, MQSC команды",
    status: "PUBLIC",
    maturity: "SEED",
  },

  // ===========================================
  // 6. Web-серверы
  // ===========================================
  {
    title: "Nginx конфигурация",
    slug: "nginx-configuration",
    content: `# Nginx конфигурация

Настройка и оптимизация Nginx.

## Базовая структура конфига

\`\`\`nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript;
}
\`\`\`

## Конфигурация сайта

\`\`\`nginx
server {
    listen 80;
    server_name example.com www.example.com;

    root /var/www/html;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location ~ \\.php$ {
        fastcgi_pass unix:/var/run/php/php-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\\. {
        deny all;
    }
}
\`\`\`

## SSL/TLS конфигурация

\`\`\`nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
}
\`\`\`

## Команды управления

\`\`\`bash
# Проверка конфигурации
nginx -t

# Перезагрузка
nginx -s reload

# Перезапуск
systemctl restart nginx
\`\`\`

## Связанные темы

Смотрите также: [[Tomcat Configuration]] и [[IIS Setup]]`,
    excerpt: "Nginx: конфигурация, SSL, proxy, оптимизация",
    status: "PUBLIC",
    maturity: "SAPLING",
  },
  {
    title: "Tomcat настройка",
    slug: "tomcat-configuration",
    content: `# Tomcat настройка

Настройка Apache Tomcat для Java приложений.

## Структура директорий

\`\`\`
tomcat/
├── bin/           # скрипты (startup.sh, shutdown.sh)
├── conf/          # конфигурация
│   ├── server.xml # основной конфиг
│   ├── web.xml    # настройки web приложений
│   └── context.xml
├── webapps/       # деплой приложений
├── logs/          # логи
├── lib/           # библиотеки
└── temp/          # временные файлы
\`\`\`

## server.xml основные настройки

\`\`\`xml
<Server port="8005" shutdown="SHUTDOWN">
  <Service name="Catalina">
    <Connector port="8080" protocol="HTTP/1.1"
               connectionTimeout="20000"
               redirectPort="8443"
               maxThreads="200"
               minSpareThreads="10"
               acceptCount="100"/>
    <Connector protocol="AJP/1.3"
               address="127.0.0.1"
               port="8009"
               redirectPort="8443"/>
    <Engine name="Catalina" defaultHost="localhost">
      <Host name="localhost" appBase="webapps"
            unpackWARs="true" autoDeploy="true">
        <Valve className="org.apache.catalina.valves.AccessLogValve"
               directory="logs"
               prefix="localhost_access_log"
               suffix=".txt"/>
      </Host>
    </Engine>
  </Service>
</Server>
\`\`\`

## Настройка JVM

\`\`\`bash
# setenv.sh
export CATALINA_OPTS="-Xms512m -Xmx2048m -XX:+UseG1GC"
export JAVA_OPTS="-Djava.awt.headless=true"
export CATALINA_HOME=/opt/tomcat
\`\`\`

## Деплой приложения

\`\`\`bash
# WAR файл
cp myapp.war $CATALINA_HOME/webapps/

# Директория
cp -r myapp $CATALINA_HOME/webapps/

# Контекст в conf/Catalina/localhost/myapp.xml
<Context path="/myapp" docBase="/path/to/myapp.war"/>
\`\`\`

## Мониторинг

\`\`\`bash
# Статус через manager
http://localhost:8080/manager/status

# Логи
tail -f $CATALINA_HOME/logs/catalina.out
\`\`\`

## Связанные темы

Смотрите также: [[Nginx Configuration]] и [[WebLogic Overview]]`,
    excerpt: "Tomcat: настройка server.xml, JVM, деплой приложений",
    status: "PUBLIC",
    maturity: "SEED",
  },
  {
    title: "IIS настройка",
    slug: "iis-setup",
    content: `# IIS настройка

Настройка Internet Information Services на Windows Server.

## Установка

\`\`\`powershell
# Установка IIS
Install-WindowsFeature Web-Server -IncludeManagementTools

# Проверка установки
Get-WindowsFeature Web-Server
\`\`\`

## Управление сайтами

\`\`\`powershell
# Создание сайта
New-Website -Name "MySite" -PhysicalPath "C:\\inetpub\\wwwroot\\mysite" -Port 80 -HostHeader "mysite.local"

# Список сайтов
Get-Website

# Запуск/остановка
Start-Website -Name "MySite"
Stop-Website -Name "MySite"

# Удаление
Remove-Website -Name "MySite"
\`\`\`

## Application Pools

\`\`\`powershell
# Создание пула
New-WebAppPool -Name "MyAppPool"

# Настройка пула
Set-ItemProperty "IIS:\\AppPools\\MyAppPool" -Name processModel.identityType -Value NetworkService
Set-ItemProperty "IIS:\\AppPools\\MyAppPool" -Name recycling.periodicRestart.time -Value "1.05:00:00"

# Перезапуск пула
Restart-WebAppPool -Name "MyAppPool"
\`\`\`

## Конфигурация через web.config

\`\`\`xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="HTTP to HTTPS" stopProcessing="true">
          <match url="(.*)" />
          <conditions>
            <add input="{HTTPS}" pattern="^OFF$" />
          </conditions>
          <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
    </staticContent>
  </system.webServer>
</configuration>
\`\`\`

## SSL/TLS

\`\`\`powershell
# Получить сертификат
Import-PfxCertificate -FilePath "cert.pfx" -CertStoreLocation Cert:\\LocalMachine\\My -Password (ConvertTo-SecureString "password" -AsPlainText -Force)

# Привязка к сайту
New-WebBinding -Name "MySite" -Protocol https -Port 443 -SslCertificateThumbprint "thumbprint"
\`\`\`

## Мониторинг

\`\`\`powershell
# Логи IIS
C:\\inetpub\\logs\\LogFiles

# Текущие соединения
Get-WebRequest -SiteName "MySite"
\`\`\`

## Связанные темы

Смотрите также: [[Nginx Configuration]] и [[Tomcat Configuration]]`,
    excerpt: "IIS: управление сайтами, application pools, SSL, web.config",
    status: "PUBLIC",
    maturity: "SEED",
  },

  // ===========================================
  // 7. Мониторинг и логирование
  // ===========================================
  {
    title: "ELK Stack основы",
    slug: "elk-stack-basics",
    content: `# ELK Stack основы

Мониторинг и логирование с Elasticsearch, Logstash, Kibana.

## Компоненты

- **Elasticsearch** — поисковый движок и хранилище
- **Logstash** — сбор и обработка логов
- **Kibana** — визуализация
- **Beats** — агенты для сбора данных

## docker-compose.yml

\`\`\`yaml
version: '3.7'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - es_data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    ports:
      - "5044:5044"
      - "9600:9600"
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200
    depends_on:
      - elasticsearch

volumes:
  es_data:
\`\`\`

## Logstash pipeline

\`\`\`ruby
input {
  beats {
    port => 5044
  }
  tcp {
    port => 5000
  }
}

filter {
  grok {
    match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{GREEDYDATA:log}" }
  }
  date {
    match => [ "timestamp", "ISO8601" ]
  }
  mutate {
    remove_field => [ "timestamp" ]
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "app-logs-%{+YYYY.MM.dd}"
  }
}
\`\`\`

## Filebeat конфигурация

\`\`\`yaml
filebeat.inputs:
- type: log
  paths:
    - /var/log/*.log
    - /var/log/nginx/*.log

output.logstash:
  hosts: ["logstash:5044"]

processors:
  - add_host_metadata:
      when.not.contains.tags: forwarded
  - add_docker_metadata: ~
\`\`\`

## Kibana запросы

\`\`\`kql
# Поиск ошибок
level: "ERROR"

# Фильтр по времени
@timestamp: [now-1h TO now]

# Агрегация
avg(response_time) by uri
\`\`\`

## Связанные темы

Смотрите также: [[Prometheus Grafana]] и [[Docker Basics]]`,
    excerpt: "ELK Stack: Elasticsearch, Logstash, Kibana, Filebeat",
    status: "PUBLIC",
    maturity: "SAPLING",
  },
  {
    title: "Prometheus и Grafana",
    slug: "prometheus-grafana",
    content: `# Prometheus и Grafana

Мониторинг инфраструктуры и приложений.

## Архитектура

- **Prometheus** — сбор и хранение метрик
- **Exporters** — агенты для сбора метрик
- **Alertmanager** — управление алертами
- **Grafana** — визуализация

## docker-compose.yml

\`\`\`yaml
version: '3.7'
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./prometheus/rules:/etc/prometheus/rules
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

volumes:
  prometheus_data:
  grafana_data:
\`\`\`

## Prometheus конфигурация

\`\`\`yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'blackbox'
    metrics_path: /probe
    params:
      module: [http_2xx]
    static_configs:
      - targets: ['https://example.com']
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: blackbox-exporter:9115
\`\`\`

## Node Exporter

\`\`\`bash
docker run -d --name node-exporter -p 9100:9100 prom/node-exporter
\`\`\`

## Связанные темы

Смотрите также: [[ELK Stack Basics]] и [[Docker Compose]]`,
    excerpt: "Prometheus: сбор метрик, Grafana: визуализация, Alertmanager",
    status: "PUBLIC",
    maturity: "SAPLING",
  },

  // ===========================================
  // 8. Автоматизация
  // ===========================================
  {
    title: "Bash скриптинг",
    slug: "bash-scripting",
    content: `# Bash скриптинг

Автоматизация задач с помощью Bash скриптов.

## Основы

\`\`\`bash
#!/bin/bash

# Переменные
NAME="World"
echo "Hello, $NAME!"

# Аргументы
echo "First arg: $1"
echo "All args: $@"
echo "Number of args: $#"

# Выход с кодом
exit 0  # успех
exit 1  # ошибка
\`\`\`

## Условия

\`\`\`bash
# Проверка файлов
if [ -f "/path/to/file" ]; then
    echo "File exists"
fi

# Проверка директорий
if [ -d "/path/to/dir" ]; then
    echo "Directory exists"
fi

# Числовые сравнения
if [ $a -eq $b ]; then  # равно
if [ $a -ne $b ]; then  # не равно
if [ $a -gt $b ]; then  # больше
if [ $a -lt $b ]; then  # меньше

# Строковые сравнения
if [ "$a" = "$b" ]; then
if [ -z "$var" ]; then  # пустая строка
if [ -n "$var" ]; then  # не пустая
\`\`\`

## Циклы

\`\`\`bash
# For цикл
for i in {1..5}; do
    echo "Iteration $i"
done

for file in *.txt; do
    echo "Processing $file"
done

# While цикл
counter=0
while [ $counter -lt 5 ]; do
    echo $counter
    counter=$((counter + 1))
done

# Чтение файла
while IFS= read -r line; do
    echo "$line"
done < file.txt
\`\`\`

## Функции

\`\`\`bash
function greet() {
    local name="$1"
    echo "Hello, $name!"
}

greet "World"

# Возврат значения
function get_sum() {
    local a=$1
    local b=$2
    echo $((a + b))
}

result=$(get_sum 5 3)
echo "Sum: $result"
\`\`\`

## Практические примеры

\`\`\`bash
#!/bin/bash
# Бэкап файлов

BACKUP_DIR="/backup"
SOURCE_DIR="/var/www"

timestamp=$(date +%Y%m%d_%H%M%S)
backup_name="backup_$timestamp.tar.gz"

tar -czf "$BACKUP_DIR/$backup_name" "$SOURCE_DIR"

if [ $? -eq 0 ]; then
    echo "Backup created: $backup_name"
    find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +7 -delete
else
    echo "Backup failed!"
    exit 1
fi
\`\`\`

## Связанные темы

Смотрите также: [[Python for DevOps]] и [[Linux Command Line Basics]]`,
    excerpt: "Bash: переменные, условия, циклы, функции, практические примеры",
    status: "PUBLIC",
    maturity: "SEED",
  },
  {
    title: "Python для DevOps",
    slug: "python-for-devops",
    content: `# Python для DevOps

Автоматизация с Python.

## Работа с файлами

\`\`\`python
import os
import shutil
from pathlib import Path

# Чтение файла
with open('file.txt', 'r') as f:
    content = f.read()

# Запись файла
with open('output.txt', 'w') as f:
    f.write('Hello, World!')

# Работа с путями
path = Path('/path/to/file')
print(path.exists())
print(path.is_file())
print(path.name)

# Копирование
shutil.copy('src.txt', 'dst.txt')
shutil.rmtree('directory')
\`\`\`

## Работа с процессами

\`\`\`python
import subprocess

# Выполнение команды
result = subprocess.run(
    ['ls', '-la'],
    capture_output=True,
    text=True
)
print(result.stdout)
print(result.returncode)

# Выполнение с shell
result = subprocess.run(
    'ls -la | grep txt',
    shell=True,
    capture_output=True,
    text=True
)

# Выполнение в реальном времени
process = subprocess.Popen(
    ['tail', '-f', 'log.txt'],
    stdout=subprocess.PIPE,
    text=True
)
for line in process.stdout:
    print(line, end='')
\`\`\`

## HTTP запросы

\`\`\`python
import requests

# GET запрос
response = requests.get('https://api.example.com/data')
print(response.json())

# POST запрос
data = {'key': 'value'}
response = requests.post('https://api.example.com/create', json=data)
print(response.status_code)

# С заголовками
headers = {'Authorization': 'Bearer token'}
response = requests.get('https://api.example.com/protected', headers=headers)
\`\`\`

## Работа с JSON

\`\`\`python
import json

# Чтение JSON
with open('data.json', 'r') as f:
    data = json.load(f)

# Запись JSON
with open('output.json', 'w') as f:
    json.dump(data, f, indent=2)

# Работа с API
api_data = {'name': 'test', 'value': 123}
json_str = json.dumps(api_data)
\`\`\`

## Практический пример: деплой

\`\`\`python
import subprocess
import requests
import time

def deploy_app(version):
    print(f"Deploying version {version}...")
    
    # Сборка
    subprocess.run(['docker', 'build', '-t', f'app:{version}', '.'], check=True)
    
    # Остановка старого контейнера
    subprocess.run(['docker', 'stop', 'app'], check=False)
    
    # Запуск нового
    subprocess.run([
        'docker', 'run', '-d',
        '--name', 'app',
        '-p', '3000:3000',
        f'app:{version}'
    ], check=True)
    
    # Проверка здоровья
    for _ in range(10):
        try:
            response = requests.get('http://localhost:3000/health')
            if response.status_code == 200:
                print("Deployment successful!")
                return True
        except:
            pass
        time.sleep(2)
    
    print("Health check failed!")
    return False

if __name__ == '__main__':
    deploy_app('v1.0.0')
\`\`\`

## Связанные темы

Смотрите также: [[Bash Scripting]] и [[Docker Basics]]`,
    excerpt: "Python: файлы, процессы, HTTP, JSON, практические примеры",
    status: "PUBLIC",
    maturity: "SAPLING",
  },

  // ===========================================
  // 9. DevOps/ITIL/Agile
  // ===========================================
  {
    title: "CI/CD основы",
    slug: "cicd-basics",
    content: `# CI/CD основы

Непрерывная интеграция и доставка.

## CI (Continuous Integration)

- Автоматическая сборка при пуше в репозиторий
- Автоматические тесты
- Уведомления о результатах

## CD (Continuous Delivery/Deployment)

- **Delivery** — автоматический деплой в staging
- **Deployment** — автоматический деплой в production

## GitHub Actions пример

\`\`\`yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linter
      run: npm run lint
    
    - name: Run tests
      run: npm test
    
    - name: Build
      run: npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v1
      with:
        host: \${{ secrets.HOST }}
        username: \${{ secrets.USERNAME }}
        key: \${{ secrets.SSH_KEY }}
        script: |
          cd /var/www/app
          docker-compose pull
          docker-compose up -d
\`\`\`

## GitLab CI пример

\`\`\`yaml
stages:
  - build
  - test
  - deploy

build:
  stage: build
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/

test:
  stage: test
  script:
    - npm test

deploy_staging:
  stage: deploy
  script:
    - docker build -t app:\$CI_COMMIT_SHA .
    - docker push registry.example.com/app:\$CI_COMMIT_SHA
  environment:
    name: staging
    url: https://staging.example.com

deploy_production:
  stage: deploy
  script:
    - docker build -t app:\$CI_COMMIT_SHA .
    - docker push registry.example.com/app:\$CI_COMMIT_SHA
  environment:
    name: production
    url: https://example.com
  when: manual
\`\`\`

## Jenkinsfile

\`\`\`groovy
pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                sh 'npm ci'
                sh 'npm run build'
            }
        }
        
        stage('Test') {
            steps {
                sh 'npm test'
            }
            post {
                always {
                    junit 'test-results/*.xml'
                }
            }
        }
        
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                sh 'docker build -t app:\${env.GIT_COMMIT} .'
                sh 'docker push app:\${env.GIT_COMMIT}'
            }
        }
    }
}
\`\`\`

## Связанные темы

Смотрите также: [[Docker Basics]] и [[Agile Methodologies]]`,
    excerpt: "CI/CD: GitHub Actions, GitLab CI, Jenkins, пайплайны",
    status: "PUBLIC",
    maturity: "SAPLING",
  },
  {
    title: "ITIL процессы",
    slug: "itil-processes",
    content: `# ITIL процессы

IT Infrastructure Library — библиотека лучших практик IT-управления.

## Core книги ITIL 4

1. **Service Strategy** — стратегия услуг
2. **Service Design** — проектирование услуг
3. **Service Transition** — переход услуг
4. **Service Operation** — эксплуатация услуг
5. **Continual Service Improvement** — постоянное улучшение

## Ключевые процессы

### Incident Management (Управление инцидентами)

Цель: Восстановление нормальной работы услуги как можно быстрее

Приоритеты:
- P1 (Critical) — 1 час
- P2 (High) — 4 часа
- P3 (Medium) — 8 часов
- P4 (Low) — 24 часа

Жизненный цикл инцидента:
Detected → Logged → Categorized → Prioritized → Assigned → Investigated → Resolved → Closed

### Problem Management (Управление проблемами)

Цель: Предотвращение инцидентов и минимизация их влияния

Типы проблем:
- Known Error — известная ошибка с workaround
- Root Cause — требует изменения в инфраструктуре

### Change Management (Управление изменениями)

Типы изменений:
- Normal — стандартный процесс (RFC)
- Standard — предapproved изменения
- Emergency — срочные изменения (CAB review после)

CAB (Change Advisory Board):
- Председатель
- Представители IT
- Бизнес-представители
- Представители безопасности

### Service Desk

Функции:
- Единая точка контакта
- Регистрация инцидентов
- Эскалация
- Коммуникация с пользователями

Типы сервис деска:
- Centralized — один центр
- Local — несколько локальных
- Follow-the-sun — 24/7 по часовым поясам
- Virtual — распределённая команда

## Метрики

- MTTR (Mean Time To Recovery) — среднее время восстановления
- MTBF (Mean Time Between Failures) — среднее время между отказами
- SLA (Service Level Agreement) — соглашение об уровне сервиса
- CSI (Customer Satisfaction Index) — индекс удовлетворённости

## Связанные темы

Смотрите также: [[Agile Methodologies]] и [[DevOps Culture]]`,
    excerpt: "ITIL: Incident, Problem, Change Management, Service Desk",
    status: "PUBLIC",
    maturity: "SEED",
  },
  {
    title: "Agile методологии",
    slug: "agile-methodologies",
    content: `# Agile методологии

Гибкие методологии разработки ПО.

## Agile Manifesto

1. **Individuals and interactions** over processes and tools
2. **Working software** over comprehensive documentation
3. **Customer collaboration** over contract negotiation
4. **Responding to change** over following a plan

## Scrum

Роли:
- Product Owner — владелец продукта
- Scrum Master — фасилитатор
- Development Team — команда разработки

Артефакты:
- Product Backlog — бэклог продукта
- Sprint Backlog — бэклог спринта
- Increment — инкремент

События:
- Sprint — итерация (1-4 недели)
- Sprint Planning — планирование спринта
- Daily Scrum — ежедневный стендап (15 мин)
- Sprint Review — демо
- Sprint Retrospective — ретроспектива

## Kanban

Доска Kanban:
[To Do] → [In Progress] → [Review] → [Done]

Принципы:
- Визуализация рабочего процесса
- Ограничение WIP (Work In Progress)
- Управление потоком
- Политика очередей
- Обратная связь

## Sprint Planning пример

## Sprint 15 Planning

Goal: Реализовать систему оплаты

PBI (Product Backlog Items):
1. [P1] Интеграция с платёжной системой - 8 points
2. [P1] API для создания платежей - 5 points
3. [P2] История платежей - 5 points
4. [P2] Уведомления о статусе - 3 points

Team Capacity: 40 story points
Selected: 21 points

Team:
- Backend: 2 developers
- Frontend: 1 developer
- QA: 1 tester

## Definition of Done (DoD)

- [ ] Код написан и закоммичен
- [ ] Code Review пройден
- [ ] Unit тесты написаны (>80% coverage)
- [ ] Интеграционные тесты пройдены
- [ ] Документация обновлена
- [ ] Деплой на staging выполнен
- [ ] QA подтвердил готовность

## Связанные темы

Смотрите также: [[CI/CD Basics]] и [[ITIL Processes]]`,
    excerpt: "Agile: Scrum, Kanban, Sprint Planning, DoD",
    status: "PUBLIC",
    maturity: "SEED",
  },

  // ===========================================
  // 10. Банковские процессы и ДБО
  // ===========================================
  {
    title: "ДБО системы обзор",
    slug: "dbo-systems-overview",
    content: `# ДБО системы обзор

Дистанционное банковское обслуживание (ДБО) — комплексные системы для удалённого управления банковскими услугами.

## Типы ДБО систем

### Интернет-банкинг (IB)
- Доступ через веб-браузер
- Аутентификация по логину/паролю + SMS/токен
- Просмотр счетов, переводы, оплата услуг

### Мобильный банкинг (MB)
- Мобильные приложения (iOS/Android)
- Биометрическая аутентификация
- Push-уведомления

### Телебанк
- Голосовое меню (IVR)
- DTMF команды
- Операторы контакт-центра

## Архитектура ДБО

\`\`\`
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Клиент     │────▶│  Frontend   │────▶│  Backend    │
│  (Web/App)  │     │  (Web/App)  │     │  API        │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
              ┌─────▼─────┐            ┌───────▼───────┐          ┌───────▼───────┐
              │  АБС     │            │  Карточный    │          │  Внешние      │
              │  (ЦОД)   │            │  процессинг   │          │  системы      │
              └───────────┘            └───────────────┘          └───────────────┘
\`\`\`

## Основные функции

- Просмотр остатков и выписок
- Переводы между счетами
- Переводы в другие банки (СПФР)
- Оплата коммунальных услуг
- Валютные операции
- Открытие депозитов
- Оформление кредитов

## Безопасность

\`\`\`
Многофакторная аутентификация:
1. Что знает (пароль)
2. Что имеет (токен, телефон)
3. Кто есть (биометрия)

Защита сессии:
- HTTPS/TLS шифрование
- Session timeout
- Привязка к IP/MAC
- Device fingerprint
\`\`\`

## Связанные темы

Смотрите также: [[Banking Security]] и [[Payment Systems]]`,
    excerpt: "ДБО: интернет-банкинг, мобильный банкинг, архитектура, безопасность",
    status: "PUBLIC",
    maturity: "SAPLING",
  },
  {
    title: "Банковская безопасность",
    slug: "banking-security",
    content: `# Банковская безопасность

Комплекс мер по защите банковских систем и данных.

## Уровни безопасности

### Физическая безопасность
- Охрана ЦОД
- Контроль доступа
- Видеонаблюдение
- Резервное питание

### Сетевая безопасность
- Firewall
- IDS/IPS
- VPN
- Сегментация сетей

### Прикладная безопасность
- WAF (Web Application Firewall)
- SAST (Static Application Security Testing)
- DAST (Dynamic Application Security Testing)
- Пентесты

## Стандарты безопасности

### PCI DSS
- Стандарт безопасности платёжных карт
- Требования к хранению данных карт
- Шифрование данных

### ГОСТ Р 57580.1
- Базовый уровень защиты информации
- Повышенный уровень защиты
- Усиленный уровень защиты

## Связанные темы

Смотрите также: [[DBO Systems Overview]] и [[Payment Systems]]`,
    excerpt: "Банковская безопасность: уровни защиты, PCI DSS, ГОСТ",
    status: "PUBLIC" as const,
    maturity: "SEED" as const,
  },
] as const;

async function main() {
  console.log("🌱 Seed dev notes...");

  // Get or create default admin user
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "admin@local",
        name: "Admin",
        password: "hashed",
        role: "ADMIN",
      },
    });
  }
  console.log("✅ Admin user ready");

  // Create notes
  for (const note of devNotes) {
    await prisma.note.upsert({
      where: { slug: note.slug },
      update: note,
      create: {
        ...note,
        authorId: user.id,
      },
    });
    console.log(`✅ Created note: ${note.title}`);
  }

  console.log("🎉 Dev seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
