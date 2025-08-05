import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Play, Square, Download, Eraser, Loader2, Volume2 } from 'lucide-react'
import { TextToSpeechWorkerInput, WorkerMessage } from '../../types'
import { useModel } from '../../contexts/ModelContext'
import {
  useTextToSpeech,
  AudioResult
} from '../../contexts/TextToSpeechContext'
import AudioPlayer from '../AudioPlayer'

const SAMPLE_TEXTS = [
  'Hello, this is a sample text for text-to-speech synthesis.',
  'Transformers.js makes it easy to run machine learning models in the browser.',
  'The quick brown fox jumps over the lazy dog.',
  'Text-to-speech technology converts written text into spoken words using artificial intelligence.'
]

function TextToSpeech() {
  const {
    config,
    audioResults,
    currentText,
    setCurrentText,
    addAudioResult,
    clearAudioResults
  } = useTextToSpeech()

  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false)

  const {
    activeWorker,
    status,
    modelInfo,
    hasBeenLoaded,
    selectedQuantization
  } = useModel()

  const handleSynthesize = useCallback(() => {
    if (!currentText.trim() || !modelInfo || !activeWorker || isSynthesizing)
      return

    setIsSynthesizing(true)

    const message: TextToSpeechWorkerInput = {
      type: 'synthesize',
      text: currentText.trim(),
      model: modelInfo.id,
      dtype: selectedQuantization ?? 'fp32',
      config: {
        speakerEmbeddings: config.speakerEmbeddings
      }
    }

    activeWorker.postMessage(message)
  }, [
    currentText,
    modelInfo,
    activeWorker,
    config,
    isSynthesizing,
    selectedQuantization
  ])

  useEffect(() => {
    if (!activeWorker) return

    const onMessageReceived = (e: MessageEvent<WorkerMessage>) => {
      const { status, output } = e.data
      if (status === 'output' && output) {
        setIsSynthesizing(false)
        const audioResult = {
          audio: new Float32Array(output.audio),
          sampling_rate: output.sampling_rate
        }
        addAudioResult(currentText, audioResult)
      } else if (status === 'ready' || status === 'error') {
        setIsSynthesizing(false)
      }
    }

    activeWorker.addEventListener('message', onMessageReceived)
    return () => activeWorker.removeEventListener('message', onMessageReceived)
  }, [activeWorker, currentText, addAudioResult])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSynthesize()
    }
  }

  const busy = status !== 'ready' || isSynthesizing

  return (
    <div className="flex flex-col min-h-[30dvh] max-h-[calc(100dvh-128px)] w-full p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Text to Speech</h1>
        <button
          onClick={clearAudioResults}
          className="p-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
          title="Clear All Audio"
        >
          <Eraser className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enter text to synthesize:
        </label>
        <textarea
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter your text here... (Press Enter to synthesize, Shift+Enter for new line)"
          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          rows={4}
          disabled={!hasBeenLoaded || isSynthesizing}
        />
      </div>

      <div className="mb-4">
        <div className="flex flex-wrap gap-2 mb-2">
          <span className="text-sm font-medium text-gray-700">
            Quick samples:
          </span>
          {SAMPLE_TEXTS.map((sampleText, index) => (
            <button
              key={index}
              onClick={() => setCurrentText(sampleText)}
              disabled={!hasBeenLoaded || isSynthesizing}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-700 text-xs rounded transition-colors"
            >
              Sample {index + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <button
          onClick={handleSynthesize}
          disabled={!currentText.trim() || busy || !hasBeenLoaded}
          className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
        >
          {isSynthesizing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Synthesizing...
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" />
              Synthesize Speech
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Generated Audio ({audioResults.length}):
          </label>
        </div>
        {audioResults.length > 0 ? (
          <div className="space-y-3">
            {audioResults.map((result, index) => (
              <AudioPlayer
                key={index}
                audio={result.audio}
                samplingRate={result.sampling_rate}
                text={result.text}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="text-gray-500 italic flex flex-col items-center gap-3 p-8 border border-gray-200 rounded-lg bg-gray-50">
            {isSynthesizing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span>Synthesizing speech...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-8 h-8 text-gray-400" />
                <span>Generated audio will appear here</span>
                <span className="text-xs text-gray-400">
                  Enter text and click "Synthesize Speech" to get started
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {!hasBeenLoaded && (
        <div className="text-center text-gray-500 text-sm mt-2">
          Please load a model first to start synthesizing speech
        </div>
      )}
    </div>
  )
}

export default TextToSpeech
