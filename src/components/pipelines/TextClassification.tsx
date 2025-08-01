import { useState, useCallback, useEffect } from 'react'
import { TextClassificationWorkerInput, WorkerMessage } from '../../types'
import { useModel } from '../../contexts/ModelContext'

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
  const [results, setResults] = useState<any[]>([])
  const {
    activeWorker,
    status,
    setStatus,
    modelInfo,
    hasBeenLoaded,
    selectedQuantization
  } = useModel()

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
      dtype: selectedQuantization ?? 'fp32'
    }
    activeWorker.postMessage(message)
  }, [text, modelInfo, activeWorker, selectedQuantization, setResults])

  // Handle worker messages
  useEffect(() => {
    if (!activeWorker) return

    const onMessageReceived = (e: MessageEvent<WorkerMessage>) => {
      const status = e.data.status
      if (status === 'output') {
        setStatus('output')
        const result = e.data.output!
        setResults((prev: any[]) => [...prev, result])
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
    <div className="flex flex-col h-[60vh] max-h-[100vh] w-full p-4">
      <h1 className="text-2xl font-bold mb-4 flex-shrink-0">
        Text Classification
      </h1>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* Input Section */}
        <div className="flex flex-col w-full lg:w-1/2 min-h-0">
          <label className="text-lg font-medium mb-2 flex-shrink-0">
            Input Text ({numberExamples} examples):
          </label>

          <div className="flex flex-col flex-1 min-h-0">
            <textarea
              className="border border-gray-300 rounded p-3 flex-1 resize-none min-h-[200px]"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to classify (one per line)..."
            />

            <div className="flex gap-2 mt-4 flex-shrink-0">
              <button
                className="flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 rounded text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                className="py-2 px-4 bg-gray-500 hover:bg-gray-600 rounded text-white font-medium transition-colors"
                onClick={handleClear}
              >
                Clear Results
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="flex flex-col w-full lg:w-1/2 min-h-0">
          <label className="text-lg font-medium mb-2 flex-shrink-0">
            Classification Results ({results.length}):
          </label>

          <div className="border border-gray-300 rounded p-3 flex-1 overflow-y-auto min-h-[200px]">
            {results.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No results yet. Click "Classify Text" to analyze your input.
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div key={index} className="p-3 rounded border-2">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-sm">
                        {result.labels[0]}
                      </span>
                      <span className="text-sm font-mono">
                        {(result.scores[0] * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-sm text-gray-700">
                      {result.sequence}
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
