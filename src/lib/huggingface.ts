import { ModelInfoResponse, QuantizationType } from "../types"

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
  
  const modelData: ModelInfoResponse = await response.json()
  
  const requiredFiles = [
    'config.json',
    'tokenizer.json',
    'tokenizer_config.json',
  ]
  
  const siblingFiles = modelData.siblings?.map(s => s.rfilename) || []
  const isCompatible =
    requiredFiles.every((file) => siblingFiles.includes(file)) &&
    siblingFiles.some((file) => file.endsWith('.onnx') && file.startsWith('onnx/'))
  const incompatibilityReason = isCompatible
    ? ''
    : `Missing required files: ${requiredFiles
        .filter(file => !siblingFiles.includes(file))
        .join(', ')}`
  const supportedQuantizations = siblingFiles
      .filter((file) => file.endsWith('.onnx') && file.includes('_'))
      .map((file) => file.split('/')[1].split('_')[1].split('.')[0])
      .filter((q) => q !== 'quantized')
  const uniqueSupportedQuantizations = Array.from(new Set(supportedQuantizations))
  uniqueSupportedQuantizations.sort((a, b) => {
    const getNumericValue = (str: string) => {
      const match = str.match(/(\d+)/)
      return match ? parseInt(match[1]) : Infinity
    }
    return getNumericValue(a) - getNumericValue(b)
  })

  // Fetch README content
  const fetchReadme = async (modelId: string): Promise<string> => {
    try {
      const readmeResponse = await fetch(`https://huggingface.co/${modelId}/raw/main/README.md`)
      if (readmeResponse.ok) {
        return await readmeResponse.text()
      }
    } catch (error) {
      console.warn(`Failed to fetch README for ${modelId}:`, error)
    }
    return ''
  }

  const baseModel = modelData.cardData?.base_model ?? modelData.modelId 
  if (baseModel && !modelData.safetensors) {
    const baseModelResponse = await fetch(
      `https://huggingface.co/api/models/${baseModel}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    if (baseModelResponse.ok) {
      const baseModelData: ModelInfoResponse = await baseModelResponse.json()
      const readme = await fetchReadme(baseModel)
      
      return {
        ...baseModelData,
        id: modelData.id,
        baseId: baseModel,
        isCompatible,
        incompatibilityReason,
        supportedQuantizations: uniqueSupportedQuantizations as QuantizationType[],
        readme
      }
    }
  }
  
  const readme = await fetchReadme(modelData.id)
  
  return {
    ...modelData,
    isCompatible,
    incompatibilityReason,
    supportedQuantizations: uniqueSupportedQuantizations as QuantizationType[],
    readme
  }
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
    return models
      .filter(
        (model: ModelInfoResponse) =>
          !model.tags.includes('reranker') &&
          !model.id.includes('reranker') &&
          !model.id.includes('ms-marco') &&
          !model.id.includes('MiniLM')
      )
      .slice(0, 10)
  }
  
  return models.slice(0, 10)
}

function getModelSize(
  parameters: number,
  quantization: QuantizationType
): number {
  let bytesPerParameter: number

  switch (quantization) {
    case 'fp32':
      // 32-bit floating point uses 4 bytes
      bytesPerParameter = 4
      break
    case 'fp16':
      bytesPerParameter = 2
      break
    case 'int8':
    case 'bnb8':
    case 'uint8':
    case 'q8':
      bytesPerParameter = 1
      break
    case 'bnb4':
    case 'q4': 
      bytesPerParameter = 0.5
    break
  }

  const sizeInBytes = parameters * bytesPerParameter
  const sizeInMB = sizeInBytes / (1024 * 1024)

  return sizeInMB
}


export { getModelInfo, getModelSize, getModelsByPipeline }
