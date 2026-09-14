/* eslint-disable no-restricted-globals */
import {
  pipeline,
  InterruptableStoppingCriteria
} from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0'

import { createPipelineFactory, listen } from './runtime.js'

const MyTextGenerationPipeline = createPipelineFactory(
  (model, options) => pipeline('text-generation', model, options),
  { report: (message) => self.postMessage(message) }
)

const stoppingCriteria = new InterruptableStoppingCriteria()

listen(async (event) => {
  try {
    const {
      type,
      model,
      dtype,
      messages,
      prompt,
      hasChatTemplate,
      config = {}
    } = event.data

    if (type === 'stop') {
      stoppingCriteria.interrupt()
      return
    }

    if (!model) {
      self.postMessage({
        status: 'error',
        output: 'No model provided'
      })
      return
    }

    // Retrieve the pipeline. This will download the model if not already cached.
    const generator = await MyTextGenerationPipeline.getInstance(
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

    if (type === 'generate') {
      let inputText = ''

      if (hasChatTemplate && messages && messages.length > 0) {
        inputText = messages
      } else if (!hasChatTemplate && prompt) {
        inputText = prompt
      } else {
        self.postMessage({ status: 'ready' })
        return
      }

      const options = {
        max_new_tokens: config.max_new_tokens ?? 100,
        temperature: config.temperature ?? 0.7,
        do_sample: config.do_sample !== false,
        ...(config.top_p != null && { top_p: config.top_p }),
        ...(config.top_k != null && { top_k: config.top_k })
      }

      stoppingCriteria.reset()

      try {
        const output = await generator(inputText, {
          ...options,
          stopping_criteria: stoppingCriteria
        })

        // v4 returns a single object for non-batched inputs and an array for batched ones
        const result = Array.isArray(output) ? output[0] : output

        if (hasChatTemplate) {
          // For chat mode, extract only the assistant's response
          self.postMessage({
            status: 'output',
            output: result.generated_text.slice(-1)[0]
          })
        } else {
          self.postMessage({
            status: 'output',
            output: {
              role: 'assistant',
              content: result.generated_text
            }
          })
        }

        self.postMessage({ status: 'ready' })
      } catch (error) {
        if (error.name === 'AbortError') {
          self.postMessage({ status: 'ready' })
        } else {
          throw error
        }
      } finally {
        stoppingCriteria.reset()
      }
    }
  } catch (error) {
    self.postMessage({
      status: 'error',
      output: error.message || 'An error occurred during text generation'
    })
  }
})
