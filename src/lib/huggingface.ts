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

// Define the possible quantization types for clarity and type safety
type QuantizationType = 'FP32' | 'FP16' | 'INT8' | 'Q4'
function getModelSize(
  parameters: number,
  quantization: QuantizationType
): number {
  let bytesPerParameter: number

  switch (quantization) {
    case 'FP32':
      // 32-bit floating point uses 4 bytes
      bytesPerParameter = 4
      break
    case 'FP16':
      bytesPerParameter = 2
      break
    case 'INT8':
      bytesPerParameter = 1
      break
    case 'Q4':
      bytesPerParameter = 0.5
      const theoreticalSize = (parameters * bytesPerParameter) / (1024 * 1024)
      return theoreticalSize
  }

  // There are 1,024 * 1,024 bytes in a megabyte
  const sizeInBytes = parameters * bytesPerParameter
  const sizeInMB = sizeInBytes / (1024 * 1024)

  return sizeInMB
}


export { getModelInfo, getModelSize }

