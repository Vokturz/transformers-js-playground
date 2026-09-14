import React from 'react'
import { Lightbulb } from 'lucide-react'
import { useTextClassification } from '../../contexts/TextClassificationContext'
import { Slider } from '../ui/slider'

const TextClassificationConfig = () => {
  const { config, setConfig } = useTextClassification()

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">
        Text Classification Settings
      </h3>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1">
            Top K Predictions: {config.top_k}
          </label>
          <Slider
            defaultValue={[config.top_k]}
            min={1}
            max={10}
            step={1}
            onValueChange={(value) => setConfig({ top_k: value[0] })}
            className="w-full rounded-lg"
          />
          <div className="flex justify-between text-xs text-muted-foreground/60 mt-1">
            <span>1</span>
            <span>4</span>
            <span>7</span>
            <span>10</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Number of top predictions to return for each text
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/40 p-3">
          <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Lightbulb className="h-3.5 w-3.5 text-primary" />
            Tips
          </h4>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>• Use Top K = 1-3 for most cases</p>
            <p>• Higher values show more detailed rankings</p>
            <p>• Try quantized models for faster processing</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TextClassificationConfig
