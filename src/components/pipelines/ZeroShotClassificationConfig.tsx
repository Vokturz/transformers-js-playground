import React from 'react'
import { Plus, Minus, Eraser } from 'lucide-react'
import { useZeroShotClassification } from '../../contexts/ZeroShotClassificationContext'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'

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
      <h3 className="text-lg font-semibold text-foreground">
        Zero-Shot Classification Settings
      </h3>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1">
            Classification Threshold: {config.threshold}
          </label>
          <Slider
            defaultValue={[config.threshold]}
            min={0.1}
            max={0.95}
            step={0.01}
            onValueChange={(value) =>
              setConfig((prev) => ({
                ...prev,
                threshold: value[0]
              }))
            }
            className="w-full rounded-lg"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Minimum confidence score required for classification (lower values
            classify more items)
          </p>
        </div>

        <div className="pt-2 border-t border-border">
          <h4 className="text-sm font-semibold text-foreground mb-3">
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
                  className="flex-1 px-2 py-1 text-xs border border-input rounded-sm focus:outline-hidden focus:ring-1 focus:ring-ring focus:border-ring disabled:bg-muted disabled:cursor-not-allowed"
                />
                <span className="text-xs text-muted-foreground min-w-8">
                  ({section.items.length})
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              className="h-7 gap-1.5 px-2.5 text-xs"
              onClick={addCategory}
              title="Add Category"
            >
              <Plus className="h-3 w-3" />
              Add
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 gap-1.5 px-2.5 text-xs"
              onClick={removeCategory}
              disabled={sections.length <= 1}
              title="Remove Category"
            >
              <Minus className="h-3 w-3" />
              Remove
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-7 gap-1.5 px-2.5 text-xs"
              onClick={clearResults}
              title="Clear Results"
            >
              <Eraser className="h-3 w-3" />
              Clear
            </Button>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-border">
        <div className="text-xs text-muted-foreground">
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
