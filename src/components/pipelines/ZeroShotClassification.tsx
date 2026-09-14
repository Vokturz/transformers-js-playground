import { useEffect, useCallback } from 'react'
import { WorkerMessage, ZeroShotWorkerInput } from '../../types'
import { useModel } from '../../contexts/ModelContext'
import { useZeroShotClassification } from '../../contexts/ZeroShotClassificationContext'
import { Send, Loader2, Tags } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

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
    <div className="flex h-full w-full flex-col p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Tags className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold tracking-tight">
          Zero-Shot Classification
        </h2>
      </div>

      {/* Input Text Area */}
      <div className="mb-4 space-y-2">
        <label className="block text-sm font-medium text-muted-foreground">
          Text to classify (one item per line)
        </label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text items to classify, one per line…"
          rows={8}
          disabled={!hasBeenLoaded || busy}
        />
      </div>

      {/* Classify Button */}
      {hasBeenLoaded && (
        <div className="mb-4">
          <Button
            onClick={classify}
            disabled={!text.trim() || busy}
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Categorize
              </>
            )}
          </Button>
        </div>
      )}

      {/* Results Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {sections.map((section, index) => (
            <div
              key={index}
              className="flex max-h-96 flex-col overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2">
                <h3
                  className="truncate text-sm font-medium"
                  title={section.title}
                >
                  {section.title}
                </h3>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {section.items.length} items
                </span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {section.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="rounded-md border border-border bg-muted/30 p-2 text-sm"
                  >
                    {item}
                  </div>
                ))}
                {section.items.length === 0 && (
                  <div className="py-4 text-center text-sm italic text-muted-foreground">
                    No items classified here yet
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {!hasBeenLoaded && (
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Load a model first to start classifying text
        </p>
      )}
    </div>
  )
}

export default ZeroShotClassification
