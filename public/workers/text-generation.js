/* eslint-disable no-restricted-globals */
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.0'

class MyTextGenerationPipeline {
  static task = 'text-generation'
  static instance = null
  static currentGeneration = null

  static async getInstance(model, dtype = 'fp32', progress_callback = null) {
    try {
      // Try WebGPU first
      this.instance = await pipeline(this.task, model, {
        dtype,
        device: 'webgpu',
        progress_callback
      })
      return this.instance
    } catch (webgpuError) {
      // Fallback to WASM if WebGPU fails
      if (progress_callback) {
        progress_callback({
          status: 'fallback',
          message: 'WebGPU failed, falling back to WASM'
        })
      }
      try {
        this.instance = await pipeline(this.task, model, {
          dtype,
          device: 'wasm',
          progress_callback
        })
        return this.instance
      } catch (wasmError) {
        throw new Error(
          `Both WebGPU and WASM failed. WebGPU error: ${webgpuError.message}. WASM error: ${wasmError.message}`
        )
      }
    }
  }

  static stopGeneration() {
    if (this.currentGeneration) {
      this.currentGeneration.abort()
      this.currentGeneration = null
    }
  }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
  try {
    const { type, model, dtype, messages, prompt, hasChatTemplate, config } =
      event.data

    if (type === 'stop') {
      MyTextGenerationPipeline.stopGeneration()
      self.postMessage({ status: 'ready' })
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
      }
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
        max_new_tokens: config.max_new_tokens || 100,
        temperature: config.temperature || 0.7,
        do_sample: config.do_sample !== false,
        ...(config.top_p && { top_p }),
        ...(config.top_k && { top_k })
      }

      // Create an AbortController for this generation
      const abortController = new AbortController()
      MyTextGenerationPipeline.currentGeneration = abortController

      try {
        const output = await generator(inputText, {
          ...options,
          signal: abortController.signal
        })

        if (hasChatTemplate) {
          // For chat mode, extract only the assistant's response
          self.postMessage({
            status: 'output',
            output: output[0].generated_text.slice(-1)[0]
          })
        } else {
          self.postMessage({
            status: 'output',
            output: {
              role: 'assistant',
              content: output[0].generated_text
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
        MyTextGenerationPipeline.currentGeneration = null
      }
    }
  } catch (error) {
    self.postMessage({
      status: 'error',
      output: error.message || 'An error occurred during text generation'
    })
  }
})
