const workers: Record<string, Worker | null> = {};

export const getWorker = (pipeline: string) => {
  if (!workers[pipeline]) {
    let workerUrl: string;

    // Construct the public URL for the worker script.
    // process.env.PUBLIC_URL ensures this works correctly even if the
    // app is hosted in a sub-directory.
    switch (pipeline) {
      case 'text-classification':
        workerUrl = `${process.env.PUBLIC_URL}/workers/text-classification.js`;
        break;
      case 'zero-shot-classification':
        workerUrl = `${process.env.PUBLIC_URL}/workers/zero-shot-classification.js`;
        break;
      // Add other pipeline types here
      default:
        // Return null or throw an error if the pipeline is unknown
        return null;
    }
    workers[pipeline] = new Worker(workerUrl, { type: 'module' });
  }
  return workers[pipeline];
};

export const terminateWorker = (pipeline: string) => {
  const worker = workers[pipeline];
  if (worker) {
    worker.terminate();
    delete workers[pipeline];
  }
};