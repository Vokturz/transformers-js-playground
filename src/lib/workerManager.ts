const workers: Record<string, Worker | null> = {}

export const getWorker = (pipeline: string) => {
  if (!workers[pipeline]) {
    let workerUrl: string

    switch (pipeline) {
      case 'text-classification':
        workerUrl = `/workers/text-classification.js`
        break
      case 'zero-shot-classification':
        workerUrl = `/workers/zero-shot-classification.js`
        break
      case 'text-generation':
        workerUrl = `/workers/text-generation.js`
        break
      case 'feature-extraction':
        workerUrl = `/workers/feature-extraction.js`
        break
      case 'image-classification':
        workerUrl = `/workers/image-classification.js`
        break
      default:
        return null
    }
    workers[pipeline] = new Worker(workerUrl, { type: 'module' })
  }
  return workers[pipeline]
}

export const terminateWorker = (pipeline: string) => {
  const worker = workers[pipeline]
  if (worker) {
    worker.terminate()
    delete workers[pipeline]
  }
}
