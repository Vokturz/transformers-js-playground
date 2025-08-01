import React, { createContext, useContext, useState, useCallback } from 'react'
import { ImageExample } from '../types'

interface ImageClassificationContextType {
  examples: ImageExample[]
  selectedExample: ImageExample | null
  setSelectedExample: (example: ImageExample | null) => void
  addExample: (file: File) => void
  removeExample: (id: string) => void
  updateExample: (id: string, updates: Partial<ImageExample>) => void
  clearExamples: () => void
  topK: number
  setTopK: (k: number) => void
}

const ImageClassificationContext = createContext<
  ImageClassificationContextType | undefined
>(undefined)

export function useImageClassification() {
  const context = useContext(ImageClassificationContext)
  if (context === undefined) {
    throw new Error(
      'useImageClassification must be used within an ImageClassificationProvider'
    )
  }
  return context
}

interface ImageClassificationProviderProps {
  children: React.ReactNode
}

export function ImageClassificationProvider({
  children
}: ImageClassificationProviderProps) {
  const [examples, setExamples] = useState<ImageExample[]>([])
  const [selectedExample, setSelectedExample] = useState<ImageExample | null>(
    null
  )
  const [topK, setTopK] = useState<number>(5)

  const addExample = useCallback((file: File) => {
    const id = Math.random().toString(36).substr(2, 9)
    const url = URL.createObjectURL(file)

    const newExample: ImageExample = {
      id,
      name: file.name,
      url,
      file,
      predictions: undefined,
      isLoading: false
    }

    setExamples((prev) => [...prev, newExample])
  }, [])

  const removeExample = useCallback((id: string) => {
    setExamples((prev) => {
      const updated = prev.filter((ex) => ex.id !== id)
      // Clean up object URL to prevent memory leaks
      const example = prev.find((ex) => ex.id === id)
      if (example?.url) {
        URL.revokeObjectURL(example.url)
      }
      return updated
    })

    // Clear selection if the selected example was removed
    setSelectedExample((prev) => (prev?.id === id ? null : prev))
  }, [])

  const updateExample = useCallback(
    (id: string, updates: Partial<ImageExample>) => {
      setExamples((prev) =>
        prev.map((ex) => (ex.id === id ? { ...ex, ...updates } : ex))
      )

      // Update selected example if it's the one being updated
      setSelectedExample((prev) =>
        prev?.id === id ? { ...prev, ...updates } : prev
      )
    },
    []
  )

  const clearExamples = useCallback(() => {
    // Clean up all object URLs to prevent memory leaks
    examples.forEach((example) => {
      if (example.url) {
        URL.revokeObjectURL(example.url)
      }
    })

    setExamples([])
    setSelectedExample(null)
  }, [examples])

  const value: ImageClassificationContextType = {
    examples,
    selectedExample,
    setSelectedExample,
    addExample,
    removeExample,
    updateExample,
    clearExamples,
    topK,
    setTopK
  }

  return (
    <ImageClassificationContext.Provider value={value}>
      {children}
    </ImageClassificationContext.Provider>
  )
}
