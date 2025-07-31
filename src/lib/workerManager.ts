const workers: Record<string, Worker | null> = {}

export const getWorker = (pipeline: string) => {
  if (!workers[pipeline]) {
    let workerUrl: string

    switch (pipeline) {
      case 'text-classification':
        workerUrl = `${process.env.PUBLIC_URL}/workers/text-classification.js`
        break
      case 'zero-shot-classification':
        workerUrl = `${process.env.PUBLIC_URL}/workers/zero-shot-classification.js`
        break
      case 'text-generation':
        workerUrl = `${process.env.PUBLIC_URL}/workers/text-generation.js`
        break
      case 'feature-extraction':
        workerUrl = `${process.env.PUBLIC_URL}/workers/feature-extraction.js`
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
