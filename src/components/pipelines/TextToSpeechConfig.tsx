import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useTextToSpeech } from '../../contexts/TextToSpeechContext'

interface TextToSpeechConfigProps {
  className?: string
}

const TextToSpeechConfig: React.FC<TextToSpeechConfigProps> = ({
  className = ''
}) => {
  const { config, setConfig } = useTextToSpeech()

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label htmlFor="speakerEmbeddings" className="text-sm font-medium">
          Speaker Embeddings URL
        </Label>
        <Input
          id="speakerEmbeddings"
          type="url"
          value={config.speakerEmbeddings}
          onChange={(e) =>
            setConfig((prev) => ({
              ...prev,
              speakerEmbeddings: e.target.value
            }))
          }
          placeholder="https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/speaker_embeddings.bin"
          className="text-sm"
        />
        <p className="text-xs text-gray-500">
          URL to speaker embeddings file for voice characteristics
        </p>
      </div>
    </div>
  )
}

export default TextToSpeechConfig
