import React, { useEffect, useState } from 'react'
import { useModel } from '../contexts/ModelContext'
import { getModelInfo } from '../lib/huggingface'
import { Heart, Download, ChevronDown } from 'lucide-react'

const ModelSelector: React.FC = () => {
  const { models, setModelInfo, modelInfo } = useModel()
  const [isOpen, setIsOpen] = useState(false)
  const [modelStats, setModelStats] = useState<
    Record<string, { likes: number; downloads: number; createdAt: string }>
  >({})

  const formatNumber = (num: number) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B'
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  // Separate function to fetch only stats without updating selected model
  const fetchModelStats = async (modelId: string) => {
    try {
      const modelInfoResponse = await getModelInfo(modelId)

      setModelStats((prev) => ({
        ...prev,
        [modelId]: {
          likes: modelInfoResponse.likes || 0,
          downloads: modelInfoResponse.downloads || 0,
          createdAt: modelInfoResponse.createdAt || ''
        }
      }))
    } catch (error) {
      console.error('Error fetching model stats:', error)
    }
  }

  // Function to fetch full model info and set as selected
  const fetchModelAndSetInfo = async (modelId: string) => {
    try {
      const modelInfoResponse = await getModelInfo(modelId)
      let parameters = 0
      if (modelInfoResponse.safetensors) {
        const safetensors = modelInfoResponse.safetensors
        parameters =
          safetensors.parameters.F16 ||
          safetensors.parameters.F32 ||
          safetensors.parameters.total ||
          0
      }

      // Transform ModelInfoResponse to ModelInfo
      const modelInfo = {
        id: modelId,
        name: modelInfoResponse.id || modelId,
        architecture: modelInfoResponse.config?.architectures?.[0] || 'Unknown',
        parameters,
        likes: modelInfoResponse.likes || 0,
        downloads: modelInfoResponse.downloads || 0,
        createdAt: modelInfoResponse.createdAt || ''
      }

      // Also update stats
      setModelStats((prev) => ({
        ...prev,
        [modelId]: {
          likes: modelInfoResponse.likes || 0,
          downloads: modelInfoResponse.downloads || 0,
          createdAt: modelInfoResponse.createdAt || ''
        }
      }))

      console.log(modelInfoResponse)

      setModelInfo(modelInfo)
    } catch (error) {
      console.error('Error fetching model info:', error)
    }
  }

  // Fetch stats for all models when component mounts (without setting as selected)
  useEffect(() => {
    models.forEach((model) => {
      if (!modelStats[model.id]) {
        fetchModelStats(model.id)
      }
    })
  }, [models])

  // Only fetch full info when a model is actually selected
  useEffect(() => {
    if (!modelInfo.id) return
    // Only fetch if we don't already have the full info
    if (!modelStats[modelInfo.id]) {
      fetchModelAndSetInfo(modelInfo.id)
    }
  }, [modelInfo.id])

  const handleModelSelect = (modelId: string) => {
    fetchModelAndSetInfo(modelId)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* Custom Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-left flex items-center justify-between"
      >
        <span className="truncate">{modelInfo.id || 'Select a model'}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Custom Dropdown Options */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {models.map((model) => (
            <div
              key={model.id}
              onClick={() => handleModelSelect(model.id)}
              className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate flex-1 mr-2">
                  {model.id}
                </span>

                {/* Stats Display */}
                {modelStats[model.id] &&
                  (modelStats[model.id].likes > 0 ||
                    modelStats[model.id].downloads > 0) && (
                    <div className="flex items-center space-x-3 text-xs text-gray-500 flex-shrink-0">
                      {modelStats[model.id].likes > 0 && (
                        <div className="flex items-center space-x-1">
                          <Heart className="w-3 h-3 text-red-500" />
                          <span>
                            {formatNumber(modelStats[model.id].likes)}
                          </span>
                        </div>
                      )}

                      {modelStats[model.id].downloads > 0 && (
                        <div className="flex items-center space-x-1">
                          <Download className="w-3 h-3 text-green-500" />
                          <span>
                            {formatNumber(modelStats[model.id].downloads)}
                          </span>
                        </div>
                      )}
                      {modelStats[model.id].createdAt !== '' && (
                        <span className="text-xs text-gray-400">
                          {modelStats[model.id].createdAt.split('T')[0]}
                        </span>
                      )}
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div className="fixed inset-0 z-0" onClick={() => setIsOpen(false)} />
      )}
    </div>
  )
}

export default ModelSelector
