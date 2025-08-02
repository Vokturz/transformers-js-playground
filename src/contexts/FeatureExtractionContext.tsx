import React, { createContext, useContext, useState, useCallback } from 'react'
import { EmbeddingExample, SimilarityResult } from '../types'

interface FeatureExtractionConfig {
  pooling: 'mean' | 'cls'
  normalize: boolean
}

interface FeatureExtractionContextType {
  examples: EmbeddingExample[]
  setExamples: React.Dispatch<React.SetStateAction<EmbeddingExample[]>>
  selectedExample: EmbeddingExample | null
  setSelectedExample: React.Dispatch<
    React.SetStateAction<EmbeddingExample | null>
  >
  similarities: SimilarityResult[]
  setSimilarities: React.Dispatch<React.SetStateAction<SimilarityResult[]>>
  config: FeatureExtractionConfig
  setConfig: React.Dispatch<React.SetStateAction<FeatureExtractionConfig>>
  addExample: (text: string) => void
  removeExample: (id: string) => void
  updateExample: (id: string, updates: Partial<EmbeddingExample>) => void
  calculateSimilarities: (targetExample: EmbeddingExample) => void
  clearExamples: () => void
}

const FeatureExtractionContext = createContext<
  FeatureExtractionContextType | undefined
>(undefined)

export const useFeatureExtraction = () => {
  const context = useContext(FeatureExtractionContext)
  if (!context) {
    throw new Error(
      'useFeatureExtraction must be used within a FeatureExtractionProvider'
    )
  }
  return context
}

// Cosine similarity calculation
const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  normA = Math.sqrt(normA)
  normB = Math.sqrt(normB)

  if (normA === 0 || normB === 0) {
    return 0
  }

  return dotProduct / (normA * normB)
}

export const FeatureExtractionProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const [examples, setExamples] = useState<EmbeddingExample[]>([])
  const [selectedExample, setSelectedExample] =
    useState<EmbeddingExample | null>(null)
  const [similarities, setSimilarities] = useState<SimilarityResult[]>([])
  const [config, setConfig] = useState<FeatureExtractionConfig>({
    pooling: 'mean',
    normalize: true
  })

  const addExample = useCallback((text: string) => {
    const newExample: EmbeddingExample = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      text: text.trim(),
      embedding: undefined,
      isLoading: false
    }
    setExamples((prev) => [...prev, newExample])
  }, [])

  const removeExample = useCallback(
    (id: string) => {
      setExamples((prev) => prev.filter((example) => example.id !== id))
      if (selectedExample?.id === id) {
        setSelectedExample(null)
        setSimilarities([])
      }
    },
    [selectedExample]
  )

  const updateExample = useCallback(
    (id: string, updates: Partial<EmbeddingExample>) => {
      setExamples((prev) =>
        prev.map((example) =>
          example.id === id ? { ...example, ...updates } : example
        )
      )
    },
    []
  )

  const calculateSimilarities = useCallback(
    (targetExample: EmbeddingExample) => {
      if (!targetExample.embedding) {
        setSimilarities([])
        return
      }

      const newSimilarities: SimilarityResult[] = examples
        .filter(
          (example) => example.id !== targetExample.id && example.embedding
        )
        .map((example) => ({
          exampleId: example.id,
          similarity: cosineSimilarity(
            targetExample.embedding!,
            example.embedding!
          )
        }))
        .sort((a, b) => b.similarity - a.similarity)

      setSimilarities(newSimilarities)
    },
    [examples]
  )

  const clearExamples = useCallback(() => {
    setExamples([])
    setSelectedExample(null)
    setSimilarities([])
  }, [])

  const value: FeatureExtractionContextType = {
    examples,
    setExamples,
    selectedExample,
    setSelectedExample,
    similarities,
    setSimilarities,
    config,
    setConfig,
    addExample,
    removeExample,
    updateExample,
    calculateSimilarities,
    clearExamples
  }

  return (
    <FeatureExtractionContext.Provider value={value}>
      {children}
    </FeatureExtractionContext.Provider>
  )
}
