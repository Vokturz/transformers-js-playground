import { FileText, X } from 'lucide-react'
import PipelineSelector from './PipelineSelector'
import ModelSelector from './ModelSelector'
import ModelInfo from './ModelInfo'
import { useModel } from '../contexts/ModelContext'
import TextGenerationConfig from './pipelines/TextGenerationConfig'
import FeatureExtractionConfig from './pipelines/FeatureExtractionConfig'
import ZeroShotClassificationConfig from './pipelines/ZeroShotClassificationConfig'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  setIsModalOpen: (isOpen: boolean) => void
}

const Sidebar = ({ isOpen, onClose, setIsModalOpen }: SidebarProps) => {
  const { pipeline, setPipeline } = useModel()

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
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
            <h2 className="text-lg font-semibold text-gray-900">
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
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Pipeline Selection */}
            <div className="space-y-3 flex flex-row items-center space-x-4 text-center">
              <h3 className="text-md xl:text-lg font-semibold text-gray-900 w-2/5 mt-2">
                Choose a Pipeline
              </h3>
              <div className="w-3/5">
                <PipelineSelector
                  pipeline={pipeline}
                  setPipeline={setPipeline}
                />
              </div>
            </div>

            {/* Model Selection */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Select Model
              </h3>
              <ModelSelector />
            </div>

            {/* Model Info */}
            <div className="flex flex-col items-center justify-center">
              <ModelInfo />
              {/* Model README Button */}
              <div className="mt-4 w-42">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">View README.md</span>
                </button>
              </div>
            </div>

            <hr className="border-gray-200" />
            {pipeline === 'text-generation' && <TextGenerationConfig />}
            {pipeline === 'feature-extraction' && <FeatureExtractionConfig />}
            {pipeline === 'zero-shot-classification' && (
              <ZeroShotClassificationConfig />
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
