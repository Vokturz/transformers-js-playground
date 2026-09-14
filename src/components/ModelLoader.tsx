import { useEffect, useCallback, useState } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import { QuantizationType, WorkerMessage } from '../types'
import { useModel } from '../contexts/ModelContext'
import { getWorker, terminateWorker } from '../lib/workerManager'
import { Alert, AlertDescription } from './ui/alert'
import { Button } from '@/components/ui/button'

const ModelLoader = () => {
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState<React.ReactNode>('')
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
          output.status === 'progress_total' &&
          typeof output.progress === 'number'
        ) {
          setProgress(output.progress)
        } else if (
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
      dtype: selectedQuantization ?? 'fp32',
      isStyleTTS2:
        modelInfo.isStyleTTS2 || modelInfo.name.includes('kitten-tts') || false // text-to-speech only
    }
    activeWorker?.postMessage(message)
  }, [modelInfo, selectedQuantization, activeWorker])

  if (!modelInfo?.isCompatible) {
    return null
  }

  return (
    <div className="space-y-3">
      <hr className="border-border" />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {modelInfo.supportedQuantizations.length >= 1 ? (
            <>
              <span className="text-xs font-medium text-muted-foreground">
                Quant:
              </span>

              <div className="relative">
                <select
                  value={selectedQuantization || ''}
                  onChange={(e) =>
                    setSelectedQuantization(e.target.value as QuantizationType)
                  }
                  className="appearance-none rounded-md border border-input bg-card py-1 pl-3 pr-8 text-xs text-foreground focus:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  {modelInfo.supportedQuantizations.map((quant) => (
                    <option key={quant} value={quant}>
                      {quant}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              </div>
            </>
          ) : (
            <span className="whitespace-break-spaces text-xs font-medium text-muted-foreground">
              No quantization available. Using fp32
            </span>
          )}
        </div>

        {selectedQuantization && (
          <div className="flex justify-center">
            <Button
              variant={status === 'error' ? 'destructive' : 'default'}
              className="w-32"
              disabled={
                hasBeenLoaded || status === 'loading' || status === 'error'
              }
              onClick={loadModel}
            >
              {status === 'loading' && !hasBeenLoaded ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{progress.toFixed(0)}%</span>
                </>
              ) : status !== 'error' ? (
                <span>{!hasBeenLoaded ? 'Load Model' : 'Model Ready'}</span>
              ) : (
                <span>Error</span>
              )}
            </Button>
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
