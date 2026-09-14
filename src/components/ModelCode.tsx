import { Copy, CopyCheck, ExternalLink, Link } from 'lucide-react'
import Modal from './Modal'
import MarkdownRenderer from './MarkdownRenderer'
import { useModel } from '@/contexts/ModelContext'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useState, useEffect } from 'react'

interface ModelCodeProps {
  isCodeModalOpen: boolean
  setIsCodeModalOpen: (isOpen: boolean) => void
}

const ModelCode = ({ isCodeModalOpen, setIsCodeModalOpen }: ModelCodeProps) => {
  const [isCopied, setIsCopied] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [animateAlert, setAnimateAlert] = useState(false)

  const { modelInfo, pipeline, selectedQuantization, device, backend } =
    useModel()

  useEffect(() => {
    if (isCopied) {
      setShowAlert(true)
      const enterTimeout = setTimeout(() => setAnimateAlert(true), 20)
      return () => clearTimeout(enterTimeout)
    } else {
      setAnimateAlert(false)
      const exitTimeout = setTimeout(() => setShowAlert(false), 300) // Match duration-300
      return () => clearTimeout(exitTimeout)
    }
  }, [isCopied])

  if (!modelInfo) return null

  const title = (
    <div className="flex items-center space-x-2">
      <a
        className="truncate hover:underline"
        href={`https://huggingface.co/${modelInfo.name}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <ExternalLink className="w-3 h-3 inline-block mr-1" />
        {modelInfo.name}
      </a>
    </div>
  )

  let classType = 'classifier'
  let exampleData = 'I love this product!'
  let config = {}

  switch (pipeline) {
    case 'text-classification':
      classType = 'classifier'
      exampleData = 'I love this product!'
      config = {
        top_k: 1
      }
      break
    case 'text-generation':
      classType = 'generator'
      if (modelInfo.hasChatTemplate) {
        exampleData = JSON.stringify([
          {
            role: 'user',
            content: 'Hello!'
          }
        ])
      } else {
        exampleData = 'Once upon a time, there was'
      }
      config = {
        max_new_tokens: 50,
        do_sample: true,
        temperature: 0.7,
        top_p: 0.9,
        top_k: 50
      }
      break

    case 'zero-shot-classification':
      classType = 'classifier'
      exampleData = 'I love this product!'
      config = { multi_label: true }
      break
    case 'feature-extraction':
      classType = 'generator'
      exampleData = 'This is a simple test'
      config = {
        pooling: 'mean',
        normalize: true
      }
      break
    case 'image-classification':
      classType = 'classifier'
      exampleData = 'https://example.com/image.jpg'
      config = {
        top_k: 5
      }
      break
    case 'text-to-speech':
      classType = 'synthesizer'
      exampleData =
        "Life is like a box of chocolates. You never know what you're gonna get."
      if (modelInfo.isStyleTTS2) {
        config = {
          voice: 'af_heart'
        }
      } else {
        config = {
          speaker_embeddings:
            'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/speaker_embeddings.bin'
        }
      }
      break
  }

  const input = modelInfo.hasChatTemplate
    ? exampleData
    : JSON.stringify(exampleData)
  const labels =
    pipeline === 'zero-shot-classification'
      ? ', ["positive", "neutral", "negative"]'
      : ''
  const executionDevice =
    device === 'auto' ? (backend === 'WebGPU' ? 'webgpu' : 'wasm') : device

  let jsCode = `import { pipeline } from '@huggingface/transformers';

const ${classType} = await pipeline('${pipeline}', '${modelInfo.name}', {
  dtype: '${selectedQuantization}',
  device: '${executionDevice}'
});
const result = await ${classType}(${input}${labels}, ${JSON.stringify(config, null, 2)});
${pipeline === 'text-to-speech' ? "result.save('audio.wav')" : 'console.log(result);'}
`

  const configPython = Object.entries(config)
    .map(
      ([key, value]) =>
        `${key}=${value === true ? 'True' : typeof value === 'string' ? "'" + value + "'" : value}`
    )
    .join(', ')

  let pythonCode = `from transformers import pipeline

${classType} = pipeline("${pipeline}", model="${modelInfo.baseId || modelInfo.name}")
result = ${classType}(${input}${labels}, ${configPython})
${pipeline === 'text-to-speech' ? 'audio = result["audio"]' : 'print(result)'}
`

  if (modelInfo.isStyleTTS2) {
    jsCode = `
import { KokoroTTS } from "kokoro-js";
const tts = await KokoroTTS.from_pretrained('${modelInfo.name}', {
  dtype: '${selectedQuantization}',
  device: '${executionDevice}'
});

const audio = await tts.generate("${exampleData}", ${JSON.stringify(config, null, 2)});
audio.save("audio.wav");
`

    pythonCode = `!pip install -q kokoro>=0.9.4 soundfile
from kokoro import KPipeline

pipeline = KPipeline(lang_code='a')
generator = pipeline("${exampleData}", voice='af_heart')
for i, (gs, ps, audio) in enumerate(generator):
    print(i, gs, ps)
`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }
  const pipelineName = pipeline
    .replace('speech', 'audio')
    .split('-')
    .map((word, index) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')

  return (
    <>
      <Modal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        title={title}
        maxWidth="5xl"
      >
        <div className="text-sm max-w-none px-4">
          {modelInfo.isStyleTTS2 && (
            <div className="flex flex-row items-center text-sm hover:underline text-foreground/60 mb-4">
              <a
                href={`https://github.com/hexgrad/kokoro`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Check Kokoro github for more info about Style TTS2 models
              </a>
            </div>
          )}

          <div className="flex flex-row">
            <img src="/javascript-logo.svg" className="w-6 h-6 mr-1 rounded" />
            <h2 className="text-lg font-medium mb-2">Javascript</h2>
          </div>
          <div className="flex flex-row items-center text-sm hover:underline text-foreground/60">
            <Link className="h-3 w-3 mr-2" />
            <a
              href={`https://huggingface.co/docs/transformers.js/api/pipelines#pipelines${pipeline.replace(/-/g, '').replace('speech', 'audio')}pipeline`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Read about {pipeline} in Transformers.js documentation
            </a>
          </div>
          <div className="relative">
            <div className="absolute right-0 top-0 mt-2 mr-2">
              <button
                onClick={() => copyToClipboard(jsCode)}
                className="p-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <MarkdownRenderer content={`\`\`\`javascript\n${jsCode}\n\`\`\``} />
          </div>

          <div className="mt-6">
            <div className="flex flex-row">
              <img src="/python-logo.svg" className="w-6 h-6 mr-1" />
              <h2 className="text-lg font-medium mb-2">Python</h2>
            </div>
            <a
              className="text-sm hover:underline text-foreground/60"
              href={`https://huggingface.co/docs/transformers/en/main_classes/pipelines#transformers.${pipelineName}Pipeline`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Read about {pipeline} in Transformers documentation
            </a>
            <div className="relative">
              <div className="absolute right-0 top-0 mt-2 mr-2">
                <button
                  onClick={() => copyToClipboard(pythonCode)}
                  className="p-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <MarkdownRenderer
                content={`\`\`\`python\n${pythonCode}\n\`\`\``}
              />
            </div>
          </div>
        </div>
        {showAlert && (
          <div
            className={`absolute top-4 left-1/2 -translate-x-1/2 transition-all duration-300 ease-in-out ${
              animateAlert
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 -translate-y-4'
            }`}
          >
            <Alert>
              <CopyCheck className="w-4 h-4 opacity-60" />
              <AlertDescription>Copied!</AlertDescription>
            </Alert>
          </div>
        )}
      </Modal>
    </>
  )
}

export default ModelCode
