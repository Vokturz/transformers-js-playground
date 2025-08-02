import React from 'react'
import { useFeatureExtraction } from '../../contexts/FeatureExtractionContext'

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
          <select
            value={config.pooling}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                pooling: e.target.value as 'mean' | 'cls' | 'max'
              }))
            }
            className="w-full px-3 py-2 border border-input rounded-md shadow-xs focus:outline-hidden focus:ring-2 focus:ring-ring focus:border-ring text-sm"
          >
            <option value="mean">Mean Pooling</option>
            <option value="cls">CLS Token</option>
            <option value="max">Max Pooling</option>
          </select>
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
          <p>
            <strong>Max Pooling:</strong> Take element-wise maximum across
            tokens
          </p>
        </div>
      </div>
    </div>
  )
}

export default FeatureExtractionConfig
