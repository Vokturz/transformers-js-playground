import React, { createContext, useContext, useState } from 'react'

interface TextClassificationConfig {
  top_k: number
}

interface TextClassificationContextType {
  config: TextClassificationConfig
  setConfig: React.Dispatch<React.SetStateAction<TextClassificationConfig>>
}

const TextClassificationContext = createContext<
  TextClassificationContextType | undefined
>(undefined)

export function useTextClassification() {
  const context = useContext(TextClassificationContext)
  if (context === undefined) {
    throw new Error(
      'useTextClassification must be used within a TextClassificationProvider'
    )
  }
  return context
}

interface TextClassificationProviderProps {
  children: React.ReactNode
}

export function TextClassificationProvider({
  children
}: TextClassificationProviderProps) {
  const [config, setConfig] = useState<TextClassificationConfig>({
    top_k: 1
  })

  const value: TextClassificationContextType = {
    config,
    setConfig
  }

  return (
    <TextClassificationContext.Provider value={value}>
      {children}
    </TextClassificationContext.Provider>
  )
}
