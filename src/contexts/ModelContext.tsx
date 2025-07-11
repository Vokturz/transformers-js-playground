import React, { createContext, useContext, useEffect, useState } from 'react'
import { ModelInfo, ModelInfoResponse } from '../types'

interface ModelContextType {
  progress: number
  status: string
  setProgress: (progress: number) => void
  setStatus: (status: string) => void
  modelInfo: ModelInfo
  setModelInfo: (model: ModelInfo) => void
  pipeline: string
  setPipeline: (pipeline: string) => void
  models: ModelInfoResponse[]
  setModels: (models: ModelInfoResponse[]) => void
}

const ModelContext = createContext<ModelContextType | undefined>(undefined)

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<number>(0)
  const [status, setStatus] = useState<string>('idle')
  const [modelInfo, setModelInfo] = useState<ModelInfo>({} as ModelInfo)
  const [models, setModels] = useState<ModelInfoResponse[]>([] as ModelInfoResponse[])
  const [pipeline, setPipeline] = useState<string>('zero-shot-classification')

  // set progress to 0 when model is changed
  useEffect(() => {
    setProgress(0)
  }, [modelInfo.name])

  return (
    <ModelContext.Provider
      value={{
        progress,
        setProgress,
        status,
        setStatus,
        modelInfo,
        setModelInfo,
        models,
        setModels,
        pipeline,
        setPipeline,
      }}
    >
      {children}
    </ModelContext.Provider>
  )
}

export function useModel() {
  const context = useContext(ModelContext)
  if (context === undefined) {
    throw new Error('useModel must be used within a ModelProvider')
  }
  return context
}
