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

export interface ModelInfo {
  id: string
  name: string
  architecture: string
  parameters: number
  likes: number
  downloads: number
  createdAt: string
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
  transformersInfo: {
    pipeline_tag: string
    auto_model: string
    processor: string
  }
  safetensors?: {
    parameters: {
      F16?: number
      F32?: number
      total?: number
    }
  }
  likes: number
  downloads: number
}
