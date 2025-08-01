import React from 'react'
import { Plus, Minus, Trash2 } from 'lucide-react'
import { useZeroShotClassification } from '../../contexts/ZeroShotClassificationContext'

const ZeroShotClassificationConfig = () => {
  const {
    config,
    setConfig,
    sections,
    addCategory,
    removeCategory,
    clearResults,
    updateSectionTitle
  } = useZeroShotClassification()

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Zero-Shot Classification Settings
      </h3>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Classification Threshold: {config.threshold}
          </label>
          <input
            type="range"
            min="0.1"
            max="0.95"
            step="0.01"
            value={config.threshold}
            onChange={(e) =>
              setConfig((prev) => ({
                ...prev,
                threshold: parseFloat(e.target.value)
              }))
            }
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <p className="text-xs text-gray-500 mt-1">
            Minimum confidence score required for classification (lower values
            classify more items)
          </p>
        </div>

        <div className="pt-2 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">
            Categories
          </h4>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {sections.map((section, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => updateSectionTitle(index, e.target.value)}
                  disabled={section.title === 'Other'}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <span className="text-xs text-gray-500 min-w-[2rem]">
                  ({section.items.length})
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={addCategory}
              className="flex items-center gap-1 px-3 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
              title="Add Category"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
            <button
              onClick={removeCategory}
              disabled={sections.length <= 1}
              className="flex items-center gap-1 px-3 py-1 text-xs bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded transition-colors"
              title="Remove Category"
            >
              <Minus className="w-3 h-3" />
              Remove
            </button>
            <button
              onClick={clearResults}
              className="flex items-center gap-1 px-3 py-1 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded transition-colors"
              title="Clear Results"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <p className="mb-1">
            <strong>Threshold:</strong> Items with confidence scores below this
            threshold will be classified as "Other"
          </p>
          <p className="mb-1">
            <strong>Categories:</strong> Edit category names to customize
            classification labels
          </p>
          <p>
            <strong>Other:</strong> Fallback category for items that don't meet
            the threshold for any specific category
          </p>
        </div>
      </div>
    </div>
  )
}

export default ZeroShotClassificationConfig
