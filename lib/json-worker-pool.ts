/**
 * Worker Pool для асинхронного парсинга JSON
 * Позволяет парсить JSON в отдельных потоках без блокировки event loop
 * Создаёт временный файл worker для совместимости с Next.js
 */

import { Worker } from 'worker_threads';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

interface WorkerMessage {
  success: boolean;
  data?: any;
  error?: string;
  requestId: number;
}

interface PoolOptions {
  poolSize?: number;
  timeout?: number;
}

// Worker code - парсит JSON в отдельном потоке
const WORKER_CODE = `
const { parentPort } = require('worker_threads');

console.log('[Worker] Started, waiting for messages...');

if (parentPort) {
  parentPort.on('message', ({ jsonString, requestId }) => {
    console.log('[Worker] Received message, requestId:', requestId);
    try {
      const parsed = JSON.parse(jsonString);
      console.log('[Worker] Parsed successfully, sending response');
      parentPort.postMessage({ success: true, data: parsed, requestId });
    } catch (error) {
      console.log('[Worker] Parse error:', error.message);
      parentPort.postMessage({ 
        success: false, 
        error: error.message || 'Unknown error',
        requestId 
      });
    }
  });
  
  parentPort.on('error', (error) => {
    console.error('[Worker] Error:', error);
  });
}
`;

class JSONWorkerPool {
  private pool: Worker[] = [];
  private counter = 1; // Начинаем с 1, чтобы избежать проблем с falsy значением 0
  private pending: Map<number, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    jsonString: string;
    startTime: number;
    timeoutId: NodeJS.Timeout;
  }> = new Map();
  // Хранит запросы, которые уже отправлены воркерам (чтобы не отправить их повторно)
  private inProgress: Map<number, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    jsonString: string;
    startTime: number;
    timeoutId: NodeJS.Timeout;
  }> = new Map();
  private activeWorkers: Set<Worker> = new Set();
  private poolSize: number;
  private timeout: number;
  private processing = false;
  private initialized = false;
  private workerFilePath: string;

  constructor(options: PoolOptions = {}) {
    this.poolSize = options.poolSize || 4; // 4 воркера по умолчанию
    this.timeout = options.timeout || 30000; // 30 сек таймаут
    
    // Создаём временный файл worker в системной папке temp
    this.workerFilePath = path.join(os.tmpdir(), 'json-worker-pool.js');
  }

  /**
   * Инициализирует пул воркеров
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[JSONWorkerPool] Already initialized, skipping');
      return;
    }

    // Записываем worker код во временный файл
    try {
      fs.writeFileSync(this.workerFilePath, WORKER_CODE, 'utf-8');
      console.log(`[JSONWorkerPool] Worker file created at: ${this.workerFilePath}`);
    } catch (error) {
      console.error('[JSONWorkerPool] Failed to create worker file:', error);
      throw error;
    }

    // Создаём воркеры из временного файла
    for (let i = 0; i < this.poolSize; i++) {
      try {
        const worker = new Worker(this.workerFilePath);
        this.setupWorkerListeners(worker);
        this.pool.push(worker);
        console.log(`[JSONWorkerPool] Created worker ${i}`);
      } catch (error) {
        console.error(`[JSONWorkerPool] Failed to create worker ${i}:`, error);
      }
    }
    
    this.initialized = true;
    console.log(`[JSONWorkerPool] Initialized with ${this.pool.length} workers`);
  }

  /**
   * Настраивает обработчики сообщений для воркера
   */
  private setupWorkerListeners(worker: Worker): void {
    worker.on('message', (message: WorkerMessage) => {
      // Ищем ожидающий запрос в inProgress (уже отправленный воркеру)
      const data = this.inProgress.get(message.requestId);
      if (data) {
        const duration = Date.now() - data.startTime;
        
        if (message.success) {
          console.log(`[JSONWorkerPool] Parsed in ${duration}ms (requestId: ${message.requestId})`);
          data.resolve(message.data);
        } else {
          console.error(`[JSONWorkerPool] Parse error: ${message.error} (requestId: ${message.requestId})`);
          data.reject(new Error(message.error));
        }
        
        // Удаляем из inProgress
        this.inProgress.delete(message.requestId);
      }

      // Освобождаем воркер
      this.activeWorkers.delete(worker);
      this.processQueue();
    });

    worker.on('error', (error) => {
      console.error('[JSONWorkerPool] Worker error:', error);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`[JSONWorkerPool] Worker exited with code ${code}`);
        // Перезапускаем воркера из временного файла
        const index = this.pool.indexOf(worker);
        if (index !== -1) {
          try {
            const newWorker = new Worker(this.workerFilePath);
            this.setupWorkerListeners(newWorker);
            this.pool[index] = newWorker;
            console.log(`[JSONWorkerPool] Restarted worker ${index}`);
          } catch (error) {
            console.error(`[JSONWorkerPool] Failed to restart worker ${index}:`, error);
          }
        }
      }
    });
  }

  /**
   * Обрабатывает очередь запросов
   */
  private processQueue(): void {
    // Предотвращаем рекурсию
    if (this.processing) return;
    this.processing = true;
    
    try {
      // Если есть свободные воркеры и запросы в очереди
      while (this.pending.size > 0) {
        const availableWorker = this.pool.find(w => !this.activeWorkers.has(w));
        
        if (!availableWorker) {
          break; // Нет свободных воркеров
        }

        // Берём первый pending request (FIFO)
        const entriesIterator = this.pending.entries().next();
        if (entriesIterator.done || !entriesIterator.value) break;
        
        const [requestId, data] = entriesIterator.value;
        // Исправлено: проверяем на undefined/null вместо falsy значения
        // requestId может быть 0, поэтому используем строгое сравнение
        if (requestId === undefined || requestId === null || !data) {
          console.log('[JSONWorkerPool] Skipping invalid request, requestId:', requestId, 'data:', !!data);
          break;
        }

        // Удаляем из pending и переносим в inProgress ДО отправки воркеру
        // Это предотвращает повторную отправку одного и того же запроса
        this.pending.delete(requestId);
        this.inProgress.set(requestId, data);

        this.activeWorkers.add(availableWorker);
        
        // Отправляем задачу воркеру с числовым requestId
        console.log(`[JSONWorkerPool] Sending to worker, requestId: ${requestId}, queue: ${this.pending.size}`);
        availableWorker.postMessage({
          jsonString: data.jsonString,
          requestId: requestId
        });
        console.log(`[JSONWorkerPool] Message sent to worker`);
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Парсит JSON в отдельном потоке
   */
  parseJSON(jsonString: string): Promise<any> {
    const requestId = this.counter++;
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        // Удаляем из pending или inProgress при таймауте
        this.pending.delete(requestId);
        this.inProgress.delete(requestId);
        reject(new Error(`JSON parse timeout after ${this.timeout}ms`));
      }, this.timeout);

      // Сохраняем с числовым requestId
      this.pending.set(requestId, {
        resolve: (value) => {
          clearTimeout(timeoutId);
          resolve(value);
        },
        reject: (reason) => {
          clearTimeout(timeoutId);
          reject(reason);
        },
        jsonString: jsonString,
        startTime: Date.now(),
        timeoutId
      });

      this.processQueue();
    });
  }

  /**
   * Возвращает статистику пула
   */
  getStats(): { poolSize: number; activeWorkers: number; queueLength: number; inProgressCount: number } {
    return {
      poolSize: this.poolSize,
      activeWorkers: this.activeWorkers.size,
      queueLength: this.pending.size,
      inProgressCount: this.inProgress.size
    };
  }

  /**
   * Очищает ресурсы
   */
  async terminate(): Promise<void> {
    for (const worker of this.pool) {
      await worker.terminate();
    }
    this.pool = [];
    this.activeWorkers.clear();
    this.pending.clear();
    this.inProgress.clear();
    console.log('[JSONWorkerPool] Terminated');
  }
}

// Экспортируем singleton инстанс
let poolInstance: JSONWorkerPool | null = null;

export function getJSONWorkerPool(options?: PoolOptions): JSONWorkerPool {
  if (!poolInstance) {
    poolInstance = new JSONWorkerPool(options);
  }
  return poolInstance;
}

export async function initializeJSONWorkerPool(poolSize?: number): Promise<JSONWorkerPool> {
  const pool = getJSONWorkerPool({ poolSize });
  await pool.initialize();
  return pool;
}

export { JSONWorkerPool };