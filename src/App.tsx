import { useEffect } from 'react'
import PipelineSelector from './components/PipelineSelector'
import ZeroShotClassification from './components/ZeroShotClassification'
import TextClassification from './components/TextClassification'
import Header from './Header'
import { useModel } from './contexts/ModelContext'
import { getModelsByPipeline } from './lib/huggingface'
import ModelSelector from './components/ModelSelector'
import ModelInfo from './components/ModelInfo'
import ModelReadme from './components/ModelReadme'
import TextGeneration from './components/TextGeneration'

function App() {
  const { pipeline, setPipeline, setModels, setModelInfo, modelInfo, setIsFetching} = useModel()

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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-start justify-between max-w-6xl mx-auto">
              <div className="space-y-2 flex-1">
                <div className="space-y-2">
                  <span className="text-lg font-semibold text-gray-900 block">
                    Choose a Pipeline
                  </span>
                  <PipelineSelector
                    pipeline={pipeline}
                    setPipeline={setPipeline}
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-lg font-semibold text-gray-900 block">
                    Select Model
                  </span>
                  <ModelSelector />
                </div>
              </div>

              <div className="ml-6">
                <ModelInfo />
              </div>
            </div>

            {modelInfo?.readme && (
              <ModelReadme
                readme={modelInfo.readme}
                modelName={modelInfo.name}
                pipeline={pipeline}
              />
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {pipeline === 'zero-shot-classification' && (
            <ZeroShotClassification />
          )}
          {pipeline === 'text-classification' && <TextClassification />}
          {pipeline === 'text-generation' && <TextGeneration />}
        </div>
      </main>
    </div>
  )
}

export default App
