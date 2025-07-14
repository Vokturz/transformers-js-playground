import { useState, useRef, useEffect, useCallback } from 'react'
import {
  ClassificationOutput,
  TextClassificationWorkerInput,
  WorkerMessage
} from '../types'
import { useModel } from '../contexts/ModelContext'
import { getWorker } from '../lib/workerManager'

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
  const [results, setResults] = useState<ClassificationOutput[]>([])
  const { status, setStatus, modelInfo } = useModel()
  const workerRef = useRef<Worker | null>(null)


  // We use the `useEffect` hook to setup the worker as soon as the component is mounted.
  useEffect(() => {
    if (!workerRef.current) {
      workerRef.current = getWorker('text-classification')
    }

    // Create a callback function for messages from the worker thread.
    const onMessageReceived = (e: MessageEvent<WorkerMessage>) => {
      const status = e.data.status
      if (status === 'ready') {
        setStatus('ready')
      } else if (status === 'output') {
        setStatus('output')
        const result = e.data.output!
        setResults((prevResults) => [...prevResults, result])
        console.log(result)
      } else if (status === 'error') {
        setStatus('error')
        console.error(e.data.output)
      }
    }

    // Attach the callback function as an event listener.
    workerRef.current?.addEventListener('message', onMessageReceived)

    // Define a cleanup function for when the component is unmounted.
    return () =>
      workerRef.current?.removeEventListener('message', onMessageReceived)
  }, [setStatus])

  const classify = useCallback(() => {
    if (!modelInfo) return
    setStatus('loading')
    setResults([]) // Clear previous results
    const message: TextClassificationWorkerInput = {
      type: 'classify',
      text,
      model: modelInfo.id
    }
    workerRef.current?.postMessage(message)
  }, [text, modelInfo, setStatus])

  const busy: boolean = status !== 'ready'

  const handleClear = (): void => {
    setResults([])
  }

  return (
    <div className="flex flex-col h-[60vh] max-h-[100vh] w-full p-4">
      <h1 className="text-2xl font-bold mb-4">Text Classification</h1>

      <div className="flex flex-col lg:flex-row gap-4 h-full">
        {/* Input Section */}
        <div className="flex flex-col w-full lg:w-1/2">
          <label className="text-lg font-medium mb-2">Input Text:</label>
          <textarea
            className="border border-gray-300 rounded p-3 flex-grow resize-none"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to classify (one per line)..."
          />

          <div className="flex gap-2 mt-4">
            <button
              className="flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 rounded text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={busy}
              onClick={classify}
            >
              {status === 'ready'
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

        {/* Results Section */}
        <div className="flex flex-col w-full lg:w-1/2">
          <label className="text-lg font-medium mb-2">
            Classification Results ({results.length}):
          </label>

          <div className="border border-gray-300 rounded p-3 flex-grow overflow-y-auto">
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
