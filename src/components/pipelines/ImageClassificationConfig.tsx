import React from 'react'
import { useImageClassification } from '../../contexts/ImageClassificationContext'

const ImageClassificationConfig = () => {
  const { topK, setTopK } = useImageClassification()

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Image Classification Settings
      </h3>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Top K Predictions: {topK}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={topK}
            onChange={(e) => setTopK(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1</span>
            <span>5</span>
            <span>10</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Number of top predictions to return for each image
          </p>
        </div>

        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">💡 Tips</h4>
          <div className="text-xs text-yellow-700 space-y-1">
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
