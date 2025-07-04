interface ModelInfoResponse {
  id: string
  config: {
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

const getModelInfo = async (modelName: string): Promise<ModelInfoResponse> => {
  const token = process.env.REACT_APP_HUGGINGFACE_TOKEN

  if (!token) {
    throw new Error(
      'Hugging Face token not found. Please set REACT_APP_HUGGINGFACE_TOKEN in your .env file'
    )
  }

  const response = await fetch(
    `https://huggingface.co/api/models/${modelName}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch model info: ${response.statusText}`)
  }
  return response.json()
}

export { getModelInfo }