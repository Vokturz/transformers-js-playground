import { useEffect, useState } from 'react'
import { Settings } from 'lucide-react'
import ZeroShotClassification from './components/pipelines/ZeroShotClassification'
import TextClassification from './components/pipelines/TextClassification'
import Header from './Header'
import { useModel } from './contexts/ModelContext'
import { getModelsByPipeline } from './lib/huggingface'
import TextGeneration from './components/pipelines/TextGeneration'
import FeatureExtraction from './components/pipelines/FeatureExtraction'
import ImageClassification from './components/pipelines/ImageClassification'
import Sidebar from './components/Sidebar'
import ModelReadme from './components/ModelReadme'
import { PipelineLayout } from './components/PipelineLayout'
import Footer from './Footer'
import ModelCode from './components/ModelCode'

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false)
  const { pipeline, setModels, setModelInfo, modelInfo, setIsFetching } =
    useModel()

  useEffect(() => {
    setModelInfo(null)
    setModels([])
    setIsFetching(true)

    const fetchModels = async () => {
      try {
        const fetchedModels = await getModelsByPipeline(pipeline)
        setModels(fetchedModels)
      } catch (error) {
        console.error('Error fetching models:', error)
        setIsFetching(false)
      }
    }
    fetchModels()
  }, [setModels, setModelInfo, setIsFetching, pipeline])

  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      <PipelineLayout>
        <div className=" flex h-[calc(100vh-6.6rem)]">
          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="h-full px-4 sm:px-6 lg:px-8 py-2 lg:pr-4 max-w-none">
              {/* Mobile menu button */}
              <div className="absolute right-0 top-16 lg:hidden mb-4">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="flex items-center px-2 py-2 bg-white border border-gray-300 rounded-l-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
              {/* Pipeline Component */}
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <p className="text-xs text-gray-400 pl-4 pt-2 mb-[-20px]">
                  {modelInfo?.name}
                </p>
                {pipeline === 'zero-shot-classification' && (
                  <ZeroShotClassification />
                )}
                {pipeline === 'text-classification' && <TextClassification />}
                {pipeline === 'text-generation' && <TextGeneration />}
                {pipeline === 'feature-extraction' && <FeatureExtraction />}
                {pipeline === 'image-classification' && <ImageClassification />}
              </div>
            </div>
          </main>
          {/* Sidebar */}
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            setIsModalOpen={setIsModalOpen}
            setIsCodeModalOpen={setIsCodeModalOpen}
          />
          <ModelCode
            isCodeModalOpen={isCodeModalOpen}
            setIsCodeModalOpen={setIsCodeModalOpen}
          />
        </div>
      </PipelineLayout>
      <Footer />
      {modelInfo?.readme && (
        <ModelReadme
          readme={modelInfo.readme}
          modelName={modelInfo.baseId ? modelInfo.baseId : modelInfo.name}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
        />
      )}
    </div>
  )
}

export default App
