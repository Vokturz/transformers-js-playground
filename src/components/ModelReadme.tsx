import { ExternalLink } from 'lucide-react'
import Modal from './Modal'
import MarkdownRenderer from './MarkdownRenderer'

interface ModelReadmeProps {
  readme: string
  modelName: string
  isModalOpen: boolean
  setIsModalOpen: (isOpen: boolean) => void
}

const ModelReadme = ({
  readme,
  modelName,
  isModalOpen,
  setIsModalOpen
}: ModelReadmeProps) => {
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
      <span className="text-muted-foreground">README.md</span>
    </div>
  )

  return (
    <>
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
