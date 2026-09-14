/* eslint-disable no-restricted-globals */
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0'

import { createPipelineFactory, listen } from './runtime.js'

const MyTextClassificationPipeline = createPipelineFactory(
  (model, options) => pipeline('text-classification', model, options),
  { report: (message) => self.postMessage(message) }
)

listen(async (event) => {
  try {
    const { type, model, dtype, text, config } = event.data

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
      dtype,
      (x) => {
        self.postMessage({ status: 'loading', output: x })
      },
      event.data.device
    )

    if (type === 'load') {
      self.postMessage({
        status: 'ready',
        output: `Model ${model}, dtype ${dtype} loaded`
      })
      return
    }

    if (type === 'classify') {
      if (!text) {
        self.postMessage({ status: 'ready' }) // Nothing to process
        return
      }
      const split = text.split('\n')
      for (const line of split) {
        if (line.trim()) {
          const output = await classifier(line, config)
          self.postMessage({
            status: 'output',
            output: {
              sequence: line,
              labels: output.map((item) => item.label),
              scores: output.map((item) => item.score)
            }
          })
        }
      }
      self.postMessage({ status: 'ready' })
    }
  } catch (error) {
    self.postMessage({
      status: 'error',
      output: error.message || 'An error occurred during processing'
    })
  }
})
