import { useEffect, useCallback, useState } from 'react'
import { ChevronDown, Loader2, X } from 'lucide-react'
import { QuantizationType, WorkerMessage } from '../types'
import { useModel } from '../contexts/ModelContext'
import { getWorker, terminateWorker } from '../lib/workerManager'
import { Alert, AlertDescription } from './ui/alert'

const ModelLoader = () => {
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState<React.ReactNode>('')
  const [lastModel, setLastModel] = useState<string | null>(null)
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
    pipeline,
    hasBeenLoaded,
    setHasBeenLoaded,
    setErrorText
  } = useModel()

  useEffect(() => {
    setHasBeenLoaded(false)
  }, [selectedQuantization, setHasBeenLoaded])

  useEffect(() => {
    if (!modelInfo) return

    if (modelInfo.isCompatible) {
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

    setHasBeenLoaded(false)
  }, [modelInfo, setSelectedQuantization, setHasBeenLoaded])

  useEffect(() => {
    if (!modelInfo) return

    const newWorker = getWorker(pipeline)
    if (!newWorker) {
      return
    }

    if (!hasBeenLoaded) {
      setErrorText('')
      setStatus('initiate')
      setActiveWorker(newWorker)
      setProgress(0)
    }

    const onMessageReceived = (e: MessageEvent<WorkerMessage>) => {
      const { status, output } = e.data
      if (status === 'ready') {
        setStatus('ready')
        if (e.data.output) console.log(e.data.output)
        setHasBeenLoaded(true)
      } else if (status === 'loading' && output && !hasBeenLoaded) {
        setStatus('loading')
        if (
          output.progress &&
          typeof output.file === 'string' &&
          output.file.startsWith('onnx')
        ) {
          setProgress(output.progress)
        }
      } else if (status === 'error') {
        setStatus('error')
        const error = e.data.output
        console.error(error)
        const errText = error.split(' WASM error: ')[1]
        setErrorText(errText)
        setShowAlert(true)
        let time = 3000
        if (!hasBeenLoaded)
          setAlertMessage(error.split('.')[0] + '. See console for details.')
        else {
          setAlertMessage(`${errText}. Refresh the page and try again.`)
          time = 5000
        }
        setTimeout(() => {
          setShowAlert(false)
          setAlertMessage('')
        }, time)
      }
    }

    newWorker.addEventListener('message', onMessageReceived)

    return () => {
      newWorker.removeEventListener('message', onMessageReceived)
      // terminateWorker(pipeline)
    }
  }, [
    pipeline,
    modelInfo,
    selectedQuantization,
    setActiveWorker,
    setStatus,
    setProgress,
    hasBeenLoaded,
    setHasBeenLoaded,
    setErrorText
  ])

  useEffect(() => {
    if (progress === 100) {
      setTimeout(() => {
        setShowAlert(false)
        setAlertMessage('')
      }, 2000)
    }
  }, [progress])

  const loadModel = useCallback(() => {
    if (!modelInfo || !selectedQuantization) return

    const message = {
      type: 'load',
      model: modelInfo.name,
      dtype: selectedQuantization ?? 'fp32'
    }
    activeWorker?.postMessage(message)
  }, [modelInfo, selectedQuantization, activeWorker])

  if (!modelInfo?.isCompatible) {
    return null
  }

  return (
    <div className="space-y-3">
      <hr className="border-gray-200" />

      <div className="flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-2">
          {modelInfo.supportedQuantizations.length > 1 ? (
            <>
              <span className="text-xs text-gray-600 font-medium">Quant:</span>

              <div className="relative">
                <select
                  value={selectedQuantization || ''}
                  onChange={(e) =>
                    setSelectedQuantization(e.target.value as QuantizationType)
                  }
                  className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-1 pr-8 text-xs text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {modelInfo.supportedQuantizations.map((quant) => (
                    <option key={quant} value={quant}>
                      {quant}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
            </>
          ) : (
            <span className="text-xs text-gray-600 font-medium white-space-break-spaces">
              No quantization available. Using fp32
            </span>
          )}
        </div>

        {selectedQuantization && (
          <div className="flex justify-center">
            <button
              className={`w-32 py-2 px-4 ${status !== 'error' ? 'bg-green-500 hover:bg-green-600 cursor-pointer' : 'bg-red-500 hover:bg-red-600'} rounded-sm text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm inline-flex items-center text-center justify-center space-x-2`}
              disabled={
                hasBeenLoaded || status === 'loading' || status === 'error'
              }
              onClick={loadModel}
            >
              {status === 'loading' && !hasBeenLoaded ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  <span>{progress.toFixed(0)}%</span>
                </>
              ) : status !== 'error' ? (
                <span>{!hasBeenLoaded ? 'Load Model' : 'Model Ready'}</span>
              ) : (
                <span>Error</span>
              )}
            </button>
          </div>
        )}
      </div>
      {showAlert && (
        <div className="fixed bottom-0 right-0 m-2">
          <Alert
            variant={`${typeof alertMessage === 'string' ? 'destructive' : 'default'}`}
          >
            <AlertDescription>{alertMessage}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  )
}

export default ModelLoader
