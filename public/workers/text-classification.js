/* eslint-disable no-restricted-globals */
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.6.3';

class MyTextClassificationPipeline {
  static task = 'text-classification'
  static instance = null

  static async getInstance(model, progress_callback = null) {
    this.instance = pipeline(this.task, model, {
      progress_callback
    })
    return this.instance
  }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
  const { type, model, text } = event.data // Destructure 'type'

  if (!model) {
    self.postMessage({
      status: 'error',
      output: 'No model provided'
    })
    return
  }

  // Retrieve the pipeline. This will download the model if not already cached.
  const classifier = await MyTextClassificationPipeline.getInstance(
    model,
    (x) => {
      self.postMessage({ status: 'progress', output: x })
    }
  )

  if (type === 'load') {
    self.postMessage({ status: 'ready' })
    return
  }

  if (type === 'classify') {
    if (!text) {
      self.postMessage({ status: 'complete' }) // Nothing to process
      return
    }
    const split = text.split('\n')
    for (const line of split) {
      if (line.trim()) {
        const output = await classifier(line)
        self.postMessage({
          status: 'output',
          output: {
            sequence: line,
            labels: [output[0].label],
            scores: [output[0].score]
          }
        })
      }
    }
    self.postMessage({ status: 'complete' })
  }
})
