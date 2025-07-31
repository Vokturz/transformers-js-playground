import React, { createContext, useContext, useState, useCallback } from 'react'
import { Section } from '../types'

interface ZeroShotClassificationConfig {
  threshold: number
}

interface ZeroShotClassificationContextType {
  config: ZeroShotClassificationConfig
  setConfig: React.Dispatch<React.SetStateAction<ZeroShotClassificationConfig>>
  text: string
  setText: React.Dispatch<React.SetStateAction<string>>
  sections: Section[]
  setSections: React.Dispatch<React.SetStateAction<Section[]>>
  addCategory: () => void
  removeCategory: () => void
  clearResults: () => void
  updateSectionTitle: (index: number, newTitle: string) => void
}

const ZeroShotClassificationContext = createContext<ZeroShotClassificationContextType | undefined>(undefined)

export const useZeroShotClassification = () => {
  const context = useContext(ZeroShotClassificationContext)
  if (!context) {
    throw new Error('useZeroShotClassification must be used within a ZeroShotClassificationProvider')
  }
  return context
}

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

export const ZeroShotClassificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ZeroShotClassificationConfig>({
    threshold: 0.5
  })

  const [text, setText] = useState<string>(PLACEHOLDER_REVIEWS.join('\n'))

  const [sections, setSections] = useState<Section[]>(
    PLACEHOLDER_SECTIONS.map((title) => ({ title, items: [] }))
  )

  const addCategory = useCallback(() => {
    setSections((sections) => {
      const newSections = [...sections]
      // add at position 2 from the end
      newSections.splice(newSections.length - 1, 0, {
        title: 'New Category',
        items: []
      })
      return newSections
    })
  }, [])

  const removeCategory = useCallback(() => {
    setSections((sections) => {
      const newSections = [...sections]
      newSections.splice(newSections.length - 2, 1) // Remove second last element
      return newSections
    })
  }, [])

  const clearResults = useCallback(() => {
    setSections((sections) =>
      sections.map((section) => ({
        ...section,
        items: []
      }))
    )
  }, [])

  const updateSectionTitle = useCallback((index: number, newTitle: string) => {
    setSections((sections) => {
      const newSections = [...sections]
      newSections[index].title = newTitle
      return newSections
    })
  }, [])

  const value: ZeroShotClassificationContextType = {
    config,
    setConfig,
    text,
    setText,
    sections,
    setSections,
    addCategory,
    removeCategory,
    clearResults,
    updateSectionTitle
  }

  return (
    <ZeroShotClassificationContext.Provider value={value}>
      {children}
    </ZeroShotClassificationContext.Provider>
  )
}
