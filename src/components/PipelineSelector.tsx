import React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

export const supportedPipelines = [
  'feature-extraction',
  'image-classification',
  'text-generation',
  'text-classification',
  'text-to-speech',
  'zero-shot-classification'
  // 'summarization',
  // 'translation'
]

interface PipelineSelectorProps {
  pipeline: string
  setPipeline: (pipeline: string) => void
}

const PipelineSelector: React.FC<PipelineSelectorProps> = ({
  pipeline,
  setPipeline
}) => {
  const formatPipelineName = (pipelineId: string) => {
    return pipelineId
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <Select value={pipeline} onValueChange={setPipeline}>
      <SelectTrigger className="w-full text-sm xl:text-base">
        <SelectValue placeholder="Select a pipeline" />
      </SelectTrigger>
      <SelectContent>
        {supportedPipelines.map((p) => (
          <SelectItem
            key={p}
            value={p}
            className="text-sm xl:text-base data-[state=checked]:font-bold"
          >
            {formatPipelineName(p)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default PipelineSelector
