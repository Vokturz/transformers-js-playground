import { useEffect, useCallback } from 'react'
import { WorkerMessage, ZeroShotWorkerInput } from '../../types'
import { useModel } from '../../contexts/ModelContext'
import { useZeroShotClassification } from '../../contexts/ZeroShotClassificationContext'
import { Send, Loader2 } from 'lucide-react'

function ZeroShotClassification() {
  const { text, setText, sections, setSections, config } =
    useZeroShotClassification()

  const {
    activeWorker,
    status,
    modelInfo,
    hasBeenLoaded,
    selectedQuantization
  } = useModel()

  const classify = useCallback(() => {
    if (!modelInfo || !activeWorker) {
      console.error('Model info or worker is not available')
      return
    }

    // Clear previous results
    setSections((sections) =>
      sections.map((section) => ({
        ...section,
        items: []
      }))
    )

    const message: ZeroShotWorkerInput = {
      type: 'classify',
      text,
      labels: sections
        .slice(0, sections.length - 1)
        .map((section) => section.title),
      model: modelInfo.id,
      dtype: selectedQuantization ?? 'fp32'
    }
    activeWorker.postMessage(message)
  }, [
    text,
    sections,
    modelInfo,
    activeWorker,
    selectedQuantization,
    setSections
  ])

  // Handle worker messages
  useEffect(() => {
    if (!activeWorker) return

    const onMessageReceived = (e: MessageEvent<WorkerMessage>) => {
      const status = e.data.status
      if (status === 'output') {
        const { sequence, labels, scores } = e.data.output!

        // Threshold for classification
        const label = scores[0] > config.threshold ? labels[0] : 'Other'

        const sectionID =
          sections.map((x) => x.title).indexOf(label) ?? sections.length - 1
        setSections((sections) => {
          const newSections = [...sections]
          newSections[sectionID] = {
            ...newSections[sectionID],
            items: [...newSections[sectionID].items, sequence]
          }
          return newSections
        })
      }
    }

    activeWorker.addEventListener('message', onMessageReceived)
    return () => activeWorker.removeEventListener('message', onMessageReceived)
  }, [sections, activeWorker, config.threshold, setSections])

  const busy: boolean = status !== 'ready'

  return (
    <div className="flex flex-col h-full max-h-[92vh] w-full p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Zero-Shot Classification</h1>
      </div>

      {/* Input Text Area */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Text to classify (one item per line):
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text items to classify, one per line..."
          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          rows={12}
          disabled={!hasBeenLoaded || busy}
        />
      </div>

      {/* Classify Button */}
      <div className="mb-4">
        {hasBeenLoaded && (
          <button
            onClick={classify}
            disabled={!text.trim() || busy || !hasBeenLoaded}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Categorize
              </>
            )}
          </button>
        )}
      </div>

      {/* Results Grid */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 h-full">
          {sections.map((section, index) => (
            <div
              key={index}
              className="flex flex-col bg-white border border-gray-200 rounded-lg max-h-96"
            >
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                <h3
                  className="font-medium text-gray-900 text-center truncate"
                  title={section.title}
                >
                  {section.title}
                </h3>
                <div className="text-xs text-gray-500 text-center">
                  {section.items.length} items
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {section.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="p-2 bg-blue-50 border border-blue-200 rounded-sm text-sm"
                  >
                    {item}
                  </div>
                ))}
                {section.items.length === 0 && (
                  <div className="text-gray-400 text-sm italic text-center py-4">
                    No items classified here yet
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {!hasBeenLoaded && (
        <div className="text-center text-gray-500 text-sm mt-2">
          Please load a model first to start classifying text
        </div>
      )}
    </div>
  )
}

export default ZeroShotClassification
