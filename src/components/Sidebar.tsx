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

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed top-0 right-0 h-full w-full sm:w-[600px] lg:w-1/5 2xl:w-2/5 min-w-[400px] max-w-[500px] bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        lg:translate-x-0 lg:static lg:shadow-none lg:border-l lg:border-gray-200
      `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
            <h2 className="text-lg font-semibold text-foreground">
              Configuration
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6">
            {/* Pipeline Selection */}
            <div className="space-x-3 flex flex-row justify-center align-center">
              <div>
                <h3 className="text-md xl:text-lg font-semibold text-foreground text-nowrap mt-1">
                  Choose a Pipeline
                </h3>
                {(pipeline === 'feature-extraction' ||
                  pipeline === 'image-classification') && (
                  <span className="flex text-xs text-red-500 justify-center text-center">
                    WebGPU disabled{' '}
                    <Tooltip
                      content="onnxruntime-web seems not to support this pipeline"
                      className="transform -translate-x-1/3 break-keep max-w-12"
                    >
                      <CircleQuestionMark className="inline w-4 h-4 ml-1" />
                    </Tooltip>
                  </span>
                )}
              </div>
              <PipelineSelector pipeline={pipeline} setPipeline={setPipeline} />
            </div>

            {/* Model Selection */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">
                Select Model
              </h3>
              <ModelSelector />
            </div>

            {/* Model Info */}
            <div className="flex flex-col items-center justify-center">
              <ModelInfo />
              {/* Model README Button */}
              <div className="flex flex-row mt-2 space-x-4 ">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(true)}
                  disabled={!modelInfo}
                >
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <span>View README.md</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCodeModalOpen(true)}
                  disabled={!modelInfo}
                >
                  <Code2 className="w-4 h-4 flex-shrink-0" />
                  <span>See Code</span>
                </Button>
              </div>
            </div>

            <hr className="border-gray-200" />
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
