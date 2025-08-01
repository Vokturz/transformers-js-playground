/* eslint-disable no-restricted-globals */
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.6.3'

class MyImageClassificationPipeline {
  static task = 'image-classification'
  static instance = null
  static modelId = null

  static async getInstance(model, dtype = 'fp32', progress_callback = null) {
    if (this.modelId !== model) {
      // Dispose of previous pipeline if model changed
      if (this.instance && this.instance.dispose) {
        this.instance.dispose()
      }
      this.instance = null
      this.modelId = null
    }

    if (!this.instance) {
      try {
        // Try WebGPU first
        this.instance = await pipeline(this.task, model, {
          dtype,
          device: 'webgpu',
          progress_callback
        })
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
        } catch (wasmError) {
          throw new Error(
            `Both WebGPU and WASM failed. WebGPU error: ${webgpuError.message}. WASM error: ${wasmError.message}`
          )
        }
      }
      this.modelId = model
    }

    return this.instance
  }

  static dispose() {
    if (this.instance && this.instance.dispose) {
      this.instance.dispose()
    }
    this.instance = null
    this.modelId = null
  }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
  try {
    const { type, image, model, dtype, topK = 5 } = event.data

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
      }
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
        self.postMessage({ status: 'loading' })

        // Run classification
        const output = await classifier(image, {
          topk: topK
        })

        // Format predictions
        const predictions = output.map((item) => ({
          label: item.label,
          score: item.score
        }))

        self.postMessage({
          status: 'output',
          output: {
            predictions
          }
        })
      } catch (error) {
        self.postMessage({
          status: 'error',
          output:
            error.message || 'An error occurred during image classification'
        })
      }
    } else if (type === 'dispose') {
      MyImageClassificationPipeline.dispose()
      self.postMessage({ status: 'disposed' })
    }
  } catch (error) {
    self.postMessage({
      status: 'error',
      output:
        error.message || 'An error occurred during pipeline initialization'
    })
  }
})

// Handle initialization
self.postMessage({ status: 'ready' })
