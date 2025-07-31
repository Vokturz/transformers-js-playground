import { createContext, useContext, useState, ReactNode } from 'react'
import { ChatMessage } from '../types'

export interface GenerationConfigState {
  temperature: number
  maxTokens: number
  topP: number
  topK: number
  doSample: boolean
}

interface TextGenerationContextType {
  config: GenerationConfigState
  setConfig: React.Dispatch<React.SetStateAction<GenerationConfigState>>
  messages: ChatMessage[]
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  updateSystemMessage: (content: string) => void
}

const TextGenerationContext = createContext<
  TextGenerationContextType | undefined
>(undefined)

export function TextGenerationProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<GenerationConfigState>({
    temperature: 0.7,
    maxTokens: 100,
    topP: 0.9,
    topK: 50,
    doSample: true
  })

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', content: 'You are a helpful assistant.' }
  ])

  const updateSystemMessage = (content: string) => {
    setMessages((prev) => [
      { role: 'system', content },
      ...prev.filter((msg) => msg.role !== 'system')
    ])
  }

  const value = {
    config,
    setConfig,
    messages,
    setMessages,
    updateSystemMessage
  }

  return (
    <TextGenerationContext.Provider value={value}>
      {children}
    </TextGenerationContext.Provider>
  )
}

export function useTextGeneration() {
  const context = useContext(TextGenerationContext)
  if (context === undefined) {
    throw new Error(
      'useTextGeneration must be used within a TextGenerationProvider'
    )
  }
  return context
}
