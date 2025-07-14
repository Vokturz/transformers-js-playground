import React, { useCallback, useEffect, useState } from 'react'
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition
} from '@headlessui/react'
import { useModel } from '../contexts/ModelContext'
import { getModelInfo } from '../lib/huggingface'
import { Heart, Download, ChevronDown, Check, ArrowUpDown } from 'lucide-react'

type SortOption = 'likes' | 'downloads' | 'createdAt' | 'name'

const ModelSelector: React.FC = () => {
  const { models, setModelInfo, modelInfo, pipeline } = useModel()
  const [sortBy, setSortBy] = useState<SortOption>('downloads')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

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

  // Sort models based on current sort criteria
  const sortedModels = React.useMemo(() => {
    return [...models].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'downloads':
          comparison = (a.downloads || 0) - (b.downloads || 0)
          break
        case 'createdAt':
          const dateA = new Date(a.createdAt || '').getTime()
          const dateB = new Date(b.createdAt || '').getTime()
          comparison = dateA - dateB
          break
        case 'name':
          comparison = a.id.localeCompare(b.id)
          break
        case 'likes':
        default:
          comparison = (a.likes || 0) - (b.likes || 0)
          break
      }

      return sortOrder === 'desc' ? -comparison : comparison
    })
  }, [models, sortBy, sortOrder])

  // Function to fetch detailed model info and set as selected
  const fetchAndSetModelInfo = useCallback(
    async (modelId: string) => {
      try {
        const modelInfoResponse = await getModelInfo(modelId)

        let parameters = 0
        if (modelInfoResponse.safetensors) {
          const safetensors = modelInfoResponse.safetensors
          parameters =
            safetensors.parameters.BF16 ||
            safetensors.parameters.F16 ||
            safetensors.parameters.F32 ||
            safetensors.parameters.total ||
            0
        }

        const modelInfo = {
          id: modelId,
          name: modelInfoResponse.id || modelId,
          architecture:
            modelInfoResponse.config?.architectures?.[0] || 'Unknown',
          parameters,
          likes: modelInfoResponse.likes || 0,
          downloads: modelInfoResponse.downloads || 0,
          createdAt: modelInfoResponse.createdAt || '',
          isCompatible: modelInfoResponse.isCompatible,
          incompatibilityReason: modelInfoResponse.incompatibilityReason,
          supportedQuantizations: modelInfoResponse.supportedQuantizations,
          baseId: modelInfoResponse.baseId,
          readme: modelInfoResponse.readme
        }


        setModelInfo(modelInfo)
      } catch (error) {
        console.error('Error fetching model info:', error)
      }
    },
    [setModelInfo]
  )

  // Update modelInfo to first model when pipeline changes
  useEffect(() => {
    if (models.length > 0) {
      const firstModel = models[0]
      fetchAndSetModelInfo(firstModel.id)
    }
  }, [pipeline, models, fetchAndSetModelInfo])

  const handleModelSelect = (modelId: string) => {
    fetchAndSetModelInfo(modelId)
  }

  const handleSortChange = (newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('desc')
    }
  }

  const selectedModel =
    models.find((model) => model.id === modelInfo.id) || models[0]

  return (
    <div className="relative">
      <Listbox
        value={selectedModel}
        onChange={(model) => handleModelSelect(model.id)}
      >
        <div className="relative">
          <ListboxButton className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-left flex items-center justify-between">
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col flex-1 min-w-0">
                <span className="truncate font-medium">
                  {modelInfo.id || 'Select a model'}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                {selectedModel &&
                  (selectedModel.likes > 0 || selectedModel.downloads > 0) && (
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      {selectedModel.likes > 0 && (
                        <div className="flex items-center space-x-1">
                          <Heart className="w-3 h-3 text-red-500" />
                          <span>{formatNumber(selectedModel.likes)}</span>
                        </div>
                      )}
                      {selectedModel.downloads > 0 && (
                        <div className="flex items-center space-x-1">
                          <Download className="w-3 h-3 text-green-500" />
                          <span>{formatNumber(selectedModel.downloads)}</span>
                        </div>
                      )}
                    </div>
                  )}
                <ChevronDown className="w-4 h-4 ui-open:rotate-180 transition-transform flex-shrink-0" />
              </div>
            </div>
          </ListboxButton>

          <Transition
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <ListboxOptions className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden focus:outline-none">
              {/* Sort Controls - Always Visible */}
              <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-gray-600 font-medium">Sort by:</span>
                  <button
                    onClick={() => handleSortChange('name')}
                    className={`px-2 py-1 rounded flex items-center space-x-1 ${
                      sortBy === 'name'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>Name</span>
                    {sortBy === 'name' && <ArrowUpDown className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => handleSortChange('likes')}
                    className={`px-2 py-1 rounded flex items-center space-x-1 ${
                      sortBy === 'likes'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Heart className="w-3 h-3" />
                    <span>Likes</span>
                    {sortBy === 'likes' && <ArrowUpDown className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => handleSortChange('downloads')}
                    className={`px-2 py-1 rounded flex items-center space-x-1 ${
                      sortBy === 'downloads'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Download className="w-3 h-3" />
                    <span>Downloads</span>
                    {sortBy === 'downloads' && (
                      <ArrowUpDown className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    onClick={() => handleSortChange('createdAt')}
                    className={`px-2 py-1 rounded flex items-center space-x-1 ${
                      sortBy === 'createdAt'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>Date</span>
                    {sortBy === 'createdAt' && (
                      <ArrowUpDown className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>

              {/* Model Options - Scrollable */}
              <div className="overflow-auto max-h-48">
                {sortedModels.map((model) => {
                  const hasStats = model.likes > 0 || model.downloads > 0

                  return (
                    <ListboxOption
                      key={model.id}
                      value={model}
                      className={({ active, selected }) =>
                        `px-3 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                          active ? 'bg-gray-50' : ''
                        } ${selected ? 'bg-blue-50' : ''}`
                      }
                    >
                      {({ selected }) => (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1 mr-2">
                            <span className="text-sm font-medium truncate">
                              {model.id}
                            </span>
                            {selected && (
                              <Check className="w-4 h-4 text-blue-600 ml-2 flex-shrink-0" />
                            )}
                          </div>

                          {/* Stats Display */}
                          {hasStats && (
                            <div className="flex items-center space-x-3 text-xs text-gray-500 flex-shrink-0">
                              {model.likes > 0 && (
                                <div className="flex items-center space-x-1">
                                  <Heart className="w-3 h-3 text-red-500" />
                                  <span>{formatNumber(model.likes)}</span>
                                </div>
                              )}

                              {model.downloads > 0 && (
                                <div className="flex items-center space-x-1">
                                  <Download className="w-3 h-3 text-green-500" />
                                  <span>{formatNumber(model.downloads)}</span>
                                </div>
                              )}

                              {model.createdAt && (
                                <span className="text-xs text-gray-400">
                                  {model.createdAt.split('T')[0]}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </ListboxOption>
                  )
                })}
              </div>
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>
    </div>
  )
}

export default ModelSelector
