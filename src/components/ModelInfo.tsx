import {
  Bot,
  Heart,
  Download,
  Cpu,
  DatabaseIcon,
  CheckCircle,
  XCircle,
  ExternalLink,
  ChevronDown
} from 'lucide-react'
import { getModelSize } from '../lib/huggingface'
import { useModel } from '../contexts/ModelContext'
import { useEffect, useCallback } from 'react'
import { QuantizationType, WorkerMessage } from '../types'
import { getWorker } from '../lib/workerManager'

const ModelInfo = () => {
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

  const {
    modelInfo,
    selectedQuantization,
    setSelectedQuantization,
    status,
    setStatus,
    setProgress,
    activeWorker,
    setActiveWorker,
    pipeline,
    workerLoaded,
    setWorkerLoaded
  } = useModel()

  useEffect(() => {
    if (modelInfo.isCompatible && modelInfo.supportedQuantizations.length > 0) {
      const quantizations = modelInfo.supportedQuantizations
      let defaultQuant: QuantizationType = 'fp32'

      if (quantizations.includes('int8')) {
        defaultQuant = 'int8'
      } else if (quantizations.includes('q8')) {
        defaultQuant = 'q8'
      } else if (quantizations.includes('q4')) {
        defaultQuant = 'q4'
      }

      setSelectedQuantization(defaultQuant)
    }
  }, [
    modelInfo.supportedQuantizations,
    modelInfo.isCompatible,
    setSelectedQuantization
  ])

  useEffect(() => {
    const newWorker = getWorker(pipeline)
    if (!newWorker) {
      return
    }

    setStatus('idle')
    setWorkerLoaded(false)
    setActiveWorker(newWorker)

    const onMessageReceived = (e: MessageEvent<WorkerMessage>) => {
      const { status, output } = e.data
      if (status === 'initiate') {
        setStatus('loading')
      } else if (status === 'ready') {
        setStatus('ready')
        setWorkerLoaded(true)
      } else if (status === 'progress' && output) {
        setStatus('progress')
        if (
          output.progress &&
          typeof output.file === 'string' &&
          output.file.startsWith('onnx')
        ) {
          setProgress(output.progress)
        }
      }
    }

    newWorker.addEventListener('message', onMessageReceived)

    return () => {
      newWorker.removeEventListener('message', onMessageReceived)
      // terminateWorker(pipeline);
    }
  }, [pipeline, selectedQuantization, setActiveWorker, setStatus, setProgress, setWorkerLoaded]) 

  const loadModel = useCallback(() => {
    if (!modelInfo.name || !selectedQuantization) return

    setStatus('loading')
    const message = {
      type: 'load',
      model: modelInfo.name,
      quantization: selectedQuantization
    }
    activeWorker?.postMessage(message)
  }, [modelInfo.name, selectedQuantization, setStatus, activeWorker])

  const busy: boolean = status !== 'idle'

  if (!modelInfo.name) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 rounded-lg border border-blue-200 space-y-3">
      {/* Model Name Row */}
      <div className="flex items-center space-x-2">
        <Bot className="w-4 h-4 text-blue-600" />
        <a
          href={`https://huggingface.co/${modelInfo.name}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-gray-700 truncate max-w-100 hover:underline"
          title={modelInfo.name}
        >
          <ExternalLink className="w-3 h-3 inline-block mr-1" />
          {modelInfo.name}
        </a>
        {/* Compatibility Status */}
        {typeof modelInfo.isCompatible === 'boolean' && (
          <div className="flex items-center space-x-1">
            {modelInfo.isCompatible ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-red-500" />
              </>
            )}
          </div>
        )}
      </div>

      {/* Base Model Link */}
      {modelInfo.baseId && (
        <div className="flex items-center space-x-2 ml-6">
          <a
            href={`https://huggingface.co/${modelInfo.baseId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-600 truncate max-w-100 hover:underline"
            title={`Base model: ${modelInfo.baseId}`}
          >
            <ExternalLink className="w-3 h-3 inline-block mr-1" />
            {modelInfo.baseId}
          </a>
        </div>
      )}

      {/* Stats Row */}
      <div className="flex items-center justify-self-end space-x-4 text-xs text-gray-600">
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

        {modelInfo.parameters > 0 && (
          <div className="flex items-center space-x-1">
            <Cpu className="w-3 h-3 text-purple-500" />
            <span>{formatNumber(modelInfo.parameters)}</span>
          </div>
        )}

        {modelInfo.parameters > 0 && (
          <div className="flex items-center space-x-1">
            <DatabaseIcon className="w-3 h-3 text-purple-500" />
            <span>
              {`~${getModelSize(
                modelInfo.parameters,
                selectedQuantization
              ).toFixed(1)}MB`}
            </span>
          </div>
        )}
      </div>

      {/* Separator */}
      {modelInfo.isCompatible &&
        modelInfo.supportedQuantizations.length > 0 && (
          <hr className="border-gray-200" />
        )}

      {/* Quantization Dropdown */}
      {modelInfo.isCompatible &&
        modelInfo.supportedQuantizations.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-600 font-medium">
              Quantization:
            </span>
            <div className="relative">
              <select
                value={selectedQuantization || ''}
                onChange={(e) =>
                  setSelectedQuantization(e.target.value as QuantizationType)
                }
                className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-1 pr-8 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select quantization</option>
                {modelInfo.supportedQuantizations.map((quant) => (
                  <option key={quant} value={quant}>
                    {quant}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}

      {/* Load Model Button */}
      {modelInfo.isCompatible && selectedQuantization && (
        <div className="flex justify-center">
          <button
            className="py-2 px-4 bg-green-500 hover:bg-green-600 rounded text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            disabled={busy || !selectedQuantization || workerLoaded}
            onClick={loadModel}
          >
            {status === 'loading'
              ? 'Loading Model...'
              : workerLoaded
              ? 'Model Ready'
              : 'Load Model'}
          </button>
        </div>
      )}

      {/* Incompatibility Message */}
      {modelInfo.isCompatible === false && modelInfo.incompatibilityReason && (
        <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2">
          <p className="text-sm text-red-700">
            <span className="font-medium">Incompatible:</span>{' '}
            {modelInfo.incompatibilityReason}
          </p>
        </div>
      )}
    </div>
  )
}

export default ModelInfo
