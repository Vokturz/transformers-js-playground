import { createContext, useContext, useState, ReactNode } from 'react'

export interface TextToSpeechConfigState {
  speakerEmbeddings?: string
  voice?: string
}

export interface AudioResult {
  audio: Float32Array
  sampling_rate: number
  text: string
  voice?: string
}

interface TextToSpeechContextType {
  config: TextToSpeechConfigState
  setConfig: React.Dispatch<React.SetStateAction<TextToSpeechConfigState>>
  audioResults: AudioResult[]
  setAudioResults: React.Dispatch<React.SetStateAction<AudioResult[]>>
  currentText: string
  setCurrentText: React.Dispatch<React.SetStateAction<string>>
  addAudioResult: (
    text: string,
    audio: Omit<AudioResult, 'text'>,
    voice?: string
  ) => void
  clearAudioResults: () => void
}

const TextToSpeechContext = createContext<TextToSpeechContextType | undefined>(
  undefined
)

export function TextToSpeechProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<TextToSpeechConfigState>({
    speakerEmbeddings:
      'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/speaker_embeddings.bin',
    voice: undefined
  })

  const [audioResults, setAudioResults] = useState<AudioResult[]>([])
  const [currentText, setCurrentText] = useState<string>('')

  const addAudioResult = (
    text: string,
    audio: Omit<AudioResult, 'text'>,
    voice?: string
  ) => {
    const fullAudioResult: AudioResult = { ...audio, text, voice }
    setAudioResults((prev) => [...prev, fullAudioResult])
  }

  const clearAudioResults = () => {
    setAudioResults([])
    setCurrentText('')
  }

  const value = {
    config,
    setConfig,
    audioResults,
    setAudioResults,
    currentText,
    setCurrentText,
    addAudioResult,
    clearAudioResults
  }

  return (
    <TextToSpeechContext.Provider value={value}>
      {children}
    </TextToSpeechContext.Provider>
  )
}

export function useTextToSpeech() {
  const context = useContext(TextToSpeechContext)
  if (context === undefined) {
    throw new Error(
      'useTextToSpeech must be used within a TextToSpeechProvider'
    )
  }
  return context
}
