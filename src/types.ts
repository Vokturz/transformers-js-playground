export interface Section {
  title: string
  items: string[]
}

export interface ClassificationOutput {
  sequence: string
  labels: string[]
  scores: number[]
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GenerationOutput {
  role: 'assistant'
  content: string
}

export type WorkerStatus =
  | 'runtime'
  | 'running'
  | 'initiate'
  | 'ready'
  | 'output'
  | 'loading'
  | 'progress'
  | 'error'
  | 'disposed'

export interface WorkerMessage {
  status: WorkerStatus
  progress?: number
  error?: string
  output?: any
}

export interface ZeroShotWorkerInput {
  type: 'classify'
  text: string
  labels: string[]
  model: string
  dtype: QuantizationType
}

export interface TextClassificationWorkerInput {
  type: 'classify'
  text: string
  model: string
  dtype: QuantizationType
  config?: {
    top_k?: number
  }
}

export interface TextGenerationWorkerInput {
  type: 'generate'
  prompt?: string
  messages?: ChatMessage[]
  hasChatTemplate: boolean
  model: string
  config?: {
    temperature?: number
    max_new_tokens?: number
    top_p?: number
    top_k?: number
    do_sample?: boolean
  }
  dtype: QuantizationType
}

export interface FeatureExtractionWorkerInput {
  type: 'extract' | 'load'
  texts?: string[]
  model: string
  dtype: QuantizationType
  config: {
    pooling: 'mean' | 'cls'
    normalize: boolean
  }
}

export interface TextToSpeechWorkerInput {
  type: 'synthesize'
  text: string
  model: string
  dtype: QuantizationType
  isStyleTTS2: boolean
  config?: {
    speakerEmbeddings?: string
    voice?: string
  }
}

export interface ImageClassificationWorkerInput {
  exampleId: string
  type: 'classify'
  image: string | ImageData | HTMLImageElement | HTMLCanvasElement
  model: string
  dtype: QuantizationType
  config: {
    top_k?: number
  }
}

export interface ImageClassificationResult {
  label: string
  score: number
}

export interface ImageExample {
  id: string
  name: string
  url: string
  file?: File
  predictions?: ImageClassificationResult[]
  isLoading?: boolean
}

export interface EmbeddingExample {
  id: string
  text: string
  embedding?: number[]
  isLoading?: boolean
}

export interface SimilarityResult {
  exampleId: string
  similarity: number
}

const q8Types = ['q8', 'int8', 'uint8'] as const
const q4Types = ['q4', 'bnb4', 'q4f16', 'q2', 'q2f16', 'q1', 'q1f16'] as const
const fp16Types = ['fp16'] as const
const fp32Types = ['fp32'] as const

type q8 = (typeof q8Types)[number]
type q4 = (typeof q4Types)[number]
type fp16 = (typeof fp16Types)[number]
type fp32 = (typeof fp32Types)[number]

export type QuantizationType = q8 | q4 | fp16 | fp32
export const allQuantizationTypes = [
  ...q8Types,
  ...q4Types,
  ...fp16Types,
  ...fp32Types
] as const

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
  readme?: string
  hasChatTemplate: boolean // text-generation only
  isStyleTTS2: boolean // text-to-speech only
  widgetData?: any
  voices: string[] // text-to-speech only
}

export interface ModelInfoResponse {
  id: string
  createdAt: string
  config?: {
    architectures: string[]
    model_type: string
    tokenizer_config?: {
      chat_template?: string
    }
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
  widgetData?: any
  modelId?: string
  isCompatible: boolean
  incompatibilityReason?: string
  supportedQuantizations: QuantizationType[]
  likes: number
  downloads: number
  readme?: string
  voices: string[] // text-to-speech only
}
