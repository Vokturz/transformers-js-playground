import React from 'react'
import { useImageClassification } from '../../contexts/ImageClassificationContext'
import { Slider } from '../ui/slider'

const ImageClassificationConfig = () => {
  const { topK, setTopK } = useImageClassification()

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">
        Image Classification Settings
      </h3>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1">
            Top K Predictions: {topK}
          </label>
          <Slider
            defaultValue={[topK]}
            min={1}
            max={10}
            step={1}
            onValueChange={(value) => setTopK(value[0])}
            className="w-full rounded-lg"
          />
          <div className="flex justify-between text-xs text-muted-foreground/60 mt-1">
            <span>1</span>
            <span>4</span>
            <span>7</span>
            <span>10</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Number of top predictions to return for each image
          </p>
        </div>

        <div className="p-3 bg-chart-4/10 border border-chart-4/20 rounded-lg">
          <h4 className="text-sm font-medium text-chart-4 mb-2">💡 Tips</h4>
          <div className="text-xs text-chart-4 space-y-1">
            <p>• Use Top K = 3-5 for most cases</p>
            <p>• Smaller images process faster</p>
            <p>• Try quantized models for speed</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImageClassificationConfig
