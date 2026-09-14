/* eslint-disable no-restricted-globals */
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0'

import { createPipelineFactory, listen } from './runtime.js'

const MyImageClassificationPipeline = createPipelineFactory(
  (model, options) => pipeline('image-classification', model, options),
  { report: (message) => self.postMessage(message) }
)

listen(async (event) => {
  try {
    const { type, image, model, dtype, config } = event.data

    if (type === 'dispose') {
      await MyImageClassificationPipeline.dispose()
      self.postMessage({ status: 'disposed' })
      return
    }

    if (!model) {
      self.postMessage({
        status: 'error',
        output: 'No model provided'
      })
      return
    }

    // Get the pipeline instance
    const classifier = await MyImageClassificationPipeline.getInstance(
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
        output: `Image classification model ${model}, dtype ${dtype} loaded`
      })
      return
    }

    if (type === 'classify') {
      if (!image) {
        self.postMessage({
          status: 'error',
          output: 'No image provided for classification'
        })
        return
      }

      try {
        // Run classification
        const output = await classifier(image, config)

        // Format predictions
        const predictions = output.map((item) => ({
          label: item.label,
          score: item.score
        }))

        self.postMessage({
          status: 'output',
          output: {
            predictions,
            exampleId: event.data.exampleId
          }
        })
      } catch (error) {
        throw error
      }
    }
    self.postMessage({ status: 'ready' })
  } catch (error) {
    self.postMessage({
      status: 'error',
      output:
        error.message || 'An error occurred during pipeline initialization'
    })
  }
})
