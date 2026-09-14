import { useState, useCallback, useEffect } from 'react'
import {
  ClassificationOutput,
  TextClassificationWorkerInput,
  WorkerMessage
} from '../../types'
import { useModel } from '../../contexts/ModelContext'
import { useTextClassification } from '../../contexts/TextClassificationContext'
import { BarChart3, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

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
    <div className="flex h-full w-full flex-col overflow-hidden p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex shrink-0 items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold tracking-tight">
          Text Classification
        </h2>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        {/* Input Section */}
        <div className="flex w-full min-h-0 flex-col lg:w-1/2">
          <label className="mb-2 shrink-0 text-sm font-medium text-muted-foreground">
            Input text ({numberExamples} examples)
          </label>
          <div className="flex min-h-0 flex-1 flex-col">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to classify (one per line)…"
              className="min-h-[150px] flex-1 lg:min-h-[250px]"
            />
            <div className="mt-3 flex shrink-0 gap-2">
              <Button
                className="flex-1"
                disabled={busy}
                onClick={classify}
              >
                {hasBeenLoaded ? (
                  busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    'Classify Text'
                  )
                ) : (
                  'Load model first'
                )}
              </Button>
              <Button variant="secondary" onClick={handleClear}>
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="flex w-full min-h-0 flex-col lg:w-1/2">
          <label className="mb-2 shrink-0 text-sm font-medium text-muted-foreground">
            Classification results ({results.length})
          </label>
          <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-muted/30 p-3">
            {results.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No results yet. Click “Classify Text” to analyze your input.
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-border bg-card p-3"
                  >
                    <div className="mb-3 text-sm text-foreground">
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
                              className="flex items-center gap-3"
                            >
                              <span
                                className={cn(
                                  'w-28 shrink-0 truncate text-sm',
                                  isTopPrediction
                                    ? 'font-medium text-foreground'
                                    : 'text-muted-foreground'
                                )}
                                title={label}
                              >
                                {label}
                              </span>
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                <div
                                  className={cn(
                                    'h-full rounded-full',
                                    isTopPrediction
                                      ? 'bg-primary'
                                      : 'bg-muted-foreground/30'
                                  )}
                                  style={{ width: `${score * 100}%` }}
                                />
                              </div>
                              <span
                                className={cn(
                                  'w-14 shrink-0 text-right font-mono text-xs',
                                  isTopPrediction
                                    ? 'text-primary'
                                    : 'text-muted-foreground'
                                )}
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
