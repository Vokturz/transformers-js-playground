import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useTextToSpeech } from '../../contexts/TextToSpeechContext'
import { useModel } from '@/contexts/ModelContext'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select'

interface TextToSpeechConfigProps {
  className?: string
}

const TextToSpeechConfig: React.FC<TextToSpeechConfigProps> = ({
  className = ''
}) => {
  const { modelInfo } = useModel()
  const { config, setConfig } = useTextToSpeech()

  return (
    <div className={`space-y-4 ${className}`}>
      {modelInfo?.isStyleTTS2 ? (
        <div className="space-y-2 h-1/3">
          <p className="text-xs text-gray-500">Style TTS2 Model</p>
          <Label htmlFor="speakerEmbeddings" className="text-sm font-medium">
            Select Voice
          </Label>
          <Select
            value={config.voice}
            onValueChange={(value) =>
              setConfig((prev) => ({
                ...prev,
                voice: value
              }))
            }
          >
            <SelectTrigger className="w-full text-sm xl:text-base">
              <SelectValue placeholder="Select a voice" />
            </SelectTrigger>
            <SelectContent className="max-h-96">
              {modelInfo.voices.map((voice) => (
                <SelectItem key={voice} value={voice} className="text-sm">
                  {voice}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            Voice to use for text-to-speech synthesis.
          </p>
        </div>
      ) : (
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
      )}
    </div>
  )
}

export default TextToSpeechConfig
