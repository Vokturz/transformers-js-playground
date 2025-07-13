export interface Section {
  title: string
  items: string[]
}

export interface ClassificationOutput {
  sequence: string
  labels: string[]
  scores: number[]
}

export interface WorkerMessage {
  status: 'initiate' | 'ready' | 'output' | 'complete' | 'progress'
  output?: any
}

export interface ZeroShotWorkerInput {
  text: string
  labels: string[]
  model: string
}

export interface TextClassificationWorkerInput {
  text: string
  model: string
}

export type AppStatus = 'idle' | 'loading' | 'processing'

type q8 = 'q8' | 'int8' | 'bnb8' | 'uint8'
type q4 = 'q4' | 'bnb4'
type fp16 = 'fp16'
type fp32 = 'fp32'

export type QuantizationType = q8 | q4 | fp16 | fp32


export interface ModelInfo {
  id: string
  name: string
  architecture: string
  parameters: number
  likes: number
  downloads: number
  createdAt: string
  isCompatible?: boolean
  incompatibilityReason?: string
  supportedQuantizations: QuantizationType[]
  baseId?: string
}


export interface ModelInfoResponse {
  id: string
  createdAt: string
  config?: {
    architectures: string[]
    model_type: string
  }
  lastModified: string
  pipeline_tag: string
  tags: string[]
  cardData?: {
    base_model: string
  }
  baseId?: string
  transformersInfo: {
    pipeline_tag: string
    auto_model: string
    processor: string
  }
  safetensors?: {
    parameters: {
      BF16?: number
      F16?: number
      F32?: number
      total?: number
    }
  }
  siblings?: {
    rfilename: string
  }[]
  modelId?: string
  isCompatible: boolean
  incompatibilityReason?: string
  supportedQuantizations: QuantizationType[]
  likes: number
  downloads: number
}
