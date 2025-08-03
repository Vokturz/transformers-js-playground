import { useState, useRef, useEffect, useCallback } from 'react'
import { Plus, Eraser, Loader2, X, Eye, EyeOff } from 'lucide-react'
import {
  EmbeddingExample,
  FeatureExtractionWorkerInput,
  WorkerMessage
} from '../../types'
import { useModel } from '../../contexts/ModelContext'
import { useFeatureExtraction } from '../../contexts/FeatureExtractionContext'

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
  const busy = status !== 'ready' || isExtracting

  return (
    <div className="flex flex-col max-h-[calc(100dvh-128px)] w-full p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">
          Feature Extraction (Embeddings)
        </h1>
        <div className="flex flex-nowrap gap-2">
          <button
            onClick={handleLoadSampleData}
            disabled={!hasBeenLoaded || isExtracting}
            className="px-3 py-2 bg-purple-100 hover:bg-purple-200 disabled:bg-gray-100 disabled:cursor-not-allowed rounded-lg transition-colors text-xs sm:text-sm"
            title="Load Sample Data"
          >
            Load Samples
          </button>
          <button
            onClick={() => setShowVisualization(!showVisualization)}
            className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
            title={
              showVisualization ? 'Hide Visualization' : 'Show Visualization'
            }
          >
            {showVisualization ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={clearExamples}
            className="p-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
            title="Clear All Examples"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* Left Panel - Examples */}
        <div className="lg:w-1/2 flex flex-col min-h-0">
          {/* Add Example */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Text Examples:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <textarea
                value={newExampleText}
                onChange={(e) => setNewExampleText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter text to get embeddings... (Press Enter to add)"
                className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                rows={2}
                disabled={!hasBeenLoaded || isExtracting}
              />
              <button
                onClick={handleAddExample}
                disabled={!newExampleText.trim() || !hasBeenLoaded}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors self-start sm:self-stretch"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Extract Button */}
          {examples.some((ex) => !ex.embedding) && (
            <div className="mb-4">
              <button
                onClick={handleExtractAll}
                disabled={busy || !hasBeenLoaded}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Extracting...{' '}
                    {progress && `(${progress.completed}/${progress.total})`}
                  </>
                ) : (
                  'Extract Embeddings'
                )}
              </button>
            </div>
          )}

          {/* Examples List */}
          <div className="flex-1 overflow-y-auto border border-gray-300 rounded-lg bg-white min-h-0 max-h-[35vh] sm:max-h-[40vh] lg:max-h-none">
            <div className="p-4 h-full">
              <h3 className="text-sm font-medium text-gray-700 mb-3 sticky top-0 bg-white z-10">
                Examples ({examples.length})
              </h3>
              {examples.length === 0 ? (
                <div className="text-gray-500 italic text-center py-8">
                  No examples added yet. Add some text above to get started.
                </div>
              ) : (
                <div className="space-y-2 overflow-y-auto max-h-[calc(100%-3rem)]">
                  {examples.map((example) => (
                    <div
                      key={example.id}
                      className={`p-2 sm:p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedExample?.id === example.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleSelectExample(example)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-800 break-words">
                            {example.text}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {example.isLoading ? (
                              <div className="flex items-center gap-1 text-xs text-blue-600">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Extracting...
                              </div>
                            ) : example.embedding ? (
                              <div className="text-xs text-green-600">
                                ✓ Embedding ready ({example.embedding.length}D)
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500">
                                No embedding
                              </div>
                            )}
                            {selectedExample?.id === example.id &&
                              similarities.length > 0 && (
                                <div className="text-xs text-blue-600">
                                  Selected
                                </div>
                              )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeExample(example.id)
                          }}
                          className="ml-2 p-1 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Visualization and Similarities */}
        <div className="lg:w-1/2 flex flex-col min-h-0">
          {showVisualization && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                2D Visualization
              </h3>
              <div className="border border-gray-300 rounded-lg bg-white p-2 sm:p-4">
                <svg
                  ref={chartRef}
                  width="100%"
                  height="250"
                  viewBox="0 0 400 300"
                  className="border border-gray-100 sm:h-[300px]"
                >
                  {points2D.map((point) => {
                    const isSelected = selectedExample?.id === point.id
                    const similarity = point.similarity

                    // Color based on similarity to selected example
                    let fillColor = '#6b7280' // default gray
                    if (isSelected) {
                      fillColor = '#3b82f6' // blue for selected
                    } else if (similarity !== undefined) {
                      if (similarity > 0.8)
                        fillColor = '#10b981' // green for high similarity
                      else if (similarity > 0.5)
                        fillColor = '#f59e0b' // yellow for medium similarity
                      else fillColor = '#ef4444' // red for low similarity
                    }

                    return (
                      <g key={point.id}>
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={isSelected ? 8 : 5}
                          fill={fillColor}
                          stroke="white"
                          strokeWidth="2"
                          className="cursor-pointer hover:stroke-4 transition-all duration-200"
                          onClick={() => {
                            const example = examples.find(
                              (ex) => ex.id === point.id
                            )
                            if (example) handleSelectExample(example)
                          }}
                          style={{
                            filter: isSelected
                              ? 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.6))'
                              : 'none'
                          }}
                        />
                        <text
                          x={point.x + 10}
                          y={point.y + 4}
                          fontSize="9"
                          fill="#374151"
                          className="pointer-events-none font-medium"
                          style={{
                            textShadow: '1px 1px 2px rgba(255,255,255,0.8)'
                          }}
                        >
                          {point.text.substring(0, 15)}...
                        </text>
                        {similarity !== undefined && (
                          <text
                            x={point.x}
                            y={point.y - 10}
                            fontSize="8"
                            fill={fillColor}
                            className="pointer-events-none font-bold text-center"
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
                  <div className="text-center text-gray-500 py-8">
                    Extract embeddings to see visualization
                  </div>
                )}
                {points2D.length > 0 && (
                  <div className="mt-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-xs font-medium text-gray-700 mb-2">
                      Legend:
                    </h4>
                    <div className="flex flex-wrap gap-2 sm:gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-500"></div>
                        <span className="text-xs">Selected</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
                        <span className="text-xs">High (&gt;80%)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
                        <span className="text-xs">Med (50-80%)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
                        <span className="text-xs">Low (&lt;50%)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-gray-500"></div>
                        <span className="text-xs">Not compared</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Similarity Results */}
          <div className="flex-1 overflow-y-auto border border-gray-300 rounded-lg bg-white min-h-0 max-h-[35vh] sm:max-h-[40vh] lg:max-h-none">
            <div className="p-4 h-full">
              <h3 className="text-sm font-medium text-gray-700 mb-3 sticky top-0 bg-white z-10">
                Cosine Similarities
                {selectedExample &&
                  ` (vs "${selectedExample.text.substring(0, 30)}...")`}
              </h3>
              {!selectedExample ? (
                <div className="text-gray-500 italic text-center py-8">
                  Select an example to see similarities
                </div>
              ) : similarities.length === 0 ? (
                <div className="text-gray-500 italic text-center py-8">
                  No other examples with embeddings to compare
                </div>
              ) : (
                <div className="space-y-2 overflow-y-auto max-h-[calc(100%-3rem)]">
                  {similarities.map((sim) => {
                    const example = examples.find(
                      (ex) => ex.id === sim.exampleId
                    )
                    if (!example) return null

                    const similarityPercent = (sim.similarity * 100).toFixed(1)
                    const color =
                      sim.similarity > 0.8
                        ? 'text-green-600'
                        : sim.similarity > 0.5
                          ? 'text-yellow-600'
                          : 'text-red-500'

                    return (
                      <div
                        key={sim.exampleId}
                        className="p-2 sm:p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-800 break-words">
                              {example.text}
                            </div>
                          </div>
                          <div className={`ml-2 text-sm font-medium ${color}`}>
                            {similarityPercent}%
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                sim.similarity > 0.8
                                  ? 'bg-green-500'
                                  : sim.similarity > 0.5
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                              }`}
                              style={{
                                width: `${Math.max(sim.similarity * 100, 5)}%`
                              }}
                            />
                          </div>
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
        <div className="text-center text-gray-500 text-sm mt-2">
          Please load a feature extraction model first to start generating
          embeddings
        </div>
      )}

      {hasBeenLoaded && examples.length === 0 && (
        <div className="text-center text-blue-600 text-sm mt-2">
          💡 Tip: Click "Load Samples" to try with example texts, or add your
          own text above
        </div>
      )}
    </div>
  )
}

export default FeatureExtraction
