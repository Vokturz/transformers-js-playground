import {
  Bot,
  Heart,
  Download,
  Cpu,
  DatabaseIcon,
  CheckCircle,
  XCircle,
  ExternalLink
} from 'lucide-react'
import { getModelSize } from '../lib/huggingface'
import { useModel } from '../contexts/ModelContext'
import ModelLoader from './ModelLoader'
import Tooltip from './Tooltip'

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
    models,
    status,
    modelInfo,
    selectedQuantization,
    isFetching,
    errorText
  } = useModel()

  const ModelInfoSkeleton = () => (
    <div className="w-full animate-pulse space-y-3 rounded-xl border border-border bg-gradient-to-br from-card to-accent/20 p-3">
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 text-muted-foreground/60" />
        <div className="h-4 flex-1 rounded-sm bg-muted"></div>
        <div className="h-4 w-4 rounded-full bg-muted"></div>
      </div>

      <div className="ml-6 flex items-center gap-2">
        <div className="h-3 w-32 rounded-sm bg-muted/80"></div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <Heart className="h-3 w-3 text-destructive/60" />
          <div className="h-3 w-8 rounded-sm bg-muted/80"></div>
        </div>
        <div className="flex items-center gap-1">
          <Download className="h-3 w-3 text-emerald-500/60" />
          <div className="h-3 w-8 rounded-sm bg-muted/80"></div>
        </div>
        <div className="flex items-center gap-1">
          <Cpu className="h-3 w-3 text-violet-400/60" />
          <div className="h-3 w-8 rounded-sm bg-muted/80"></div>
        </div>
        <div className="flex items-center gap-1">
          <DatabaseIcon className="h-3 w-3 text-violet-400/60" />
          <div className="h-3 w-12 rounded-sm bg-muted/80"></div>
        </div>
      </div>
      <hr className="border-border" />
      <div className="h-8 w-full rounded-sm bg-muted/80"></div>
    </div>
  )

  if (isFetching) {
    return <ModelInfoSkeleton />
  }

  if (!modelInfo) return null

  return (
    <div className="relative w-full space-y-3 rounded-xl border border-border bg-gradient-to-br from-card to-accent/20 p-3">
      {/* Model Name Row */}
      <div className="flex items-center justify-center gap-2">
        {/* Compatibility Status */}
        {typeof modelInfo.isCompatible === 'boolean' && (
          <div className="shrink-0">
            {modelInfo.isCompatible && status !== 'error' ? (
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <a
            href={`https://huggingface.co/${modelInfo.name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-sm font-medium text-foreground/90 hover:underline"
            title={modelInfo.name}
          >
            <ExternalLink className="mr-1 inline-block h-3 w-3" />
            {modelInfo.name}
          </a>
          {/* Base Model Link */}
          {modelInfo.baseId && modelInfo.baseId !== modelInfo.id && (
            <a
              href={`https://huggingface.co/${modelInfo.baseId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block truncate text-xs text-muted-foreground hover:underline"
              title={`Base model: ${modelInfo.baseId}`}
            >
              <ExternalLink className="mr-1 inline-block h-3 w-3" />(
              {modelInfo.baseId})
            </a>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
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

        <Tooltip content="Model parameters according to Hugging Face API">
          <div className="flex cursor-default items-center gap-1">
            <Cpu className="h-3 w-3 text-violet-400" />
            {modelInfo.parameters ? (
              <span>{formatNumber(modelInfo.parameters)}</span>
            ) : (
              <span>?</span>
            )}
          </div>
        </Tooltip>

        <Tooltip
          content={`Estimated size with ${selectedQuantization} quantization`}
        >
          <div className="flex cursor-default items-center gap-1">
            <DatabaseIcon className="h-3 w-3 text-violet-400" />
            {modelInfo.parameters ? (
              <span>
                {`~${getModelSize(
                  modelInfo.parameters,
                  selectedQuantization
                ).toFixed(1)}MB`}
              </span>
            ) : (
              <span>?</span>
            )}
          </div>
        </Tooltip>
      </div>

      <ModelLoader />

      {/* Incompatibility Message */}
      {((modelInfo.isCompatible === false && modelInfo.incompatibilityReason) ||
        errorText) && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-2 py-2">
          <p className="whitespace-break-spaces text-xs text-destructive">
            {errorText ? errorText : modelInfo.incompatibilityReason}
          </p>
        </div>
      )}
    </div>
  )
}

export default ModelInfo
