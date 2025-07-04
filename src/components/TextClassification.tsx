import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ClassificationOutput,
  TextClassificationWorkerInput,
  WorkerMessage,
  ModelInfo
} from '../types';
import { useModel } from '../contexts/ModelContext';
import { getModelInfo } from '../lib/huggingface';


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
].sort(() => Math.random() - 0.5);

function TextClassification() {
  const [text, setText] = useState<string>(PLACEHOLDER_TEXTS.join('\n'))
  const [results, setResults] = useState<ClassificationOutput[]>([])
  const { setProgress, status, setStatus, modelInfo, setModelInfo} = useModel()
  useEffect(() => {
    const modelName = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
    const fetchModelInfo = async () => {
      try {
        const modelInfoResponse = await getModelInfo(modelName)
        console.log(modelInfoResponse)
        let parameters = 0
        if (modelInfoResponse.safetensors) {
          const safetensors = modelInfoResponse.safetensors
          parameters =
            (safetensors.parameters.F16 ||
              safetensors.parameters.F32 ||
              safetensors.parameters.total ||
              0)
        }
        setModelInfo({
          name: modelName,
          architecture: modelInfoResponse.config.architectures[0],
          parameters,
          likes: modelInfoResponse.likes,
          downloads: modelInfoResponse.downloads
        })
      } catch (error) {
        console.error('Error fetching model info:', error)
      }
    }

    fetchModelInfo()
  }, [setModelInfo])

  // Create a reference to the worker object.
  const worker = useRef<Worker | null>(null)

  // We use the `useEffect` hook to setup the worker as soon as the component is mounted.
  useEffect(() => {
    if (!worker.current) {
      // Create the worker if it does not yet exist.
      worker.current = new Worker(
        new URL('../workers/text-classification.js', import.meta.url),
        {
          type: 'module'
        }
      )
    }

    // Create a callback function for messages from the worker thread.
    const onMessageReceived = (e: MessageEvent<WorkerMessage>) => {
      const status = e.data.status
      if (status === 'initiate') {
        setStatus('loading')
      } else if (status === 'ready') {
        setStatus('ready')
      } else if (status === 'progress') {
        setStatus('progress')
        if (
          e.data.output.progress &&
          (e.data.output.file as string).startsWith('onnx')
        )
          setProgress(e.data.output.progress)
      } else if (status === 'output') {
        setStatus('output')
        const result = e.data.output!
        setResults((prevResults) => [...prevResults, result])
        console.log(result)
      } else if (status === 'complete') {
        setStatus('idle')
        setProgress(100)
      } else if (status === 'error') {
        setStatus('error')
        console.error(e.data.output)
      }
    }

    // Attach the callback function as an event listener.
    worker.current.addEventListener('message', onMessageReceived)

    // Define a cleanup function for when the component is unmounted.
    return () =>
      worker.current?.removeEventListener('message', onMessageReceived)
  }, [])

  const classify = useCallback(() => {
    setStatus('processing')
    setResults([]) // Clear previous results
    const message: TextClassificationWorkerInput = { text, model: modelInfo.name }
    worker.current?.postMessage(message)
  }, [text, modelInfo.name])

  const busy: boolean = status !== 'idle'

  const handleClear = (): void => {
    setResults([])
  }

  return (
    <div className="flex flex-col h-[40vh] max-h-[80vh] w-full p-4">
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
              {!busy
                ? 'Classify Text'
                : status === 'loading'
                ? 'Model loading...'
                : 'Processing...'}
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

export default TextClassification;
