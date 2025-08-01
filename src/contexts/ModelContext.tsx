import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  ModelInfo,
  ModelInfoResponse,
  QuantizationType,
  WorkerStatus
} from '../types'

interface ModelContextType {
  status: WorkerStatus
  setStatus: (status: WorkerStatus) => void
  progress: number
  setProgress: (progress: number) => void
  modelInfo: ModelInfo | null
  setModelInfo: (model: ModelInfo | null) => void
  pipeline: string
  setPipeline: (pipeline: string) => void
  models: ModelInfoResponse[]
  setModels: (models: ModelInfoResponse[]) => void
  selectedQuantization: QuantizationType
  setSelectedQuantization: (quantization: QuantizationType) => void
  activeWorker: Worker | null
  setActiveWorker: (worker: Worker | null) => void
  isFetching: boolean
  setIsFetching: (isFetching: boolean) => void
  hasBeenLoaded: boolean
  setHasBeenLoaded: (hasBeenLoaded: boolean) => void
}

const ModelContext = createContext<ModelContextType | undefined>(undefined)

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<number>(0)
  const [status, setStatus] = useState<WorkerStatus>('initiate')
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null)
  const [models, setModels] = useState<ModelInfoResponse[]>(
    [] as ModelInfoResponse[]
  )
  const [pipeline, setPipeline] = useState<string>('feature-extraction') //text-generation
  const [selectedQuantization, setSelectedQuantization] =
    useState<QuantizationType>('int8')
  const [activeWorker, setActiveWorker] = useState<Worker | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const [hasBeenLoaded, setHasBeenLoaded] = useState(false)

  // set progress to 0 when model is changed
  useEffect(() => {
    setProgress(0)
  }, [modelInfo?.name])

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
        isFetching,
        setIsFetching,
        hasBeenLoaded,
        setHasBeenLoaded
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
