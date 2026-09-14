import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Plus,
  Eraser,
  Loader2,
  X,
  Eye,
  EyeOff,
  Check,
  ScanSearch,
  Sparkles
} from 'lucide-react'
import {
  EmbeddingExample,
  FeatureExtractionWorkerInput,
  WorkerMessage
} from '../../types'
import { useModel } from '../../contexts/ModelContext'
import { useFeatureExtraction } from '../../contexts/FeatureExtractionContext'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface Point2D {
  x: number
  y: number
  id: string
  text: string
  similarity?: number
}

// Sample data for quick testing
const SAMPLE_TEXTS = [
  'The cat sat on the mat',
  'A feline rested on the carpet',
  'I love programming in JavaScript',
  'JavaScript development is my passion',
  'The weather is beautiful today',
  "It's a sunny and warm day outside",
  'Machine learning is transforming technology',
  'AI and deep learning are revolutionizing computing',
  'I enjoy reading books in the evening',
  'Pizza is one of my favorite foods'
]

function FeatureExtraction() {
  const {
    examples,
    setExamples,
    setSimilarities,
    selectedExample,
    setSelectedExample,
    similarities,
    addExample,
    removeExample,
    updateExample,
    calculateSimilarities,
    clearExamples,
    config
  } = useFeatureExtraction()

  const [newExampleText, setNewExampleText] = useState<string>('')
  const [isExtracting, setIsExtracting] = useState<boolean>(false)
  const [showVisualization, setShowVisualization] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768
    }
    return true
  })

  const [progress, setProgress] = useState<{
    completed: number
    total: number
  } | null>(null)

  const {
    activeWorker,
    status,
    modelInfo,
    hasBeenLoaded,
    selectedQuantization
  } = useModel()

  useEffect(() => {
    const handleResize = () => {
      setShowVisualization(window.innerWidth >= 768)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const chartRef = useRef<SVGSVGElement>(null)

  // PCA reduction to 2D for visualization
  const reduceTo2D = useCallback(
    (embeddings: number[][]): Point2D[] => {
      if (embeddings.length === 0) return []

      // For simplicity, just use first 2 dimensions if available, or random projection
      const points: Point2D[] = examples
        .filter((ex) => ex.embedding)
        .map((example, i) => {
          const emb = example.embedding!
          let x, y

          if (emb.length >= 2) {
            x = emb[0]
            y = emb[1]
          } else {
            // Simple hash-based positioning for 1D embeddings
            const hash = example.text.split('').reduce((a, b) => {
              a = (a << 5) - a + b.charCodeAt(0)
              return a & a
            }, 0)
            x = Math.sin(hash) * 100
            y = Math.cos(hash) * 100
          }

          return {
            x,
            y,
            id: example.id,
            text: example.text,
            similarity: similarities.find((s) => s.exampleId === example.id)
              ?.similarity
          }
        })

      // Normalize points to fit in chart
      if (points.length > 0) {
        const minX = Math.min(...points.map((p) => p.x))
        const maxX = Math.max(...points.map((p) => p.x))
        const minY = Math.min(...points.map((p) => p.y))
        const maxY = Math.max(...points.map((p) => p.y))

        const rangeX = maxX - minX || 1
        const rangeY = maxY - minY || 1

        return points.map((p) => ({
          ...p,
          x: ((p.x - minX) / rangeX) * 300 + 50,
          y: ((p.y - minY) / rangeY) * 200 + 50
        }))
      }

      return points
    },
    [examples, similarities]
  )

  const extractEmbeddings = useCallback(
    async (textsToExtract: string[]) => {
      if (!modelInfo || !activeWorker || textsToExtract.length === 0) return

      setIsExtracting(true)
      setProgress({ completed: 0, total: textsToExtract.length })

      const message: FeatureExtractionWorkerInput = {
        type: 'extract',
        texts: textsToExtract,
        model: modelInfo.id,
        dtype: selectedQuantization ?? 'fp32',
        config
      }

      activeWorker.postMessage(message)
    },
    [modelInfo, activeWorker, selectedQuantization, config]
  )

  const handleAddExample = useCallback(() => {
    if (!newExampleText.trim()) return

    // Check for duplicates
    const trimmedText = newExampleText.trim()
    const isDuplicate = examples.some(
      (example) => example.text.toLowerCase() === trimmedText.toLowerCase()
    )

    if (isDuplicate) {
      // Optionally show a toast or alert here
      setNewExampleText('')
      return
    }

    addExample(trimmedText)
    setNewExampleText('')
  }, [newExampleText, addExample, examples])

  const handleExtractAll = useCallback(() => {
    const textsToExtract = examples
      .filter((ex) => !ex.embedding && !ex.isLoading)
      .map((ex) => ex.text)

    if (textsToExtract.length > 0) {
      extractEmbeddings(textsToExtract)
    }
  }, [examples, extractEmbeddings])

  const handleSelectExample = useCallback(
    (example: EmbeddingExample) => {
      setSelectedExample(example)
      if (example.embedding) {
        calculateSimilarities(example)
      }
    },
    [setSelectedExample, calculateSimilarities]
  )

  const handleLoadSampleData = useCallback(() => {
    const existingTexts = new Set(examples.map((ex) => ex.text.toLowerCase()))
    SAMPLE_TEXTS.forEach((text) => {
      if (!existingTexts.has(text.toLowerCase())) {
        addExample(text)
      }
    })
  }, [addExample, examples])

  useEffect(() => {
    if (!activeWorker) return

    const onMessageReceived = (e: MessageEvent<WorkerMessage>) => {
      const { status, output } = e.data

      if (status === 'progress' && output) {
        setProgress({ completed: output.completed, total: output.total })

        if (output.embedding && output.currentText) {
          const example = examples.find((ex) => ex.text === output.currentText)
          if (example) {
            updateExample(example.id, {
              embedding: output.embedding,
              isLoading: false
            })
          }
        }
      } else if (status === 'output' && output?.embeddings) {
        output.embeddings.forEach((result: any) => {
          const example = examples.find((ex) => ex.text === result.text)
          if (example) {
            updateExample(example.id, {
              embedding: result.embedding,
              isLoading: false
            })
          }
        })
        setIsExtracting(false)
        setProgress(null)
      } else if (status === 'error') {
        setIsExtracting(false)
        setProgress(null)
      }
    }

    activeWorker.addEventListener('message', onMessageReceived)
    return () => activeWorker.removeEventListener('message', onMessageReceived)
  }, [activeWorker, examples, updateExample])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddExample()
    }
  }

  const points2D = reduceTo2D(
    examples.filter((ex) => ex.embedding).map((ex) => ex.embedding!)
  )
  useEffect(() => {
    setIsExtracting(false)
    setProgress(null)
    setExamples((items) =>
      items.map((item) => ({ ...item, embedding: undefined, isLoading: false }))
    )
    setSelectedExample(null)
    setSimilarities([])
  }, [
    activeWorker,
    config.pooling,
    config.normalize,
    setExamples,
    setSelectedExample,
    setSimilarities
  ])

  const busy = status !== 'ready' || isExtracting

  return (
    <div className="flex w-full flex-col p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ScanSearch className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">
            Feature Extraction (Embeddings)
          </h2>
        </div>
        <div className="flex flex-nowrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleLoadSampleData}
            disabled={!hasBeenLoaded || isExtracting}
            title="Load sample data"
          >
            <Sparkles className="h-4 w-4" />
            Load Samples
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowVisualization(!showVisualization)}
            title={
              showVisualization ? 'Hide visualization' : 'Show visualization'
            }
          >
            {showVisualization ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearExamples}
            title="Clear all examples"
          >
            <Eraser className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto lg:flex-row">
        {/* Left Panel - Examples */}
        <div className="flex min-h-0 flex-col lg:w-1/2">
          {/* Add Example */}
          <div className="mb-4 space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Add text examples
            </label>
            <div className="flex gap-2">
              <Textarea
                value={newExampleText}
                onChange={(e) => setNewExampleText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter text to get embeddings… (Enter to add)"
                rows={2}
                disabled={!hasBeenLoaded || isExtracting}
                className="min-h-[44px] flex-1"
              />
              <Button
                onClick={handleAddExample}
                disabled={!newExampleText.trim() || !hasBeenLoaded}
                size="icon"
                className="h-[44px] w-[44px] shrink-0"
                aria-label="Add example"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Extract Button */}
          {examples.some((ex) => !ex.embedding) && (
            <div className="mb-4">
              <Button
                onClick={handleExtractAll}
                disabled={busy || !hasBeenLoaded}
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Extracting…{' '}
                    {progress && `(${progress.completed}/${progress.total})`}
                  </>
                ) : (
                  'Extract Embeddings'
                )}
              </Button>
            </div>
          )}

          {/* Examples List */}
          <div className="max-h-[35vh] min-h-12 flex-1 overflow-y-auto rounded-xl border border-border bg-card sm:max-h-[40vh] lg:max-h-none">
            <div className="h-full p-4">
              <h3 className="sticky top-0 z-10 mb-3 bg-card text-sm font-medium text-muted-foreground">
                Examples ({examples.length})
              </h3>
              {examples.length === 0 ? (
                <div className="py-8 text-center text-sm italic text-muted-foreground">
                  No examples added yet. Add some text above to get started.
                </div>
              ) : (
                <div className="max-h-[calc(100%-3rem)] space-y-2 overflow-y-auto">
                  {examples.map((example) => {
                    const selected = selectedExample?.id === example.id
                    return (
                      <div
                        key={example.id}
                        onClick={() => handleSelectExample(example)}
                        className={cn(
                          'flex cursor-pointer items-start gap-2 rounded-lg border p-2 transition-colors sm:p-3',
                          selected
                            ? 'border-primary/60 bg-primary/10'
                            : 'border-border hover:bg-muted/40'
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="break-words text-sm text-foreground">
                            {example.text}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            {example.isLoading ? (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Extracting…
                              </div>
                            ) : example.embedding ? (
                              <div className="flex items-center gap-1 text-xs text-emerald-500">
                                <Check className="h-3 w-3" />
                                {example.embedding.length}D embedding
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground">
                                No embedding
                              </div>
                            )}
                            {selected && similarities.length > 0 && (
                              <span className="text-xs font-medium text-primary">
                                Selected
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeExample(example.id)
                          }}
                          className="ml-1 shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
                          aria-label="Remove example"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Visualization and Similarities */}
        <div className="flex min-h-0 flex-col lg:w-1/2">
          {showVisualization && (
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                2D Visualization
              </h3>
              <div className="rounded-xl border border-border bg-card p-2 sm:p-4">
                <svg
                  ref={chartRef}
                  width="100%"
                  height="250"
                  viewBox="0 0 400 300"
                  className="h-[250px] sm:h-[300px]"
                >
                  {points2D.map((point) => {
                    const isSelected = selectedExample?.id === point.id
                    const similarity = point.similarity

                    // Color based on similarity to selected example
                    let fillColor = 'var(--muted-foreground)'
                    if (isSelected) {
                      fillColor = 'var(--primary)'
                    } else if (similarity !== undefined) {
                      if (similarity > 0.8)
                        fillColor = 'var(--chart-3)' // green for high similarity
                      else if (similarity > 0.5)
                        fillColor = 'var(--chart-5)' // amber for medium similarity
                      else fillColor = 'var(--destructive)' // red for low similarity
                    }

                    return (
                      <g key={point.id}>
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={isSelected ? 8 : 5}
                          fill={fillColor}
                          stroke="var(--card)"
                          strokeWidth="2"
                          className="cursor-pointer"
                          onClick={() => {
                            const example = examples.find(
                              (ex) => ex.id === point.id
                            )
                            if (example) handleSelectExample(example)
                          }}
                          style={{
                            filter: isSelected
                              ? 'drop-shadow(0 0 6px var(--primary))'
                              : 'none'
                          }}
                        />
                        <text
                          x={point.x + 10}
                          y={point.y + 4}
                          fontSize="9"
                          fill="var(--muted-foreground)"
                          className="pointer-events-none font-medium"
                        >
                          {point.text.substring(0, 15)}…
                        </text>
                        {similarity !== undefined && (
                          <text
                            x={point.x}
                            y={point.y - 10}
                            fontSize="8"
                            fill={fillColor}
                            className="pointer-events-none font-bold"
                            textAnchor="middle"
                          >
                            {(similarity * 100).toFixed(0)}%
                          </text>
                        )}
                      </g>
                    )
                  })}
                </svg>
                {points2D.length === 0 && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Extract embeddings to see the visualization
                  </div>
                )}
                {points2D.length > 0 && (
                  <div className="mt-3 rounded-lg bg-muted/40 p-3">
                    <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                      Legend
                    </h4>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground sm:gap-3">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ background: 'var(--primary)' }}
                        />
                        Selected
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ background: 'var(--chart-3)' }}
                        />
                        High (&gt;80%)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ background: 'var(--chart-5)' }}
                        />
                        Med (50–80%)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ background: 'var(--destructive)' }}
                        />
                        Low (&lt;50%)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ background: 'var(--muted-foreground)' }}
                        />
                        Not compared
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Similarity Results */}
          <div className="max-h-[35vh] min-h-32 flex-1 overflow-y-auto rounded-xl border border-border bg-card sm:max-h-[40vh] lg:max-h-none">
            <div className="h-full p-4">
              <h3 className="sticky top-0 z-10 mb-3 bg-card text-sm font-medium text-muted-foreground">
                Cosine Similarities
                {selectedExample &&
                  ` (vs “${selectedExample.text.substring(0, 30)}…”)`}
              </h3>
              {!selectedExample ? (
                <div className="py-8 text-center text-sm italic text-muted-foreground">
                  Select an example to see similarities
                </div>
              ) : similarities.length === 0 ? (
                <div className="py-8 text-center text-sm italic text-muted-foreground">
                  No other examples with embeddings to compare
                </div>
              ) : (
                <div className="max-h-[calc(100%-3rem)] space-y-2 overflow-y-auto">
                  {similarities.map((sim) => {
                    const example = examples.find(
                      (ex) => ex.id === sim.exampleId
                    )
                    if (!example) return null

                    const similarityPercent = (sim.similarity * 100).toFixed(1)
                    const color =
                      sim.similarity > 0.8
                        ? 'text-emerald-500'
                        : sim.similarity > 0.5
                          ? 'text-amber-500'
                          : 'text-destructive'
                    const barColor =
                      sim.similarity > 0.8
                        ? 'bg-chart-3'
                        : sim.similarity > 0.5
                          ? 'bg-chart-5'
                          : 'bg-destructive'

                    return (
                      <div
                        key={sim.exampleId}
                        className="rounded-lg border border-border p-2 transition-colors hover:bg-muted/40 sm:p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1 break-words text-sm text-foreground">
                            {example.text}
                          </div>
                          <div
                            className={cn(
                              'ml-2 shrink-0 font-mono text-sm font-medium',
                              color
                            )}
                          >
                            {similarityPercent}%
                          </div>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-300',
                              barColor
                            )}
                            style={{
                              width: `${Math.max(sim.similarity * 100, 5)}%`
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {!hasBeenLoaded && (
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Load a feature extraction model first to start generating embeddings
        </p>
      )}

      {hasBeenLoaded && examples.length === 0 && (
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Tip: click “Load Samples” to try example texts, or add your own above.
        </p>
      )}
    </div>
  )
}

export default FeatureExtraction
