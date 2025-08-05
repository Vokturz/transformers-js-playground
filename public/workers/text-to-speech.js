/* eslint-disable no-restricted-globals */
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@latest'

class MyTextToSpeechPipeline {
  static task = 'text-to-speech'
  static instance = null

  static async getInstance(model, dtype = 'fp32', progress_callback = null) {
    try {
      // Try WebGPU first
      this.instance = await pipeline(this.task, model, {
        dtype,
        device: 'webgpu',
        progress_callback,
        quantized: false
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
          progress_callback,
          quantized: false
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
    const { type, model, dtype, text, config } = event.data

    if (!model) {
      self.postMessage({
        status: 'error',
        output: 'No model provided'
      })
      return
    }

    // Retrieve the pipeline. This will download the model if not already cached.
    const synthesizer = await MyTextToSpeechPipeline.getInstance(
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

    if (type === 'synthesize') {
      if (!text || typeof text !== 'string' || text.trim() === '') {
        self.postMessage({
          status: 'error',
          output: 'No text provided for synthesis'
        })
        return
      }

      const options = {}

      // Add speaker embeddings if provided
      if (config?.speakerEmbeddings) {
        try {
          const response = await fetch(config.speakerEmbeddings)
          if (response.ok) {
            const embeddings = await response.arrayBuffer()
            options.speaker_embeddings = new Float32Array(embeddings)
          }
        } catch (error) {
          console.warn('Failed to load speaker embeddings:', error)
          // Continue without speaker embeddings
        }
      }

      try {
        const output = await synthesizer(text.trim(), options)

        self.postMessage({
          status: 'output',
          output: {
            audio: Array.from(output.audio),
            sampling_rate: output.sampling_rate
          }
        })

        self.postMessage({ status: 'ready' })
      } catch (error) {
        throw error
      }
    }
  } catch (error) {
    self.postMessage({
      status: 'error',
      output: error.message || 'An error occurred during text-to-speech synthesis'
    })
  }
})
