import { useState, useCallback, useEffect } from 'react'
import {
  ClassificationOutput,
  TextClassificationWorkerInput,
  WorkerMessage
} from '../../types'
import { useModel } from '../../contexts/ModelContext'
import { useTextClassification } from '../../contexts/TextClassificationContext'

const PLACEHOLDER_TEXTS: string[] = [
  'I absolutely love this product! It exceeded all my expectations.',
  "This is the worst purchase I've ever made. Complete waste of money.",
  'The service was okay, nothing special but not terrible either.',
  'Amazing quality and fast delivery. Highly recommended!',
  "I'm not sure how I feel about this. It's decent but could be better.",
  'Terrible customer service. They were rude and unhelpful.',
  "Great value for money. I'm very satisfied with my purchase.",
  'The product arrived damaged and the return process was a nightmare.',
  'Pretty good overall. A few minor issues but mostly positive experience.',
  'Outstanding! This company really knows how to treat their customers.'
].sort(() => Math.random() - 0.5)

function TextClassification() {
  const [text, setText] = useState<string>(PLACEHOLDER_TEXTS.join('\n'))
  const [numberExamples, setNumberExamples] = useState(PLACEHOLDER_TEXTS.length)
  const [results, setResults] = useState<ClassificationOutput[]>([])
  const {
    activeWorker,
    status,
    setStatus,
    modelInfo,
    hasBeenLoaded,
    selectedQuantization
  } = useModel()
  const { config } = useTextClassification()

  useEffect(() => {
    if (modelInfo?.widgetData) {
      const examples = modelInfo.widgetData.map((e: any) => e.text)
      if (examples.length > 0) {
        setText(examples.join('\n'))
      }
    }
  }, [modelInfo])

  useEffect(() => {
    setNumberExamples(text.split('\n').length)
  }, [text])

  const classify = useCallback(() => {
    if (!modelInfo || !activeWorker) {
      console.error('Model info or worker is not available')
      return
    }
    setResults([]) // Clear previous results
    const message: TextClassificationWorkerInput = {
      type: 'classify',
      text,
      model: modelInfo.id,
      dtype: selectedQuantization ?? 'fp32',
      config
    }
    activeWorker.postMessage(message)
  }, [text, modelInfo, activeWorker, selectedQuantization, config, setResults])

  // Handle worker messages
  useEffect(() => {
    if (!activeWorker) return

    const onMessageReceived = (e: MessageEvent<WorkerMessage>) => {
      const status = e.data.status
      if (status === 'output') {
        setStatus('output')
        const result = e.data.output!
        setResults((prev: ClassificationOutput[]) => [...prev, result])
      }
    }

    activeWorker.addEventListener('message', onMessageReceived)
    return () => activeWorker.removeEventListener('message', onMessageReceived)
  }, [activeWorker, setStatus])

  const busy: boolean = status !== 'ready'

  const handleClear = (): void => {
    setResults([])
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100dvh-128px)] w-full p-4">
      <h1 className="text-2xl font-bold mb-4 shrink-0">Text Classification</h1>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0 overflow-hidden">
        {/* Input Section */}
        <div className="flex flex-col w-full lg:w-1/2 min-h-0 max-h-[50vh] lg:max-h-none">
          <label className="text-lg font-medium mb-2 shrink-0">
            Input Text ({numberExamples} examples):
          </label>

          <div className="flex flex-col flex-1 min-h-0">
            <textarea
              className="border border-gray-300 rounded-sm p-3 flex-1 resize-none min-h-[200px] lg:min-h-[250px]"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to classify (one per line)..."
            />

            <div className="flex gap-2 mt-4 shrink-0">
              <button
                className="flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 rounded-sm text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={busy}
                onClick={classify}
              >
                {hasBeenLoaded
                  ? !busy
                    ? 'Classify Text'
                    : 'Processing...'
                  : 'Load model first'}
              </button>
              <button
                className="py-2 px-4 bg-gray-500 hover:bg-gray-600 rounded-sm text-white font-medium transition-colors"
                onClick={handleClear}
              >
                Clear Results
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="flex flex-col w-full lg:w-1/2 min-h-0 max-h-[50vh] lg:max-h-none">
          <label className="text-lg font-medium mb-2 shrink-0">
            Classification Results ({results.length}):
          </label>

          <div className="border border-gray-300 rounded-sm p-3 flex-1 overflow-y-auto min-h-[200px] lg:min-h-[250px]">
            {results.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No results yet. Click "Classify Text" to analyze your input.
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div key={index} className="p-3 rounded-sm border-2">
                    <div className="text-sm text-gray-700 mb-3">
                      {result.sequence}
                    </div>
                    <div className="space-y-2">
                      {result.labels.map(
                        (label: string, labelIndex: number) => {
                          const score = result.scores[labelIndex]
                          const isTopPrediction = labelIndex === 0

                          return (
                            <div
                              key={labelIndex}
                              className={`flex justify-between items-center p-2 rounded ${
                                isTopPrediction
                                  ? 'bg-blue-50 border-l-4 border-blue-500'
                                  : 'bg-gray-50'
                              }`}
                            >
                              <span
                                className={`font-medium text-sm ${
                                  isTopPrediction
                                    ? 'text-blue-700'
                                    : 'text-gray-700'
                                }`}
                              >
                                {label}
                              </span>
                              <span
                                className={`text-sm font-mono ${
                                  isTopPrediction
                                    ? 'text-blue-600'
                                    : 'text-gray-600'
                                }`}
                              >
                                {(score * 100).toFixed(1)}%
                              </span>
                            </div>
                          )
                        }
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TextClassification
