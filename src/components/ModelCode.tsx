import { Copy, CopyCheck, ExternalLink, Link } from 'lucide-react'
import Modal from './Modal'
import MarkdownRenderer from './MarkdownRenderer'
import { useModel } from '@/contexts/ModelContext'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useState } from 'react'

interface ModelCodeProps {
  isCodeModalOpen: boolean
  setIsCodeModalOpen: (isOpen: boolean) => void
}

const ModelCode = ({ isCodeModalOpen, setIsCodeModalOpen }: ModelCodeProps) => {
  const [isCopied, setIsCopied] = useState(false)
  const { modelInfo, pipeline, selectedQuantization } = useModel()
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
      exampleData = 'I love this product!'
      config = {
        max_length: 50,
        do_sample: true,
        temperature: 0.7,
        top_p: 0.9,
        top_k: 50
      }
      break

    case 'zero-shot-classification':
      classType = 'classifier'
      exampleData = "I love this product!, ['positive', 'neutral', 'negative']"
      config = {
        threshold: 0.5
      }
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
  }

  const jsCode = `import { pipeline } from '@huggingface/transformers';

const ${classType} = pipeline('${pipeline}', '${modelInfo.name}', {
  dtype: '${selectedQuantization}',
  device: 'webgpu' // 'wasm'
});
const result = await ${classType}('${exampleData}', ${JSON.stringify(config, null, 2)});
console.log(result);
`

  const configPython = Object.entries(config)
    .map(
      ([key, value]) =>
        `${key}=${value === true ? 'True' : typeof value === 'string' ? "'" + value + "'" : value}`
    )
    .join(', ')

  const pythonCode = `from transformers import pipeline

${classType} = pipeline("${pipeline}", model="${modelInfo.name}")
result = ${classType}("${exampleData}", ${configPython})
print(result)
`

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const pipelineName = pipeline
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
          <div className="flex flex-row">
            <img src="/javascript-logo.svg" className="w-6 h-6 mr-1 rounded" />
            <h2 className="text-lg font-medium mb-2">Javascript</h2>
          </div>
          <div className="flex flex-row items-center text-sm hover:underline text-foreground/60">
            <Link className="h-3 w-3 mr-2" />
            <a
              href={`https://huggingface.co/docs/transformers.js/api/pipelines#pipelines${pipeline.replace(/-/g, '')}pipeline`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Read about {pipeline} Pipeline Documentation for Javascript
            </a>
          </div>
          <div className="relative">
            <div className="absolute right-0 top-0 mt-2 mr-2">
              <button
                onClick={() => copyToClipboard(jsCode)}
                className="text-gray-500 hover:text-gray-700 p-1 text-xs"
              >
                <Copy className="w-4 h-4" />
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
              Read about {pipeline} Pipeline Documentation for Python
            </a>
            <div className="relative">
              <div className="absolute right-0 top-0 mt-2 mr-2">
                <button
                  onClick={() => copyToClipboard(pythonCode)}
                  className="text-gray-500 hover:text-gray-700 p-1 text-xs"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <MarkdownRenderer
                content={`\`\`\`python\n${pythonCode}\n\`\`\``}
              />
            </div>
          </div>
        </div>
        {isCopied && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
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
