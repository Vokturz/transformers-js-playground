import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Section,
  WorkerMessage,
  ZeroShotWorkerInput,
} from '../types'
import { useModel } from '../contexts/ModelContext'

const PLACEHOLDER_REVIEWS: string[] = [
  // battery/charging problems
  'Disappointed with the battery life! The phone barely lasts half a day with regular use. Considering how much I paid for it, I expected better performance in this department.',
  "I bought this phone a week ago, and I'm already frustrated with the battery life. It barely lasts half a day with normal usage. I expected more from a supposedly high-end device",
  "The charging port is so finicky. Sometimes it takes forever to charge, and other times it doesn't even recognize the charger. Frustrating experience!",

  // overheating
  "This phone heats up way too quickly, especially when using demanding apps. It's uncomfortable to hold, and I'm concerned it might damage the internal components over time. Not what I expected",
  "This phone is like holding a hot potato. Video calls turn it into a scalding nightmare. Seriously, can't it keep its cool?",
  "Forget about a heatwave outside; my phone's got its own. It's like a little portable heater. Not what I signed up for.",

  // poor build quality
  'I dropped the phone from a short distance, and the screen cracked easily. Not as durable as I expected from a flagship device.',
  'Took a slight bump in my bag, and the frame got dinged. Are we back in the flip phone era?',
  "So, my phone's been in my pocket with just keys – no ninja moves or anything. Still, it managed to get some scratches. Disappointed with the build quality.",

  // software
  'The software updates are a nightmare. Each update seems to introduce new bugs, and it takes forever for them to be fixed.',
  'Constant crashes and freezes make me want to throw it into a black hole.',
  "Every time I open Instagram, my phone freezes and crashes. It's so frustrating!",

  // other
  "I'm not sure what to make of this phone. It's not bad, but it's not great either. I'm on the fence about it.",
  "I hate the color of this phone. It's so ugly!",
  "This phone sucks! I'm returning it."
].sort(() => Math.random() - 0.5)

const PLACEHOLDER_SECTIONS: string[] = [
  'Battery and charging problems',
  'Overheating',
  'Poor build quality',
  'Software issues',
  'Other'
]

function ZeroShotClassification() {
  const [text, setText] = useState<string>(PLACEHOLDER_REVIEWS.join('\n'))

  const [sections, setSections] = useState<Section[]>(
    PLACEHOLDER_SECTIONS.map((title) => ({ title, items: [] }))
  )

  const { activeWorker, status, modelInfo, hasBeenLoaded, selectedQuantization } = useModel()

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
  }, [text, sections, modelInfo, activeWorker, selectedQuantization])

  // Handle worker messages
  useEffect(() => {
    if (!activeWorker) return

    const onMessageReceived = (e: MessageEvent<WorkerMessage>) => {
      const status = e.data.status
      if (status === 'output') {
        const { sequence, labels, scores } = e.data.output!

        // Threshold for classification
        const label = scores[0] > 0.5 ? labels[0] : 'Other'

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
  }, [sections, activeWorker])

  const busy: boolean = status !== 'ready'

  const handleAddCategory = (): void => {
    setSections((sections) => {
      const newSections = [...sections]
      // add at position 2 from the end
      newSections.splice(newSections.length - 1, 0, {
        title: 'New Category',
        items: []
      })
      return newSections
    })
  }

  const handleRemoveCategory = (): void => {
    setSections((sections) => {
      const newSections = [...sections]
      newSections.splice(newSections.length - 2, 1) // Remove second last element
      return newSections
    })
  }

  const handleClear = (): void => {
    setSections((sections) =>
      sections.map((section) => ({
        ...section,
        items: []
      }))
    )
  }

  const handleSectionTitleChange = (index: number, newTitle: string): void => {
    setSections((sections) => {
      const newSections = [...sections]
      newSections[index].title = newTitle
      return newSections
    })
  }

  return (
    <div className="flex flex-col h-screen w-full p-1">
      <textarea
        className="border w-full p-1 h-1/2"
        value={text}
        onChange={(e) => setText(e.target.value)}
      ></textarea>
      <div className="flex flex-col justify-center items-center m-2 gap-1">
        <button
          className="border py-1 px-2 bg-blue-400 rounded text-white text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          disabled={busy}
          onClick={classify}
        >
          {hasBeenLoaded ? !busy
              ? 'Categorize'
              : 'Processing...'
            : 'Load model first'}
        </button>
        <div className="flex gap-1">
          <button
            className="border py-1 px-2 bg-green-400 rounded text-white text-sm font-medium cursor-pointer"
            onClick={handleAddCategory}
          >
            Add category
          </button>
          <button
            className="border py-1 px-2 bg-red-400 rounded text-white text-sm font-medium cursor-pointer"
            disabled={sections.length <= 1}
            onClick={handleRemoveCategory}
          >
            Remove category
          </button>
          <button
            className="border py-1 px-2 bg-orange-400 rounded text-white text-sm font-medium cursor-pointer"
            onClick={handleClear}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex justify-between flex-grow overflow-x-auto max-h-[40%]">
        {sections.map((section, index) => (
          <div key={index} className="flex flex-col w-full">
            <input
              disabled={section.title === 'Other'}
              className="w-full border px-1 text-center"
              value={section.title}
              onChange={(e) => handleSectionTitleChange(index, e.target.value)}
            ></input>
            <div className="overflow-y-auto h-full border">
              {section.items.map((item, itemIndex) => (
                <div
                  className="m-2 border bg-red-50 rounded p-1 text-sm"
                  key={itemIndex}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ZeroShotClassification
