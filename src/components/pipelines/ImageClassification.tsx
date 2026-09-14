import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Upload,
  Eraser,
  Loader2,
  X,
  Check,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react'
import {
  ImageClassificationWorkerInput,
  WorkerMessage,
  ImageExample
} from '../../types'
import { useModel } from '../../contexts/ModelContext'
import { useImageClassification } from '../../contexts/ImageClassificationContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Sample images for quick testing (placeholder URLs)
const SAMPLE_IMAGES = [
  {
    name: 'Cat',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&h=300&fit=crop'
  },
  {
    name: 'Dog',
    url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&h=300&fit=crop'
  },
  {
    name: 'Car',
    url: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=300&h=300&fit=crop'
  },
  {
    name: 'Flower',
    url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=300&h=300&fit=crop'
  }
]

function ImageClassification() {
  const {
    examples,
    selectedExample,
    setSelectedExample,
    addExample,
    removeExample,
    updateExample,
    clearExamples,
    config
  } = useImageClassification()

  const [isClassifying, setIsClassifying] = useState<boolean>(false)
  const [dragOver, setDragOver] = useState<boolean>(false)
  const [progress, setProgress] = useState<number | null>(null)

  const {
    activeWorker,
    status,
    modelInfo,
    hasBeenLoaded,
    selectedQuantization
  } = useModel()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const classifyImage = useCallback(
    async (example: ImageExample) => {
      if (!modelInfo || !activeWorker || !example.url) return

      updateExample(example.id, { isLoading: true })
      setIsClassifying(true)
      setProgress(0)
      const message: ImageClassificationWorkerInput = {
        type: 'classify',
        exampleId: example.id,
        image: example.url,
        model: modelInfo.id,
        dtype: selectedQuantization ?? 'fp32',
        config
      }

      activeWorker.postMessage(message)
    },
    [modelInfo, activeWorker, selectedQuantization, config, updateExample]
  )

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files) return

      Array.from(files).forEach((file) => {
        if (file.type.startsWith('image/')) {
          addExample(file)
        }
      })
    },
    [addExample]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      handleFileSelect(e.dataTransfer.files)
    },
    [handleFileSelect]
  )

  const handleClassifyAll = useCallback(() => {
    const imagesToClassify = examples.filter(
      (ex) => !ex.predictions && !ex.isLoading
    )

    imagesToClassify.forEach((example) => {
      classifyImage(example)
    })
  }, [examples, classifyImage])

  const handleSelectExample = useCallback(
    (example: ImageExample) => {
      setSelectedExample(example)
    },
    [setSelectedExample]
  )

  const handleLoadSampleImages = useCallback(async () => {
    const existstingImages = new Set(examples.map((ex) => ex.name))
    for (const sample of SAMPLE_IMAGES) {
      if (existstingImages.has(sample.name)) continue
      try {
        const response = await fetch(sample.url)
        const blob = await response.blob()
        const file = new File([blob], sample.name, { type: blob.type })
        addExample(file)
      } catch (error) {
        console.error(`Failed to load sample image ${sample.name}:`, error)
      }
    }
  }, [addExample, examples])

  useEffect(() => {
    if (!activeWorker) return

    const onMessageReceived = (e: MessageEvent<WorkerMessage>) => {
      const { status, output, progress: workerProgress } = e.data
      if (status === 'progress' && workerProgress !== undefined) {
        setProgress(workerProgress)
      } else if (status === 'output' && output?.predictions) {
        // Find the example that was being processed
        const processingExample = examples.find(
          (ex) => ex.id === output.exampleId
        )
        if (processingExample) {
          updateExample(processingExample.id, {
            predictions: output.predictions,
            isLoading: false
          })
        }
        setIsClassifying(
          examples.some((ex) => ex.isLoading && ex.id !== output.exampleId)
        )
        setProgress(null)
      } else if (status === 'error') {
        // Clear loading state for all examples
        examples.forEach((ex) => {
          if (ex.isLoading) {
            updateExample(ex.id, { isLoading: false })
          }
        })
        setIsClassifying(false)
        setProgress(null)
      }
    }

    activeWorker.addEventListener('message', onMessageReceived)
    return () => activeWorker.removeEventListener('message', onMessageReceived)
  }, [activeWorker, examples, updateExample])

  useEffect(() => {
    setIsClassifying(false)
  }, [activeWorker])

  const busy = status !== 'ready' || isClassifying

  return (
    <div className="flex w-full flex-col p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">
            Image Classification
          </h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleLoadSampleImages}
            disabled={!hasBeenLoaded || isClassifying}
            title="Load sample images"
          >
            <Sparkles className="h-4 w-4" />
            Load Samples
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearExamples}
            title="Clear all images"
          >
            <Eraser className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto lg:flex-row">
        {/* Left Panel - Image Upload and List */}
        <div className="flex flex-col lg:w-1/2">
          {/* Upload Area */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-muted-foreground">
              Upload images
            </label>
            <div
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => hasBeenLoaded && fileInputRef.current?.click()}
              className={cn(
                'cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors',
                dragOver
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-muted/30 hover:border-ring/50',
                !hasBeenLoaded && 'cursor-not-allowed opacity-50'
              )}
            >
              <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-foreground">
                {dragOver
                  ? 'Drop images here'
                  : 'Click to upload or drag and drop images'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Supports JPG, PNG, GIF, WebP
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
                disabled={!hasBeenLoaded}
              />
            </div>
          </div>

          {/* Classify Button */}
          {examples.some((ex) => !ex.predictions) && (
            <div className="mb-4">
              <Button
                onClick={handleClassifyAll}
                disabled={busy || !hasBeenLoaded}
              >
                {isClassifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Classifying…
                    {progress !== null && ` (${Math.round(progress * 100)}%)`}
                  </>
                ) : (
                  'Classify Images'
                )}
              </Button>
            </div>
          )}

          {/* Images List */}
          <div className="max-h-[30vh] min-h-0 flex-1 overflow-y-auto rounded-xl border border-border bg-card sm:max-h-[40vh] lg:max-h-none">
            <div className="p-4">
              <h3 className="sticky top-0 z-10 mb-3 bg-card text-sm font-medium text-muted-foreground">
                Images ({examples.length})
              </h3>
              {examples.length === 0 ? (
                <div className="py-8 text-center text-sm italic text-muted-foreground">
                  No images uploaded yet. Upload some images above to get
                  started.
                </div>
              ) : (
                <div className="max-h-[calc(100%-3rem)] grid grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-1">
                  {examples.map((example) => {
                    const selected = selectedExample?.id === example.id
                    return (
                      <div
                        key={example.id}
                        onClick={() => handleSelectExample(example)}
                        className={cn(
                          'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
                          selected
                            ? 'border-primary/60 bg-primary/10'
                            : 'border-border hover:bg-muted/40'
                        )}
                      >
                        <img
                          src={example.url}
                          alt={example.name}
                          className="h-14 w-14 shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-foreground">
                            {example.name}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            {example.isLoading ? (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Classifying…
                              </div>
                            ) : example.predictions ? (
                              <div className="flex items-center gap-1 text-xs text-emerald-500">
                                <Check className="h-3 w-3" />
                                Classified
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground">
                                Not classified
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeExample(example.id)
                          }}
                          className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
                          aria-label="Remove image"
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

        {/* Right Panel - Preview and Results */}
        <div className="flex flex-col lg:w-1/2">
          {/* Image Preview */}
          {selectedExample && (
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                Selected Image
              </h3>
              <div className="flex flex-col items-center rounded-xl border border-border bg-card p-4">
                <img
                  src={selectedExample.url}
                  alt={selectedExample.name}
                  className="max-h-60 w-auto rounded-lg object-contain"
                />
                <div className="mt-2 text-sm text-muted-foreground">
                  {selectedExample.name}
                </div>
              </div>
            </div>
          )}

          {/* Classification Results */}
          <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-card">
            <div className="p-4">
              <h3 className="sticky top-0 z-10 mb-3 bg-card text-sm font-medium text-muted-foreground">
                Classification Results
                {selectedExample && ` — ${selectedExample.name}`}
              </h3>
              {!selectedExample ? (
                <div className="py-8 text-center text-sm italic text-muted-foreground">
                  <ImageIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                  Select an image to see classification results
                </div>
              ) : selectedExample.isLoading ? (
                <div className="py-8 text-center">
                  <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-primary" />
                  <div className="text-sm text-muted-foreground">
                    Classifying image…
                  </div>
                  {progress !== null && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {Math.round(progress * 100)}% complete
                    </div>
                  )}
                </div>
              ) : !selectedExample.predictions ? (
                <div className="py-8 text-center">
                  <Button
                    onClick={() => classifyImage(selectedExample)}
                    disabled={busy || !hasBeenLoaded}
                  >
                    <Sparkles className="h-4 w-4" />
                    Classify This Image
                  </Button>
                </div>
              ) : (
                <div className="max-h-[calc(100%-3rem)] space-y-3 overflow-y-auto">
                  {selectedExample.predictions.map((prediction, index) => {
                    const confidencePercent = (prediction.score * 100).toFixed(
                      1
                    )
                    const isTopPrediction = index === 0

                    return (
                      <div
                        key={index}
                        className={cn(
                          'rounded-lg border p-3',
                          isTopPrediction
                            ? 'border-primary/40 bg-primary/10'
                            : 'border-border'
                        )}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span
                            className={cn(
                              'text-sm',
                              isTopPrediction
                                ? 'font-medium text-foreground'
                                : 'text-muted-foreground'
                            )}
                          >
                            {prediction.label}
                          </span>
                          <span
                            className={cn(
                              'font-mono text-sm',
                              isTopPrediction
                                ? 'font-medium text-primary'
                                : 'text-muted-foreground'
                            )}
                          >
                            {confidencePercent}%
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-300',
                              isTopPrediction
                                ? 'bg-primary'
                                : prediction.score > 0.5
                                  ? 'bg-chart-2'
                                  : 'bg-muted-foreground/40'
                            )}
                            style={{
                              width: `${Math.max(prediction.score * 100, 2)}%`
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
          Load an image classification model first to start classifying images
        </p>
      )}

      {hasBeenLoaded && examples.length === 0 && (
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Tip: click “Load Samples” to try example images, or upload your own
          above.
        </p>
      )}
    </div>
  )
}

export default ImageClassification
