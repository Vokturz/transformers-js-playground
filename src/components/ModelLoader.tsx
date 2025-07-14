import { useEffect, useCallback } from 'react'
import { ChevronDown, Loader } from 'lucide-react'
import { QuantizationType, WorkerMessage } from '../types'
import { useModel } from '../contexts/ModelContext'
import { getWorker } from '../lib/workerManager'

const ModelLoader = () => {
  const {
    modelInfo,
    selectedQuantization,
    setSelectedQuantization,
    status,
    progress,
    setStatus,
    setProgress,
    activeWorker,
    setActiveWorker,
    pipeline
  } = useModel()

  useEffect(() => {
    if (!modelInfo) return

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
    modelInfo,
    setSelectedQuantization
  ])

  useEffect(() => {
    if (!modelInfo) return

    const newWorker = getWorker(pipeline)
    if (!newWorker) {
      return
    }

    setStatus('initiate')
    setActiveWorker(newWorker)

    const onMessageReceived = (e: MessageEvent<WorkerMessage>) => {
      const { status, output } = e.data
      if (status === 'ready') {
        setStatus('ready')
      } else if (status === 'loading' && output) {
        setStatus('loading')
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
  }, [pipeline, modelInfo, selectedQuantization, setActiveWorker, setStatus, setProgress])

  const loadModel = useCallback(() => {
    if (!modelInfo || !selectedQuantization) return

    setStatus('loading')
    const message = {
      type: 'load',
      model: modelInfo.name,
      quantization: selectedQuantization
    }
    activeWorker?.postMessage(message)
  }, [modelInfo, selectedQuantization, setStatus, activeWorker])

   const ready: boolean = status === 'ready'
   const busy: boolean = status === 'loading'

  if (!modelInfo?.isCompatible || modelInfo.supportedQuantizations.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <hr className="border-gray-200" />

      <div className="flex items-center justify-between space-x-4">
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

        {selectedQuantization && (
          <div className="flex justify-center">
            <button
              className="w-32 py-2 px-4 bg-green-500 hover:bg-green-600 rounded text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm inline-flex items-center text-center justify-center space-x-2"
              disabled={(busy && !ready) || !selectedQuantization || ready}
              onClick={loadModel}
            >
              {status === 'loading' && (
                <>
                  <Loader className="animate-spin h-4 w-4" />
                  <span>{progress.toFixed(0)}%</span>
                </>
              )}
              {!ready && !busy ? <span>Load Model</span> : !ready ? null : <span>Model Ready</span>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ModelLoader
