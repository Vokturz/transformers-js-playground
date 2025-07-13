import React, { createContext, RefObject, useContext, useEffect, useRef, useState } from 'react'
import { ModelInfo, ModelInfoResponse, QuantizationType } from '../types'

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
  selectedQuantization: QuantizationType
  setSelectedQuantization: (quantization: QuantizationType) => void
  activeWorker: Worker | null
  setActiveWorker: (worker: Worker | null) => void
  workerLoaded: boolean
  setWorkerLoaded: (workerLoaded: boolean) => void
}

const ModelContext = createContext<ModelContextType | undefined>(undefined)

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<number>(0)
  const [status, setStatus] = useState<string>('idle')
  const [modelInfo, setModelInfo] = useState<ModelInfo>({} as ModelInfo)
  const [models, setModels] = useState<ModelInfoResponse[]>([] as ModelInfoResponse[])
  const [pipeline, setPipeline] = useState<string>('text-classification')
  const [selectedQuantization, setSelectedQuantization] = useState<QuantizationType>('int8')
  const [activeWorker, setActiveWorker] = useState<Worker | null>(null)
  const [workerLoaded, setWorkerLoaded] = useState<boolean>(false)
  

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
        selectedQuantization,
        setSelectedQuantization,
        activeWorker,
        setActiveWorker,
        workerLoaded,
        setWorkerLoaded
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
