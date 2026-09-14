import { useState, useEffect, useCallback } from 'react'
import { Eraser, Loader2, Volume2, Mic } from 'lucide-react'
import { TextToSpeechWorkerInput, WorkerMessage } from '../../types'
import { useModel } from '../../contexts/ModelContext'
import {
  useTextToSpeech,
  AudioResult
} from '../../contexts/TextToSpeechContext'
import AudioPlayer from '../AudioPlayer'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const SAMPLE_TEXTS = [
  'Hello, this is a sample text for text-to-speech synthesis.',
  'Transformers.js makes it easy to run machine learning models in the browser.',
  'The quick brown fox jumps over the lazy dog.',
  'Text-to-speech technology converts written text into spoken words using artificial intelligence.'
]

function TextToSpeech() {
  const {
    config,
    setConfig,
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
      isStyleTTS2: modelInfo.isStyleTTS2 ?? false,
      config: {
        speakerEmbeddings: config.speakerEmbeddings,
        voice: config.voice
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
        addAudioResult(currentText, audioResult, config.voice)
      } else if (status === 'ready' || status === 'error') {
        setIsSynthesizing(false)
      }
    }

    activeWorker.addEventListener('message', onMessageReceived)
    return () => activeWorker.removeEventListener('message', onMessageReceived)
  }, [activeWorker, currentText, addAudioResult])

  useEffect(() => {
    if (!modelInfo) return
    if (modelInfo && modelInfo?.voices.length > 0)
      setConfig((prev) => ({
        ...prev,
        voice: modelInfo.voices[0]
      }))
  }, [modelInfo])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSynthesize()
    }
  }

  useEffect(() => {
    setIsSynthesizing(false)
  }, [activeWorker])

  const busy = status !== 'ready' || isSynthesizing

  return (
    <div className="flex w-full flex-col p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">
            Text to Speech
          </h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={clearAudioResults}
          title="Clear all audio"
        >
          <Eraser className="h-4 w-4" />
        </Button>
      </div>

      <div className="mb-4 space-y-2">
        <label className="block text-sm font-medium text-muted-foreground">
          Text to synthesize
        </label>
        <Textarea
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter your text here… (Enter to synthesize, Shift+Enter for a new line)"
          rows={4}
          disabled={!hasBeenLoaded || isSynthesizing}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          Quick samples:
        </span>
        {SAMPLE_TEXTS.map((sampleText, index) => (
          <button
            key={index}
            onClick={() => setCurrentText(sampleText)}
            disabled={!hasBeenLoaded || isSynthesizing}
            className="rounded-md border border-border bg-muted/40 px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-ring/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sample {index + 1}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <Button
          onClick={handleSynthesize}
          disabled={!currentText.trim() || busy || !hasBeenLoaded}
          className="w-fit"
        >
          {isSynthesizing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Synthesizing…
            </>
          ) : (
            <>
              <Volume2 className="h-4 w-4" />
              Synthesize Speech
            </>
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mb-2">
          <label className="block text-sm font-medium text-muted-foreground">
            Generated audio ({audioResults.length})
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
                voice={result.voice}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/30 p-8 text-muted-foreground">
            {isSynthesizing ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span>Synthesizing speech…</span>
              </>
            ) : (
              <>
                <Volume2 className="h-8 w-8 text-muted-foreground/50" />
                <span>Generated audio will appear here</span>
                <span className="text-xs text-muted-foreground/70">
                  Enter text and click “Synthesize Speech” to get started
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {!hasBeenLoaded && (
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Load a model first to start synthesizing speech
        </p>
      )}
    </div>
  )
}

export default TextToSpeech
