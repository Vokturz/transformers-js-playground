import { useEffect, useRef, useState } from 'react'
import { Check, Download, Loader2, RotateCcw } from 'lucide-react'
import { QuantizationType, WorkerMessage } from '../types'
import { DevicePreference, useModel } from '../contexts/ModelContext'
import { getWorker, terminateWorker } from '../lib/workerManager'
import { Button } from '@/components/ui/button'

const ModelLoader = () => {
  const {
    modelInfo,
    selectedQuantization,
    setSelectedQuantization,
    status,
    progress,
    setStatus,
    setProgress,
    setActiveWorker,
    pipeline,
    hasBeenLoaded,
    setHasBeenLoaded,
    setErrorText,
    device,
    setDevice,
    backend,
    setBackend,
    runtimeVersion
  } = useModel()
  const [detail, setDetail] = useState('')
  const [attempt, setAttempt] = useState(0)
  const workerRef = useRef<Worker | null>(null)
  const loadingRef = useRef(false)
  const retryPending = useRef(false)

  useEffect(() => {
    setHasBeenLoaded(false)
    setStatus('initiate')
    setProgress(0)
    setErrorText('')
    setBackend('')
    setDetail('')
    loadingRef.current = false
    if (!modelInfo?.isCompatible) return
    const worker = getWorker(pipeline)
    if (!worker) return
    workerRef.current = worker
    setActiveWorker(worker)
    const fail = (message: string) => {
      loadingRef.current = false
      setHasBeenLoaded(false)
      setStatus('error')
      setErrorText(message)
    }
    const onMessage = ({ data }: MessageEvent<WorkerMessage>) => {
      const { status, output } = data
      if (status === 'runtime') {
        setBackend(output.device === 'webgpu' ? 'WebGPU' : 'CPU (WASM)')
        if (output.fallback)
          setDetail('Using CPU after WebGPU could not load this model.')
      } else if (status === 'ready') {
        loadingRef.current = false
        setStatus('ready')
        setHasBeenLoaded(true)
        setProgress(100)
      } else if (status === 'running') {
        setStatus('running')
      } else if (status === 'loading') {
        setStatus('loading')
        if (typeof output?.progress === 'number')
          setProgress(Math.min(100, Math.max(0, output.progress)))
        if (output?.message) setDetail(output.message)
        else if (output?.file) setDetail(`Downloading ${output.file}`)
      } else if (status === 'error') {
        fail(
          String(
            output ||
              data.error ||
              'The model could not run. Retry or choose another model.'
          )
        )
      }
    }
    const onError = (event: ErrorEvent) =>
      fail(
        event.message ||
          'The worker could not start. Check your connection and retry.'
      )
    worker.addEventListener('message', onMessage)
    worker.addEventListener('error', onError)
    if (retryPending.current) {
      retryPending.current = false
      loadingRef.current = true
      setStatus('loading')
      setDetail('Preparing model…')
      worker.postMessage({
        type: 'load',
        model: modelInfo.name,
        dtype: selectedQuantization,
        device,
        isStyleTTS2: modelInfo.isStyleTTS2
      })
    }
    return () => {
      worker.removeEventListener('message', onMessage)
      worker.removeEventListener('error', onError)
      terminateWorker(pipeline)
      workerRef.current = null
      setActiveWorker(null)
      setHasBeenLoaded(false)
    }
  }, [
    pipeline,
    modelInfo?.name,
    modelInfo?.isCompatible,
    selectedQuantization,
    device,
    attempt,
    runtimeVersion,
    setActiveWorker,
    setStatus,
    setProgress,
    setHasBeenLoaded,
    setErrorText,
    setBackend
  ])

  if (!modelInfo?.isCompatible) return null
  const loading = status === 'loading'
  const busy = loading || status === 'running' || status === 'output'
  return (
    <div className="space-y-3 border-t border-border pt-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
          <span>Run on</span>
          <select
            aria-label="Run on"
            value={device}
            disabled={busy}
            onChange={(event) =>
              setDevice(event.target.value as DevicePreference)
            }
            className="h-9 w-full rounded-lg border border-input bg-card px-2 text-foreground"
          >
            <option value="auto">Auto</option>
            <option value="wasm">CPU (WASM)</option>
            <option value="webgpu">WebGPU</option>
          </select>
        </label>
        <label className="space-y-1.5 text-xs font-medium text-muted-foreground">
          <span>Precision</span>
          <select
            aria-label="Precision"
            value={selectedQuantization}
            disabled={busy}
            onChange={(event) =>
              setSelectedQuantization(event.target.value as QuantizationType)
            }
            className="h-9 w-full rounded-lg border border-input bg-card px-2 text-foreground"
          >
            {modelInfo.supportedQuantizations.map((quant) => (
              <option key={quant} value={quant}>
                {quant}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Button
        className="w-full"
        disabled={hasBeenLoaded || busy}
        onClick={() => {
          if (status === 'error') {
            retryPending.current = true
            setAttempt((value) => value + 1)
            return
          }
          if (!workerRef.current || loadingRef.current) return
          loadingRef.current = true
          setStatus('loading')
          setProgress(0)
          setErrorText('')
          setDetail('Preparing model…')
          workerRef.current.postMessage({
            type: 'load',
            model: modelInfo.name,
            dtype: selectedQuantization,
            device,
            isStyleTTS2: modelInfo.isStyleTTS2
          })
        }}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : hasBeenLoaded ? (
          <Check className="h-4 w-4" />
        ) : status === 'error' ? (
          <RotateCcw className="h-4 w-4" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {loading
          ? `Loading · ${progress.toFixed(0)}%`
          : hasBeenLoaded
            ? `Ready · ${backend}`
            : status === 'error'
              ? 'Retry load'
              : 'Load model'}
      </Button>
      {loading && (
        <div
          role="progressbar"
          aria-label="Model download"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      <p
        className="break-words text-xs leading-relaxed text-muted-foreground"
        role="status"
      >
        {loading
          ? detail
          : hasBeenLoaded
            ? 'Model loaded. Your inputs are processed in this browser.'
            : 'Auto tries WebGPU when available, then CPU. Support varies by model and precision.'}
      </p>
    </div>
  )
}
export default ModelLoader
