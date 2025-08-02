/* eslint-disable no-restricted-globals */
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.0'

class MyFeatureExtractionPipeline {
  static task = 'feature-extraction'
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
    const { type, model, dtype, texts, config } = event.data

    if (!model) {
      self.postMessage({
        status: 'error',
        output: 'No model provided'
      })
      return
    }

    // Get the pipeline instance
    const extractor = await MyFeatureExtractionPipeline.getInstance(
      model,
      dtype,
      (x) => {
        self.postMessage({ status: 'loading', output: x })
      }
    )

    if (type === 'load') {
      self.postMessage({
        status: 'ready',
        output: `Feature extraction model ${model}, dtype ${dtype} loaded`
      })
      return
    }

    if (type === 'extract') {
      if (!texts || !Array.isArray(texts) || texts.length === 0) {
        self.postMessage({
          status: 'error',
          output: 'No texts provided for feature extraction'
        })
        return
      }

      const embeddings = []

      for (let i = 0; i < texts.length; i++) {
        const text = texts[i]
        try {
          const output = await extractor(text, config)

          // Convert tensor to array and get the embedding
          let embedding
          if (output && typeof output.tolist === 'function') {
            embedding = output.tolist()
          } else if (Array.isArray(output)) {
            embedding = output
          } else if (output && output.data) {
            embedding = Array.from(output.data)
          } else {
            throw new Error('Unexpected output format from feature extraction')
          }

          // If the embedding is 2D (batch dimension), take the first element
          if (Array.isArray(embedding[0])) {
            embedding = embedding[0]
          }

          embeddings.push({
            text: text,
            embedding: embedding,
            index: i
          })

          // Send progress update
          self.postMessage({
            status: 'progress',
            output: {
              completed: i + 1,
              total: texts.length,
              currentText: text,
              embedding: embedding
            }
          })
        } catch (error) {
          embeddings.push({
            text: text,
            embedding: null,
            error: error.message,
            index: i
          })

          self.postMessage({
            status: 'progress',
            output: {
              completed: i + 1,
              total: texts.length,
              currentText: text,
              error: error.message
            }
          })
        }
      }

      self.postMessage({
        status: 'output',
        output: {
          embeddings: embeddings,
          completed: true
        }
      })

      self.postMessage({ status: 'ready' })
    }
  } catch (error) {
    self.postMessage({
      status: 'error',
      output: error.message || 'An error occurred during feature extraction'
    })
  }
})
