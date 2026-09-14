/* eslint-disable no-restricted-globals */
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0'

import { createPipelineFactory, listen } from './runtime.js'

const MyTextToSpeechPipeline = createPipelineFactory(
  (model, options) => pipeline('text-to-speech', model, options),
  { report: (message) => self.postMessage(message) }
)

const MyKokoroTTSPipeline = createPipelineFactory(
  async (model, options) => {
    const { KokoroTTS } =
      await import('https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js')
    return KokoroTTS.from_pretrained(model, options)
  },
  { report: (message) => self.postMessage(message) }
)

listen(async (event) => {
  try {
    const { type, model, dtype, text, isStyleTTS2, config = {} } = event.data

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
        },
        event.data.device
      )
    } else {
      // Use standard transformers pipeline
      synthesizer = await MyTextToSpeechPipeline.getInstance(
        model,
        dtype || 'fp32',
        (x) => {
          self.postMessage({ status: 'loading', output: x })
        },
        event.data.device
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

          options.voice = config.voice || 'af_heart'
          const audioResult = await synthesizer.generate(text.trim(), options)

          output = {
            audio: Array.from(audioResult.audio),
            sampling_rate: audioResult.sampling_rate || 24000 // Default for Kokoro
          }
        } else {
          const options = {}

          if (config?.speakerEmbeddings) {
            const response = await fetch(config.speakerEmbeddings)
            if (!response.ok)
              throw new Error(
                `Failed to load speaker embeddings: ${response.status}`
              )
            options.speaker_embeddings = new Float32Array(
              await response.arrayBuffer()
            )
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
