import { Switch } from '@headlessui/react'
import {
  useTextGeneration,
  GenerationConfigState
} from '../contexts/TextGenerationContext'
import { useModel } from '../contexts/ModelContext'

function TextGenerationConfig() {
  const { config, setConfig, messages, updateSystemMessage } =
    useTextGeneration()
  const { modelInfo } = useModel()

  const handleConfigChange = (
    field: keyof GenerationConfigState,
    value: number | boolean
  ) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Text Generation Settings
      </h3>

      {/* Generation Parameters */}
      <div className="space-y-4 px-10">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Temperature: {config.temperature}
          </label>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.1"
            value={config.temperature}
            onChange={(e) =>
              handleConfigChange('temperature', parseFloat(e.target.value))
            }
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Tokens: {config.maxTokens}
          </label>
          <input
            type="range"
            min="10"
            max="500"
            step="10"
            value={config.maxTokens}
            onChange={(e) =>
              handleConfigChange('maxTokens', parseInt(e.target.value))
            }
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Top-p: {config.topP}
          </label>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.1"
            value={config.topP}
            onChange={(e) =>
              handleConfigChange('topP', parseFloat(e.target.value))
            }
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Top-k: {config.topK}
          </label>
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={config.topK}
            onChange={(e) =>
              handleConfigChange('topK', parseInt(e.target.value))
            }
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="flex items-center pt-2">
          <Switch
            checked={config.doSample}
            onChange={(checked) => handleConfigChange('doSample', checked)}
            className={`${config.doSample ? 'bg-blue-600' : 'bg-gray-200'}
              relative inline-flex h-6 w-11 items-center rounded-full`}
          >
            <span
              className={`${config.doSample ? 'translate-x-6' : 'translate-x-1'}
                inline-block h-4 w-4 transform rounded-full bg-white transition`}
            />
          </Switch>
          <label className="ml-3 text-sm font-medium text-gray-700">
            Do Sample
          </label>
        </div>
      </div>

      {/* System Message for Chat */}
      {modelInfo?.hasChatTemplate && (
        <div>
          <h4 className="font-semibold text-gray-800 mb-2">System Message</h4>
          <textarea
            value={messages.find((m) => m.role === 'system')?.content || ''}
            onChange={(e) => updateSystemMessage(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
            rows={4}
            placeholder="e.g., You are a helpful assistant."
          />
        </div>
      )}
    </div>
  )
}

export default TextGenerationConfig
