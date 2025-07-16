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
import {
  Heart,
  Download,
  ChevronDown,
  Check,
  ArrowDown,
  ArrowUp,
  Plus,
  Search,
  X
} from 'lucide-react'

type SortOption = 'likes' | 'downloads' | 'createdAt' | 'name'

function ModelSelector() {
  const {
    models,
    setModelInfo,
    modelInfo,
    pipeline,
    isFetching,
    setIsFetching
  } = useModel()
  const [sortBy, setSortBy] = useState<SortOption>('downloads')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customModelName, setCustomModelName] = useState('')
  const [isLoadingCustomModel, setIsLoadingCustomModel] = useState(false)
  const [customModelError, setCustomModelError] = useState('')
  const [isCustomModel, setIsCustomModel] = useState(false)

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
    async (modelId: string, isCustom: boolean = false) => {
      try {
        const modelInfoResponse = await getModelInfo(modelId, pipeline)

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

        console.log('Fetched model info:', modelInfoResponse)

        setModelInfo(modelInfo)
        setIsCustomModel(isCustom)
        setIsFetching(false)
      } catch (error) {
        console.error('Error fetching model info:', error)
        setIsFetching(false)
        throw error
      }
    },
    [setModelInfo, pipeline, setIsFetching]
  )

  // Reset custom model state when pipeline changes
  useEffect(() => {
    setIsCustomModel(false)
    setShowCustomInput(false)
    setCustomModelName('')
    setCustomModelError('')
  }, [pipeline])

  // Update modelInfo to first model when models are loaded and no custom model is selected
  useEffect(() => {
    if (models.length > 0 && !isCustomModel && !modelInfo) {
      const firstModel = sortedModels[0]
      fetchAndSetModelInfo(firstModel.id, false)
    }
  }, [models, sortedModels, fetchAndSetModelInfo, isCustomModel, modelInfo])

  const handleModelSelect = (modelId: string) => {
    fetchAndSetModelInfo(modelId, false)
  }

  const handleSortChange = (newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('desc')
    }
  }

  const handleCustomModelLoad = async () => {
    if (!customModelName.trim()) {
      setCustomModelError('Please enter a model name')
      return
    }

    setIsLoadingCustomModel(true)
    setCustomModelError('')

    try {
      await fetchAndSetModelInfo(customModelName.trim(), true)
      setShowCustomInput(false)
      setCustomModelName('')
    } catch (error) {
      setCustomModelError(
        'Failed to load model. Please check the model name and try again.'
      )
    } finally {
      setIsLoadingCustomModel(false)
    }
  }

  const handleRemoveCustomModel = () => {
    setIsCustomModel(false)
    // Load the first model from the list
    if (sortedModels.length > 0) {
      fetchAndSetModelInfo(sortedModels[0].id, false)
    }
  }

  const handleCustomInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCustomModelLoad()
    } else if (e.key === 'Escape') {
      setShowCustomInput(false)
      setCustomModelName('')
      setCustomModelError('')
    }
  }

  const selectedModel =
    models.find((model) => model.id === modelInfo?.id) || models[0]

  const SortIcon = ({ sortOrder }: { sortOrder: 'asc' | 'desc' }) => {
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1" />
    )
  }

  if (isCustomModel) {
    return (
      <div className="relative">
        <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white flex items-center justify-between">
          <div className="flex flex-col flex-1 min-w-0">
            <span className="truncate font-medium">
              {modelInfo?.id || 'Custom model'}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {modelInfo && (modelInfo.likes > 0 || modelInfo.downloads > 0) && (
              <div className="flex items-center space-x-3 text-xs text-gray-500">
                {modelInfo.likes > 0 && (
                  <div className="flex items-center space-x-1">
                    <Heart className="w-3 h-3 text-red-500" />
                    <span>{formatNumber(modelInfo.likes)}</span>
                  </div>
                )}
                {modelInfo.downloads > 0 && (
                  <div className="flex items-center space-x-1">
                    <Download className="w-3 h-3 text-green-500" />
                    <span>{formatNumber(modelInfo.downloads)}</span>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={handleRemoveCustomModel}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              title="Remove custom model"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isFetching || models.length === 0) {
    return (
      <div className="relative">
        <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white flex items-center justify-between animate-pulse h-10">
          <div className="flex flex-col flex-1 min-w-0 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Heart className="w-3 h-3 text-red-500" />
                <div className="h-3 bg-gray-200 rounded w-8"></div>
              </div>
              <div className="flex items-center space-x-1">
                <Download className="w-3 h-3 text-green-500" />
                <div className="h-3 bg-gray-200 rounded w-8"></div>
              </div>
            </div>
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

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
                  {modelInfo?.id || 'Select a model'}
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
              {/* Custom Model Input */}
              {showCustomInput ? (
                <div className="px-3 py-3 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={customModelName}
                        onChange={(e) => setCustomModelName(e.target.value)}
                        onKeyDown={handleCustomInputKeyPress}
                        placeholder="Enter model name (e.g., Qwen/Qwen3-0.6B)"
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={handleCustomModelLoad}
                        disabled={isLoadingCustomModel}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      >
                        {isLoadingCustomModel ? (
                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Search className="w-3 h-3" />
                        )}
                        <span>Load</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowCustomInput(false)
                          setCustomModelName('')
                          setCustomModelError('')
                        }}
                        className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                    {customModelError && (
                      <p className="text-xs text-red-600">{customModelError}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Press Enter to load or Escape to cancel
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Load Custom Model Button */}
                  <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
                    <button
                      onClick={() => setShowCustomInput(true)}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Load Custom Model</span>
                    </button>
                  </div>

                  {/* Sort Controls */}
                  <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-gray-600 font-medium">
                        Sort by:
                      </span>
                      <button
                        onClick={() => handleSortChange('name')}
                        className={`px-2 py-1 rounded flex items-center space-x-1 ${
                          sortBy === 'name'
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <span>Name</span>
                        {sortBy === 'name' && (
                          <SortIcon sortOrder={sortOrder} />
                        )}
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
                        {sortBy === 'likes' && (
                          <SortIcon sortOrder={sortOrder} />
                        )}
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
                          <SortIcon sortOrder={sortOrder} />
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
                          <SortIcon sortOrder={sortOrder} />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Model Options - Scrollable */}
              {!showCustomInput && (
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
              )}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>
    </div>
  )
}

export default ModelSelector
