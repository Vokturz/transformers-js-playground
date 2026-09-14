import { defaultQuantization } from '../lib/modelFiles'
import React, { useCallback, useEffect, useState, useRef } from 'react'
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
import Tooltip from './Tooltip'
import { cn } from '@/lib/utils'
import { ModelInfoResponse } from '@/types'

type SortOption = 'likes' | 'downloads' | 'createdAt' | 'name'

function ModelSelector() {
  const {
    models,
    setModelInfo,
    modelInfo,
    pipeline,
    isFetching,
    setIsFetching,
    setSelectedQuantization,
    setErrorText
  } = useModel()
  const [sortBy, setSortBy] = useState<SortOption>('downloads')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customModelName, setCustomModelName] = useState('')
  const [isLoadingCustomModel, setIsLoadingCustomModel] = useState(false)
  const [customModelError, setCustomModelError] = useState('')
  const [isCustomModel, setIsCustomModel] = useState(false)

  const requestId = useRef(0)
  useEffect(() => {
    requestId.current += 1
    return () => {
      requestId.current += 1
    }
  }, [pipeline])

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
    async (model: ModelInfoResponse, isCustom: boolean = false) => {
      const request = ++requestId.current
      setIsFetching(true)
      setErrorText('')
      try {
        const modelInfoResponse = await getModelInfo(model.id, pipeline)

        if (request !== requestId.current) return
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
          id: model.id,
          name: modelInfoResponse.id || model.id,
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
          readme: modelInfoResponse.readme,
          hasChatTemplate: Boolean(
            modelInfoResponse.config?.tokenizer_config?.chat_template
          ),
          isStyleTTS2: /kokoro/i.test(model.id),
          widgetData: modelInfoResponse.widgetData,
          voices: modelInfoResponse.voices
        }
        setSelectedQuantization(
          defaultQuantization(modelInfo.supportedQuantizations)
        )
        setModelInfo(modelInfo)
        setIsCustomModel(isCustom)
        setIsFetching(false)
      } catch (error) {
        if (request !== requestId.current) return
        setErrorText('Could not fetch model details. Select a model to retry.')
        console.error('Error fetching model info:', error)
        setIsFetching(false)
        throw error
      }
    },
    [
      setModelInfo,
      pipeline,
      setIsFetching,
      setSelectedQuantization,
      setErrorText
    ]
  )

  useEffect(() => {
    // Reset custom model state when pipeline changes

    setIsCustomModel(false)
    setShowCustomInput(false)
    setCustomModelName('')
    setCustomModelError('')

    if (pipeline !== 'feature-extraction') {
      setSortBy('downloads')
    }
  }, [pipeline])

  // Update modelInfo to first model when models are loaded and no custom model is selected
  useEffect(() => {
    if (models.length > 0 && !isCustomModel && !modelInfo) {
      const firstModel = sortedModels[0]
      fetchAndSetModelInfo(firstModel, false).catch(() => {})
    }
  }, [models, sortedModels, fetchAndSetModelInfo, isCustomModel, modelInfo])

  const handleModelSelect = (model: ModelInfoResponse) => {
    fetchAndSetModelInfo(model, false).catch(() => {})
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
      await fetchAndSetModelInfo(
        {
          id: customModelName.trim(),
          tags: []
        } as unknown as ModelInfoResponse,
        true
      )
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
      fetchAndSetModelInfo(sortedModels[0], false).catch(() => {})
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

  const selectedModel = models.find((model) => model.id === modelInfo?.id)

  const SortIcon = ({ sortOrder }: { sortOrder: 'asc' | 'desc' }) => {
    return sortOrder === 'asc' ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    )
  }

  if (isCustomModel) {
    return (
      <div className="relative">
        <div className="flex w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 py-2">
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">
              {modelInfo?.id || 'Custom model'}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {modelInfo && (modelInfo.likes > 0 || modelInfo.downloads > 0) && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {modelInfo.likes > 0 && (
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3 text-destructive" />
                    <span>{formatNumber(modelInfo.likes)}</span>
                  </div>
                )}
                {modelInfo.downloads > 0 && (
                  <div className="flex items-center gap-1">
                    <Download className="h-3 w-3 text-emerald-500" />
                    <span>{formatNumber(modelInfo.downloads)}</span>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={handleRemoveCustomModel}
              className="text-muted-foreground transition-colors hover:text-destructive"
              title="Remove custom model"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isFetching) {
    return (
      <div className="relative">
        <div className="flex h-10 w-full animate-pulse items-center justify-between gap-3 rounded-md border border-input bg-card px-3 py-2">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded-sm bg-muted"></div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3 text-destructive/60" />
                <div className="h-3 w-8 rounded-sm bg-muted"></div>
              </div>
              <div className="flex items-center gap-1">
                <Download className="h-3 w-3 text-emerald-500/60" />
                <div className="h-3 w-8 rounded-sm bg-muted"></div>
              </div>
            </div>
            <div className="h-4 w-4 rounded-sm bg-muted"></div>
          </div>
        </div>
      </div>
    )
  }

  const sortChip = (
    value: SortOption,
    label: string,
    icon?: React.ReactNode
  ) => (
    <button
      onClick={() => handleSortChange(value)}
      className={cn(
        'flex items-center gap-1 rounded-md px-2 py-1 transition-colors',
        sortBy === value
          ? 'bg-primary/10 font-medium text-primary'
          : 'text-muted-foreground hover:bg-muted'
      )}
    >
      {icon}
      <span>{label}</span>
      {sortBy === value && <SortIcon sortOrder={sortOrder} />}
    </button>
  )

  return (
    <div className="relative">
      <Listbox
        value={selectedModel}
        onChange={(model) => handleModelSelect(model)}
      >
        <div className="relative">
          <ListboxButton className="flex w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 py-2 text-left focus:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50">
            <div className="flex w-full items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <Tooltip content={modelInfo?.id || 'Select a model'}>
                  <span className="block truncate text-sm font-medium">
                    {modelInfo?.id || 'Select a model'}
                  </span>
                </Tooltip>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                {selectedModel &&
                  (selectedModel.likes > 0 || selectedModel.downloads > 0) && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {selectedModel.likes > 0 && (
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3 text-destructive" />
                          <span>{formatNumber(selectedModel.likes)}</span>
                        </div>
                      )}
                      {selectedModel.downloads > 0 && (
                        <div className="flex items-center gap-1">
                          <Download className="h-3 w-3 text-emerald-500" />
                          <span>{formatNumber(selectedModel.downloads)}</span>
                        </div>
                      )}
                    </div>
                  )}
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform ui-open:rotate-180" />
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
            <ListboxOptions className="absolute z-10 mt-1 max-h-96 w-full overflow-hidden rounded-md border border-border bg-popover shadow-lg focus:outline-none">
              {/* Custom Model Input */}
              {showCustomInput ? (
                <div className="sticky top-0 z-10 space-y-2 border-b border-border bg-muted/50 px-3 py-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customModelName}
                      onChange={(e) => setCustomModelName(e.target.value)}
                      onKeyDown={handleCustomInputKeyPress}
                      placeholder="onnx-community/Qwen3-0.6B-ONNX"
                      className="flex-1 rounded-sm border border-input bg-card px-2 py-1 text-sm focus:outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring"
                      autoFocus
                    />
                    <button
                      onClick={handleCustomModelLoad}
                      disabled={isLoadingCustomModel}
                      className="flex items-center gap-1 rounded-sm bg-primary px-3 py-1 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLoadingCustomModel ? (
                        <div className="h-3 w-3 animate-spin rounded-full border border-primary-foreground border-t-transparent" />
                      ) : (
                        <Search className="h-3 w-3" />
                      )}
                      <span>Load</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowCustomInput(false)
                        setCustomModelName('')
                        setCustomModelError('')
                      }}
                      className="px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                  {customModelError && (
                    <p className="text-xs text-destructive">
                      {customModelError}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Press Enter to load or Escape to cancel
                  </p>
                </div>
              ) : (
                <>
                  <div className="sticky top-0 z-10 space-y-3 border-b border-border bg-muted/50 p-3">
                    {/* Load Custom Model Button */}
                    <button
                      onClick={() => setShowCustomInput(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-sm px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Load Custom Model</span>
                    </button>

                    {/* Sort Controls */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-medium text-muted-foreground">
                        Sort by:
                      </span>
                      {sortChip('name', 'Name')}
                      {sortChip(
                        'likes',
                        'Likes',
                        <Heart className="h-3 w-3" />
                      )}
                      {sortChip(
                        'downloads',
                        'Downloads',
                        <Download className="h-3 w-3" />
                      )}
                      {sortChip('createdAt', 'Date')}
                    </div>
                  </div>
                </>
              )}

              {/* Model Options - Scrollable */}
              {!showCustomInput && (
                <div className="max-h-48 overflow-auto">
                  {sortedModels.map((model) => {
                    const hasStats = model.likes > 0 || model.downloads > 0

                    return (
                      <ListboxOption
                        key={model.id}
                        value={model}
                        className={({ active, selected }) =>
                          `cursor-pointer border-b border-border/50 px-3 py-3 last:border-b-0 ${
                            active ? 'bg-muted/70' : ''
                          } ${selected ? 'bg-primary/5' : ''}`
                        }
                      >
                        {({ selected }) => (
                          <div className="relative flex items-start py-1">
                            <div className="min-w-0 flex-1 pr-3">
                              <div className="flex items-center justify-between gap-2">
                                <Tooltip content={model.id}>
                                  <span className="block max-w-[450px] truncate text-sm font-medium">
                                    {model.id}
                                  </span>
                                </Tooltip>
                                {selected && (
                                  <Check className="ml-2 h-4 w-4 shrink-0 text-primary" />
                                )}
                              </div>
                              {/* Stats Display */}
                              {hasStats && (
                                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                  {model.likes > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Heart className="h-3 w-3 text-destructive" />
                                      <span>{formatNumber(model.likes)}</span>
                                    </div>
                                  )}
                                  {model.downloads > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Download className="h-3 w-3 text-emerald-500" />
                                      <span>
                                        {formatNumber(model.downloads)}
                                      </span>
                                    </div>
                                  )}
                                  {model.createdAt && (
                                    <span className="text-muted-foreground/70">
                                      {model.createdAt.split('T')[0]}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
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
