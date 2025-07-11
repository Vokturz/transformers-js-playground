import { Mode } from "fs"
import { ModelInfoResponse } from "../types"

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

const getModelsByPipeline = async (
  pipeline_tag: string
): Promise<ModelInfoResponse[]> => {
  const token = process.env.REACT_APP_HUGGINGFACE_TOKEN

  if (!token) {
    throw new Error(
      'Hugging Face token not found. Please set REACT_APP_HUGGINGFACE_TOKEN in your .env file'
    )
  }

  const response = await fetch(
    `https://huggingface.co/api/models?filter=${pipeline_tag}&filter=transformers.js&sort=downloads`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch models for pipeline: ${response.statusText}`)
  }
  const models = await response.json()
  if (pipeline_tag === 'text-classification') {
    return models.filter((model: ModelInfoResponse) => !model.tags.includes('reranker') && !model.id.includes('reranker')).slice(0, 10)
  }
  return models.slice(0, 10)
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


export { getModelInfo, getModelSize, getModelsByPipeline }

