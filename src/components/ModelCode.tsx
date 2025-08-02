import { ExternalLink } from 'lucide-react'
import Modal from './Modal'
import MarkdownRenderer from './MarkdownRenderer'
import { useModel } from '@/contexts/ModelContext'
import { useTextGeneration } from '@/contexts/TextGenerationContext'

interface ModelCodeProps {
  isCodeModalOpen: boolean
  setIsCodeModalOpen: (isOpen: boolean) => void
}

const ModelCode = ({ isCodeModalOpen, setIsCodeModalOpen }: ModelCodeProps) => {
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
      config = {}
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
      exampleData = 'I love this product!'
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

  const code = `import { pipeline } from '@huggingface/transformers';

const ${classType} = pipeline('${pipeline}', '${modelInfo.name}', {
  dtype: '${selectedQuantization}',
  device: 'webgpu' // 'wasm'
});
const result = await ${classType}('${exampleData}', ${JSON.stringify(config, null, 2)});
console.log(result);
`

  console.log(modelInfo.widgetData)

  return (
    <>
      <Modal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        title={title}
        maxWidth="5xl"
      >
        <div className="text-sm max-w-none px-4">
          <MarkdownRenderer content={`\`\`\`typescript\n${code}\n\`\`\``} />
        </div>
        {/* More information link */}
        <div className="mt-4">
          <a
            className="text-blue-500 hover:underline"
            href={`https://huggingface.co/${modelInfo.name}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn more about this model on Hugging Face
          </a>
        </div>
      </Modal>
    </>
  )
}

export default ModelCode
