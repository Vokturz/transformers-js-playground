/* eslint-disable no-restricted-globals */
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.6.3'

class MyZeroShotClassificationPipeline {
  static task = 'zero-shot-classification'
  static instance = null

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
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
  try {
    const { type, model, dtype, text, labels } = event.data

    if (!model) {
      self.postMessage({
        status: 'error',
        output: 'No model provided'
      })
      return
    }

    // Retrieve the pipeline. This will download the model if not already cached.
    const classifier = await MyZeroShotClassificationPipeline.getInstance(
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

    if (type === 'classify') {
      if (!text || !labels) {
        self.postMessage({ status: 'ready' }) // Nothing to process
        return
      }

      const split = text.split('\n')
      for (const line of split) {
        if (line.trim()) {
          const output = await classifier(line, labels, {
            hypothesis_template: 'This text is about {}.',
            multi_label: true
          })

          self.postMessage({ status: 'output', output })
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
