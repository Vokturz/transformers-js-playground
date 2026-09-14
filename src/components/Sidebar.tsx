import { CircleQuestionMark, Code2, FileText, X } from 'lucide-react'
import PipelineSelector from './PipelineSelector'
import ModelSelector from './ModelSelector'
import ModelInfo from './ModelInfo'
import { useModel } from '../contexts/ModelContext'
import TextGenerationConfig from './pipelines/TextGenerationConfig'
import FeatureExtractionConfig from './pipelines/FeatureExtractionConfig'
import ZeroShotClassificationConfig from './pipelines/ZeroShotClassificationConfig'
import ImageClassificationConfig from './pipelines/ImageClassificationConfig'
import TextClassificationConfig from './pipelines/TextClassificationConfig'
import TextToSpeechConfig from './pipelines/TextToSpeechConfig'
import { Button } from '@/components/ui/button'
import Tooltip from './Tooltip'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  setIsModalOpen: (isOpen: boolean) => void
  setIsCodeModalOpen: (isOpen: boolean) => void
}

const Sidebar = ({
  isOpen,
  onClose,
  setIsModalOpen,
  setIsCodeModalOpen
}: SidebarProps) => {
  const { pipeline, setPipeline, modelInfo } = useModel()

  const sectionTitle =
    'mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground'

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed top-0 right-0 z-40 h-full w-full transform transition-transform duration-300 ease-in-out
        sm:w-[600px] sm:min-w-[400px] sm:max-w-[500px]
        lg:w-1/5 2xl:w-2/5
        bg-sidebar text-sidebar-foreground shadow-xl
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        lg:static lg:translate-x-0 lg:border-l lg:border-sidebar-border lg:shadow-none
      `}
      >
        <div className="flex h-full flex-col">
          {/* Header (mobile only) */}
          <div className="flex items-center justify-between border-b border-sidebar-border p-4 lg:hidden">
            <h2 className="text-base font-semibold">Configuration</h2>
            <button
              onClick={onClose}
              aria-label="Close panel"
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6 overflow-y-auto overflow-x-hidden p-4">
            {/* Pipeline Selection */}
            <section>
              <h3 className={sectionTitle}>Pipeline</h3>
              <div className="flex flex-col gap-2">
                <PipelineSelector pipeline={pipeline} setPipeline={setPipeline} />
                {(pipeline === 'feature-extraction' ||
                  pipeline === 'image-classification') && (
                  <div className="flex items-center gap-1 text-xs text-destructive">
                    <span>WebGPU is required for this pipeline</span>
                    <Tooltip
                      content="onnxruntime-web seems not to support this pipeline"
                      className="max-w-12 -translate-x-1/3"
                    >
                      <CircleQuestionMark className="h-3.5 w-3.5" />
                    </Tooltip>
                  </div>
                )}
              </div>
            </section>

            {/* Model Selection */}
            <section>
              <h3 className={sectionTitle}>Model</h3>
              <ModelSelector />
            </section>

            {/* Model Info */}
            <section className="flex flex-col items-stretch gap-3">
              <ModelInfo />
              <div className="flex flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsModalOpen(true)}
                  disabled={!modelInfo}
                >
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  <span>README</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsCodeModalOpen(true)}
                  disabled={!modelInfo}
                >
                  <Code2 className="h-4 w-4 flex-shrink-0" />
                  <span>Code</span>
                </Button>
              </div>
            </section>

            <hr className="border-border" />
            {pipeline === 'text-generation' && <TextGenerationConfig />}
            {pipeline === 'feature-extraction' && <FeatureExtractionConfig />}
            {pipeline === 'zero-shot-classification' && (
              <ZeroShotClassificationConfig />
            )}
            {pipeline === 'image-classification' && (
              <ImageClassificationConfig />
            )}
            {pipeline === 'text-classification' && <TextClassificationConfig />}
            {pipeline === 'text-to-speech' && <TextToSpeechConfig />}
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
