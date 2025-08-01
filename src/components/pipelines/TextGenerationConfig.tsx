import { Switch } from '@headlessui/react'
import {
  useTextGeneration,
  GenerationConfigState
} from '../../contexts/TextGenerationContext'
import { useModel } from '../../contexts/ModelContext'

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
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Text Generation Settings
      </h3>

      <div className="space-y-3">
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
          <p className="text-xs text-gray-500 mt-1">
            Controls randomness in generation (lower = more focused, higher =
            more creative)
          </p>
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
          <p className="text-xs text-gray-500 mt-1">
            Maximum number of tokens to generate in the response
          </p>
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
          <p className="text-xs text-gray-500 mt-1">
            Nucleus sampling - considers tokens with cumulative probability up
            to this value
          </p>
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
          <p className="text-xs text-gray-500 mt-1">
            Only consider the top K most likely tokens at each step
          </p>
        </div>

        <div className="flex items-center">
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
        <p className="text-xs text-gray-500 mt-1">
          Enable sampling-based generation (disable for deterministic output)
        </p>

        {/* System Message for Chat */}
        {modelInfo?.hasChatTemplate && (
          <div className="pt-2 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">
              System Message
            </h4>
            <textarea
              value={messages.find((m) => m.role === 'system')?.content || ''}
              onChange={(e) => updateSystemMessage(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="e.g., You are a helpful assistant."
            />
            <p className="text-xs text-gray-500 mt-1">
              Initial instructions that guide the model's behavior throughout
              the conversation
            </p>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <p className="mb-1">
            <strong>Temperature:</strong> Higher values make output more random,
            lower values more focused
          </p>
          <p className="mb-1">
            <strong>Top-p & Top-k:</strong> Control which tokens are considered
            during generation
          </p>
          <p>
            <strong>Sampling:</strong> When disabled, always picks the most
            likely next token (greedy decoding)
          </p>
        </div>
      </div>
    </div>
  )
}

export default TextGenerationConfig
