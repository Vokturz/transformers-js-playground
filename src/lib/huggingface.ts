import { supportedPipelines } from '../components/PipelineSelector'
import { allQuantizationTypes, ModelInfoResponse, QuantizationType } from '../types'

const getModelInfo = async (
  modelName: string,
  pipeline: string
): Promise<ModelInfoResponse> => {
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
    'tokenizer_config.json'
  ]

  const siblingFiles = modelData.siblings?.map((s) => s.rfilename) || []
  const missingFiles = requiredFiles.filter(
    (file) => !siblingFiles.includes(file)
  )
  const hasOnnxFolder = siblingFiles.some(
    (file) => file.endsWith('.onnx') && file.startsWith('onnx/')
  )

  const isCompatible =
    missingFiles.length === 0 &&
    hasOnnxFolder &&
    modelData.tags.includes(pipeline)

  let incompatibilityReason = ''
  if (!modelData.tags.includes(pipeline)) {
    const expectedPipelines = modelData.tags
      .filter((tag) => supportedPipelines.includes(tag))
      .join(', ')
    incompatibilityReason = expectedPipelines
      ? `- Model can be used with ${expectedPipelines} pipelines only\n`
      : `- Pipeline ${pipeline} not supported by the model\n`
  }
  if (missingFiles.length > 0) {
    incompatibilityReason += `- Missing required files: ${missingFiles.join(
      ', '
    )}\n`
  } else if (!hasOnnxFolder) {
    incompatibilityReason += '- Folder onnx/ is missing\n'
  }
  const supportedQuantizations = hasOnnxFolder
    ? siblingFiles
        .filter((file) => file.endsWith('.onnx') && file.includes('_'))
        .map((file) => file.split('/')[1].split('_')[1].split('.')[0])
        .filter((q) => q !== 'quantized')
        .filter((q) => allQuantizationTypes.includes(q as QuantizationType))
    : []
  const uniqueSupportedQuantizations = Array.from(
    new Set(supportedQuantizations)
  )
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
      const readmeResponse = await fetch(
        `https://huggingface.co/${modelId}/raw/main/README.md`
      )
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
        supportedQuantizations:
          uniqueSupportedQuantizations as QuantizationType[],
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
  pipelineTag: string
): Promise<ModelInfoResponse[]> => {
  const token = process.env.REACT_APP_HUGGINGFACE_TOKEN

  if (!token) {
    throw new Error(
      'Hugging Face token not found. Please set REACT_APP_HUGGINGFACE_TOKEN in your .env file'
    )
  }

  // First search with filter=onnx
  const response1 = await fetch(
    `https://huggingface.co/api/models?filter=${pipelineTag}&filter=onnx&sort=downloads&limit=50`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )
  if (!response1.ok) {
    throw new Error(
      `Failed to fetch models for pipeline: ${response1.statusText}`
    )
  }
  const models1 = await response1.json()

  // Second search with search=onnx
  const response2 = await fetch(
    `https://huggingface.co/api/models?filter=${pipelineTag}&search=onnx&sort=downloads&limit=50`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )
  if (!response2.ok) {
    throw new Error(
      `Failed to fetch models for pipeline: ${response2.statusText}`
    )
  }
  const models2 = await response2.json()

  // Combine and deduplicate models based on id
  const combinedModels = [...models1, ...models2].filter(
    (m: ModelInfoResponse) => m.createdAt > '2022/02/03'
  )
  const uniqueModels = combinedModels.filter(
    (model, index, self) => index === self.findIndex((m) => m.id === model.id)
  )

  if (pipelineTag === 'text-classification') {
    return uniqueModels
      .filter(
        (model: ModelInfoResponse) =>
          !model.tags.includes('reranker') &&
          !model.id.includes('reranker') &&
          !model.id.includes('ms-marco') &&
          !model.id.includes('MiniLM')
      )
      .slice(0, 20)
  }

  return uniqueModels.slice(0, 20)
}

const getModelsByPipelineCustom = async (
  searchString: string,
  pipelineTag: string
): Promise<ModelInfoResponse[]> => {
  const token = process.env.REACT_APP_HUGGINGFACE_TOKEN

  if (!token) {
    throw new Error(
      'Hugging Face token not found. Please set REACT_APP_HUGGINGFACE_TOKEN in your .env file'
    )
  }
  const response = await fetch(
    `https://huggingface.co/api/models?filter=${pipelineTag}&search=${searchString}&sort=downloads&limit=50`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  if (!response.ok) {
    throw new Error(
      `Failed to fetch models for pipeline: ${response.statusText}`
    )
  }
  const models = await response.json()

  const uniqueModels = models.filter(
    (m: ModelInfoResponse) => m.createdAt > '2022/02/03'
  )
  if (pipelineTag === 'text-classification') {
    return uniqueModels
      .filter(
        (model: ModelInfoResponse) =>
          !model.tags.includes('reranker') &&
          !model.id.includes('reranker') &&
          !model.id.includes('ms-marco') &&
          !model.id.includes('MiniLM')
      )
      .slice(0, 20)
  }

  return uniqueModels.slice(0, 20)
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
    case 'q4f16':
      bytesPerParameter = 0.5
      break
  }

  const sizeInBytes = parameters * bytesPerParameter
  const sizeInMB = sizeInBytes / (1024 * 1024)

  return sizeInMB
}

export {
  getModelInfo,
  getModelSize,
  getModelsByPipeline,
  getModelsByPipelineCustom
}
