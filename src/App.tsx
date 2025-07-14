import { useEffect } from 'react'
import PipelineSelector from './components/PipelineSelector'
import ZeroShotClassification from './components/ZeroShotClassification'
import TextClassification from './components/TextClassification'
import Header from './Header'
import Footer from './Footer'
import { useModel } from './contexts/ModelContext'
import { getModelsByPipeline } from './lib/huggingface'
import ModelSelector from './components/ModelSelector'
import ModelInfo from './components/ModelInfo'

function App() {
  const { pipeline, setPipeline, setModels } = useModel()

  useEffect(() => {
    const fetchModels = async () => {
      const fetchedModels = await getModelsByPipeline(pipeline)
      setModels(fetchedModels)
    }
    fetchModels()
  }, [setModels, pipeline])

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

            {/* Pipeline Description */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-blue-500 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {pipeline === 'zero-shot-classification'
                      ? 'Zero-Shot Classification'
                      : 'Text-Classification'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {pipeline === 'zero-shot-classification'
                      ? 'Classify text into custom categories without training data. Perfect for organizing content, routing messages, or analyzing feedback.'
                      : 'Classify text into predefined categories. Ideal for sentiment analysis, spam detection, or topic categorization.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {pipeline === 'zero-shot-classification' && (
            <ZeroShotClassification />
          )}
          {pipeline === 'text-classification' && <TextClassification />}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default App
