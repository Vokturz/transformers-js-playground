import { useEffect, useState } from 'react'
import { Settings } from 'lucide-react'
import ZeroShotClassification from './components/ZeroShotClassification'
import TextClassification from './components/TextClassification'
import Header from './Header'
import { useModel } from './contexts/ModelContext'
import { getModelsByPipeline } from './lib/huggingface'
import TextGeneration from './components/TextGeneration'
import Sidebar from './components/Sidebar'
import ModelReadme from './components/ModelReadme'
import { PipelineLayout } from './components/PipelineLayout'

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      <PipelineLayout>
        <div className="flex h-[calc(100vh-4rem)]">
          {/* Header is h-16 = 4rem */}
          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="h-full px-4 sm:px-6 lg:px-8 py-8 lg:pr-4 max-w-none">
              {/* Mobile menu button */}
              <div className="flex flex-row space-x-4">
                <div className="lg:hidden mb-4">
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configuration
                  </button>
                </div>
                {/* Model README Button */}
                <div className="mb-4">
                  {modelInfo?.readme && (
                    <ModelReadme
                      readme={modelInfo.readme}
                      modelName={modelInfo.name}
                      pipeline={pipeline}
                    />
                  )}
                </div>
              </div>
              {/* Pipeline Component */}
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {pipeline === 'zero-shot-classification' && (
                  <ZeroShotClassification />
                )}
                {pipeline === 'text-classification' && <TextClassification />}
                {pipeline === 'text-generation' && <TextGeneration />}
              </div>
            </div>
          </main>
          {/* Sidebar */}
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>
      </PipelineLayout>
    </div>
  )
}

export default App
