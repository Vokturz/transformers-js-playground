import React from 'react'
import { useFeatureExtraction } from '../../contexts/FeatureExtractionContext'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

const FeatureExtractionConfig = () => {
  const { config, setConfig } = useFeatureExtraction()

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">
        Feature Extraction Settings
      </h3>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1">
            Pooling Strategy
          </label>
          <Select
            value={config.pooling}
            onValueChange={(value) =>
              setConfig((prev) => ({
                ...prev,
                pooling: value as 'mean' | 'cls'
              }))
            }
          >
            <SelectTrigger className="w-full text-sm xl:text-base">
              <SelectValue placeholder="Select a pooling strategy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                key="mean"
                value="mean"
                className="text-sm data-[state=checked]:font-bold"
              >
                Mean Pooling
              </SelectItem>
              <SelectItem
                key="cls"
                value="cls"
                className="text-sm data-[state=checked]:font-bold"
              >
                CLS Token
              </SelectItem>
            </SelectContent>
          </Select>

          <p className="text-xs text-muted-foreground mt-1">
            How to aggregate token embeddings into sentence embeddings
          </p>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={config.normalize}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  normalize: e.target.checked
                }))
              }
              className="rounded border-input text-primary shadow-xs focus:border-ring focus:ring-3 focus:ring-ring/20"
            />
            <span className="text-sm font-medium text-foreground/80">
              Normalize Embeddings
            </span>
          </label>
          <p className="text-xs text-muted-foreground mt-1 ml-6">
            L2 normalize embeddings for better similarity calculations
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <p className="mb-1">
            <strong>Mean Pooling:</strong> Average all token embeddings
          </p>
          <p className="mb-1">
            <strong>CLS Token:</strong> Use the [CLS] token embedding (if
            available)
          </p>
        </div>
      </div>
    </div>
  )
}

export default FeatureExtractionConfig
