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

  const { models, modelInfo, selectedQuantization, isFetching } = useModel()

  const ModelInfoSkeleton = () => (
    <div className="bg-linear-to-r from-blue-50 to-indigo-50 px-3 py-3 rounded-lg border border-blue-200 space-y-3 animate-pulse w-4/5">
      <div className="flex items-center space-x-2">
        <Bot className="w-4 h-4 text-blue-300" />
        <div className="h-4 bg-gray-300 rounded-sm flex-1"></div>
        <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
      </div>

      <div className="flex items-center space-x-2 ml-6">
        <div className="h-3 bg-gray-200 rounded-sm w-32"></div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center space-x-1">
          <Heart className="w-3 h-3 text-red-300" />
          <div className="h-3 bg-gray-200 rounded-sm w-8"></div>
        </div>
        <div className="flex items-center space-x-1">
          <Download className="w-3 h-3 text-green-300" />
          <div className="h-3 bg-gray-200 rounded-sm w-8"></div>
        </div>
        <div className="flex items-center space-x-1">
          <Cpu className="w-3 h-3 text-purple-300" />
          <div className="h-3 bg-gray-200 rounded-sm w-8"></div>
        </div>
        <div className="flex items-center space-x-1">
          <DatabaseIcon className="w-3 h-3 text-purple-300" />
          <div className="h-3 bg-gray-200 rounded-sm w-12"></div>
        </div>
      </div>
      <hr className="border-gray-200" />
      <div className="h-8 bg-gray-200 rounded-sm w-full"></div>
    </div>
  )

  if (!modelInfo || isFetching || models.length === 0) {
    return <ModelInfoSkeleton />
  }

  return (
    <div className="relative bg-linear-to-r from-blue-50 to-indigo-50 px-3 py-3 rounded-lg border border-blue-200 space-y-3  h-full w-4/5">
      {/* Model Name Row */}
      <div className="flex justify-center items-center space-x-2">
        {/* Compatibility Status */}
        {typeof modelInfo.isCompatible === 'boolean' && (
          <div className="shrink-0 ">
            {modelInfo.isCompatible ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <a
            href={`https://huggingface.co/${modelInfo.name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-gray-700 hover:underline block truncate"
            title={modelInfo.name}
          >
            <ExternalLink className="w-3 h-3 inline-block mr-1" />
            {modelInfo.name}
          </a>
          {/* Base Model Link */}
          {modelInfo.baseId && modelInfo.baseId !== modelInfo.id && (
            <a
              href={`https://huggingface.co/${modelInfo.baseId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:underline block truncate mt-1"
              title={`Base model: ${modelInfo.baseId}`}
            >
              <ExternalLink className="w-3 h-3 inline-block mr-1" />(
              {modelInfo.baseId})
            </a>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
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

        <Tooltip content="Model parameters according to Hugging Face API">
          <div className="flex items-center space-x-1 cursor-default">
            <Cpu className="w-3 h-3 text-purple-500" />
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
          <div className="flex items-center space-x-1 cursor-default">
            <DatabaseIcon className="w-3 h-3 text-purple-500" />
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
      {modelInfo.isCompatible === false && modelInfo.incompatibilityReason && (
        <div className="bg-red-50 border border-red-200 rounded-md px-2 py-2">
          <p className="text-xs text-red-700 whitespace-break-spaces">
            {modelInfo.incompatibilityReason}
          </p>
        </div>
      )}
    </div>
  )
}

export default ModelInfo
