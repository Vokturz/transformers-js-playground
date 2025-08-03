import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Upload,
  Eraser,
  Loader2,
  X,
  Eye,
  EyeOff,
  Image as ImageIcon
} from 'lucide-react'
import {
  ImageClassificationWorkerInput,
  WorkerMessage,
  ImageExample
} from '../../types'
import { useModel } from '../../contexts/ModelContext'
import { useImageClassification } from '../../contexts/ImageClassificationContext'

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
        const processingExample = examples.find((ex) => ex.isLoading)
        if (processingExample) {
          updateExample(processingExample.id, {
            predictions: output.predictions,
            isLoading: false
          })
        }
        setIsClassifying(false)
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

  const busy = status !== 'ready' || isClassifying

  return (
    <div className="flex flex-col h-full max-h-[calc(100dvh-128px)]  w-full p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Image Classification</h1>
        <div className="flex gap-2">
          <button
            onClick={handleLoadSampleImages}
            disabled={!hasBeenLoaded || isClassifying}
            className="px-3 py-2 bg-purple-100 hover:bg-purple-200 disabled:bg-gray-100 disabled:cursor-not-allowed rounded-lg transition-colors text-sm"
            title="Load Sample Images"
          >
            Load Samples
          </button>
          <button
            onClick={clearExamples}
            className="p-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
            title="Clear All Images"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* Left Panel - Image Upload and List */}
        <div className="lg:w-1/2 flex flex-col">
          {/* Upload Area */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Images:
            </label>
            <div
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                dragOver
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              } ${!hasBeenLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => hasBeenLoaded && fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">
                {dragOver
                  ? 'Drop images here'
                  : 'Click to upload or drag and drop images'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
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
              <button
                onClick={handleClassifyAll}
                disabled={busy || !hasBeenLoaded}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {isClassifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Classifying...
                    {progress !== null && ` (${Math.round(progress * 100)}%)`}
                  </>
                ) : (
                  'Classify Images'
                )}
              </button>
            </div>
          )}

          {/* Images List */}
          <div className="flex-1 overflow-y-auto border border-gray-300 rounded-lg bg-white min-h-0 max-h-[30vh] sm:max-h-[20vh] lg:max-h-none">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3 sticky top-0 bg-white z-10">
                Images ({examples.length})
              </h3>
              {examples.length === 0 ? (
                <div className="text-gray-500 italic text-center py-8">
                  No images uploaded yet. Upload some images above to get
                  started.
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[calc(100%-10rem)] grid-cols-2 grid sm:grid-cols-3 lg:grid-cols-1 gap-2 ">
                  {examples.map((example) => (
                    <div
                      key={example.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedExample?.id === example.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleSelectExample(example)}
                    >
                      <div className="flex gap-3">
                        <div className="shrink-0">
                          <img
                            src={example.url}
                            alt={example.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-800 truncate">
                                {example.name}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {example.isLoading ? (
                                  <div className="flex items-center gap-1 text-xs text-blue-600">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Classifying...
                                  </div>
                                ) : example.predictions ? (
                                  <div className="text-xs text-green-600">
                                    ✓ Classified
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-500">
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
                              className="ml-2 p-1 text-red-500 hover:text-red-700 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Preview and Results */}
        <div className="lg:w-1/2 flex lg:flex-col flex-row space-x-4 sm:max-h-[34vh] lg:max-h-none">
          {/* Image Preview */}
          {selectedExample && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Selected Image
              </h3>
              <div className="sm:border-none border border-gray-300 rounded-lg bg-white p-4 sm:p-0">
                <div className="flex flex-col items-center">
                  <img
                    src={selectedExample.url}
                    alt={selectedExample.name}
                    className="max-w-64 lg:max-w-full max-h-60 lg:max-h-64 object-contain rounded-lg mb-2"
                  />
                  <div className="text-sm text-gray-600 text-center">
                    {selectedExample.name}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Classification Results */}
          <div className="flex-1 overflow-y-auto border border-gray-300 rounded-lg bg-white  ">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3 sticky top-0 bg-white">
                Classification Results
                {selectedExample && ` - ${selectedExample.name}`}
              </h3>
              {!selectedExample ? (
                <div className="text-gray-500 italic text-center py-8">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  Select an image to see classification results
                </div>
              ) : selectedExample.isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                  <div className="text-sm text-gray-600">
                    Classifying image...
                  </div>
                  {progress !== null && (
                    <div className="text-xs text-gray-500 mt-1">
                      {Math.round(progress * 100)}% complete
                    </div>
                  )}
                </div>
              ) : !selectedExample.predictions ? (
                <div className="text-gray-500 italic text-center py-8">
                  <button
                    onClick={() => classifyImage(selectedExample)}
                    disabled={busy || !hasBeenLoaded}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Classify This Image
                  </button>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[calc(100%-3rem)]">
                  {selectedExample.predictions.map((prediction, index) => {
                    const confidencePercent = (prediction.score * 100).toFixed(
                      1
                    )
                    const isTopPrediction = index === 0

                    return (
                      <div
                        key={index}
                        className={`p-3 border rounded-lg ${
                          isTopPrediction
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800">
                              {prediction.label}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-600">
                            {confidencePercent}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              isTopPrediction
                                ? 'bg-green-500'
                                : prediction.score > 0.5
                                  ? 'bg-blue-500'
                                  : 'bg-gray-400'
                            }`}
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
        <div className="text-center text-gray-500 text-sm mt-2">
          Please load an image classification model first to start classifying
          images
        </div>
      )}

      {hasBeenLoaded && examples.length === 0 && (
        <div className="text-center text-blue-600 text-sm mt-2">
          💡 Tip: Click "Load Samples" to try with example images, or upload
          your own images above
        </div>
      )}
    </div>
  )
}

export default ImageClassification
