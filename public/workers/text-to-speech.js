/* eslint-disable no-restricted-globals */
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@latest'
import { KokoroTTS } from 'https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js'

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

class MyKokoroTTSPipeline {
  static instance = null

  static async getInstance(model, dtype = 'fp32', progress_callback = null) {
    try {
      const device = 'webgpu'
      if (progress_callback) {
        progress_callback({
          status: 'loading',
          message: `Loading Kokoro TTS model with ${device} device`
        })
      }

      this.instance = await KokoroTTS.from_pretrained(model, {
        dtype,
        device,
        progress_callback: progress_callback
          ? (data) => {
              progress_callback({
                status: 'loading',
                ...data
              })
            }
          : null
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
        this.instance = await KokoroTTS.from_pretrained(model, {
          dtype,
          device: 'wasm',
          progress_callback: progress_callback
            ? (data) => {
                progress_callback({
                  status: 'loading',
                  ...data
                })
              }
            : null
        })
        return this.instance
      } catch (wasmError) {
        throw new Error(
          `Both WebGPU and WASM failed for Kokoro TTS. WebGPU error: ${webgpuError.message}. WASM error: ${wasmError.message}`
        )
      }
    }
  }
}

self.addEventListener('message', async (event) => {
  try {
    const { type, model, dtype, text, isStyleTTS2, config } = event.data

    if (!model) {
      self.postMessage({
        status: 'error',
        output: 'No model provided'
      })
      return
    }

    let synthesizer
    if (isStyleTTS2) {
      // Use Kokoro TTS for StyleTTS2 models
      synthesizer = await MyKokoroTTSPipeline.getInstance(
        model,
        dtype || 'q8',
        (x) => {
          self.postMessage({ status: 'loading', output: x })
        }
      )
    } else {
      // Use standard transformers pipeline
      synthesizer = await MyTextToSpeechPipeline.getInstance(
        model,
        dtype || 'fp32',
        (x) => {
          self.postMessage({ status: 'loading', output: x })
        }
      )
    }

    if (type === 'load') {
      self.postMessage({
        status: 'ready',
        output: `Model ${model}${isStyleTTS2 ? ' StyleTTS2' : ''}, dtype ${dtype} loaded`
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

      try {
        let output

        if (isStyleTTS2) {
          const options = {}

          options.voice = config.voice
          const audioResult = await synthesizer.generate(text.trim(), options)

          output = {
            audio: Array.from(audioResult.audio),
            sampling_rate: audioResult.sampling_rate || 24000 // Default for Kokoro
          }
        } else {
          const options = {}

          if (config?.speakerEmbeddings) {
            try {
              const response = await fetch(config.speakerEmbeddings)
              if (response.ok) {
                const embeddings = await response.arrayBuffer()
                options.speaker_embeddings = new Float32Array(embeddings)
              }
            } catch (error) {
              console.warn('Failed to load speaker embeddings:', error)
            }
          }

          const result = await synthesizer(text.trim(), options)
          output = {
            audio: Array.from(result.audio),
            sampling_rate: result.sampling_rate
          }
        }

        self.postMessage({
          status: 'output',
          output
        })

        self.postMessage({ status: 'ready' })
      } catch (error) {
        throw error
      }
    }
  } catch (error) {
    self.postMessage({
      status: 'error',
      output:
        error.message || 'An error occurred during text-to-speech synthesis'
    })
  }
})
