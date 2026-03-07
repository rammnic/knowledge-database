/**
 * Worker thread для асинхронного парсинга JSON
 * Не блокирует main event loop
 */

import { parentPort, workerData } from 'worker_threads';

if (parentPort) {
  // Слушаем сообщения от основного потока
  parentPort.on('message', ({ jsonString, requestId }) => {
    try {
      const parsed = JSON.parse(jsonString);
      parentPort!.postMessage({ success: true, data: parsed, requestId });
    } catch (error) {
      parentPort!.postMessage({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId 
      });
    }
  });
}
