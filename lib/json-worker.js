"use strict";
/**
 * Worker thread для асинхронного парсинга JSON
 * Не блокирует main event loop
 */
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
if (worker_threads_1.parentPort) {
    // Слушаем сообщения от основного потока
    worker_threads_1.parentPort.on('message', ({ jsonString, requestId }) => {
        try {
            const parsed = JSON.parse(jsonString);
            worker_threads_1.parentPort.postMessage({ success: true, data: parsed, requestId });
        }
        catch (error) {
            worker_threads_1.parentPort.postMessage({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                requestId
            });
        }
    });
}
