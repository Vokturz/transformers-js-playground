import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
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
      <h3 className="text-lg font-semibold text-foreground">
        Text Generation Settings
      </h3>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1">
            Temperature: {config.temperature}
          </label>
          <Slider
            defaultValue={[config.temperature]}
            min={0.1}
            max={2}
            step={0.1}
            onValueChange={(value) =>
              handleConfigChange('temperature', value[0])
            }
            className="w-full rounded-lg"
          />

          <p className="text-xs text-muted-foreground mt-1">
            Controls randomness in generation (lower = more focused, higher =
            more creative)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1">
            Max Tokens: {config.maxTokens}
          </label>
          <Slider
            defaultValue={[config.maxTokens]}
            min={10}
            max={500}
            step={10}
            onValueChange={(value) => handleConfigChange('maxTokens', value[0])}
            className="w-full rounded-lg"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Maximum number of tokens to generate in the response
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1">
            Top-p: {config.topP}
          </label>
          <Slider
            defaultValue={[config.maxTokens]}
            min={0.1}
            max={1}
            step={0.1}
            onValueChange={(value) => handleConfigChange('topP', value[0])}
            className="w-full rounded-lg"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Nucleus sampling - considers tokens with cumulative probability up
            to this value
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1">
            Top-k: {config.topK}
          </label>
          <Slider
            defaultValue={[config.topK]}
            min={1}
            max={100}
            step={1}
            onValueChange={(value) => handleConfigChange('topK', value[0])}
            className="w-full rounded-lg"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Only consider the top K most likely tokens at each step
          </p>
        </div>

        <div className="flex items-center">
          <Switch
            checked={config.doSample}
            onCheckedChange={(checked) =>
              handleConfigChange('doSample', checked)
            }
          />
          <label className="ml-3 text-sm font-medium text-foreground/80">
            Do Sample
          </label>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Enable sampling-based generation (disable for deterministic output)
        </p>

        {/* System Message for Chat */}
        {modelInfo?.hasChatTemplate && (
          <div className="pt-2 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              System Message
            </h4>
            <textarea
              value={messages.find((m) => m.role === 'system')?.content || ''}
              onChange={(e) => updateSystemMessage(e.target.value)}
              className="w-full p-2 border border-input rounded-md text-sm focus:outline-hidden focus:ring-1 focus:ring-ring focus:border-ring"
              rows={4}
              placeholder="e.g., You are a helpful assistant."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Initial instructions that guide the model's behavior throughout
              the conversation
            </p>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-border">
        <div className="text-xs text-muted-foreground">
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
