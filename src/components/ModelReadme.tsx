import { ExternalLink, FileText } from 'lucide-react'
import { useState } from 'react'
import Modal from './Modal'
import MarkdownRenderer from './MarkdownRenderer'

interface ModelReadmeProps {
  readme: string
  pipeline: string
  modelName: string
}

const ModelReadme = ({ readme, pipeline, modelName }: ModelReadmeProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const title = (
    <div className="flex items-center space-x-2">
      <a
        className="truncate hover:underline"
        href={`https://huggingface.co/${modelName}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <ExternalLink className="w-3 h-3 inline-block mr-1" />

        {modelName}
      </a>
      <span className=" text-gray-500">README.md</span>
    </div>
  )

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center w-full px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
      >
        <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
        <span className="truncate">View README.md</span>
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={title}
        maxWidth="5xl"
      >
        <div className="text-sm max-w-none px-4">
          <MarkdownRenderer content={readme} />
        </div>
      </Modal>
    </>
  )
}

export default ModelReadme
