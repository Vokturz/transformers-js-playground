import { useEffect, useState } from 'react'
import { Bot, Settings } from 'lucide-react'
import ZeroShotClassification from './components/pipelines/ZeroShotClassification'
import TextClassification from './components/pipelines/TextClassification'
import Header from './Header'
import { useModel } from './contexts/ModelContext'
import { getModelsByPipeline } from './lib/huggingface'
import TextGeneration from './components/pipelines/TextGeneration'
import FeatureExtraction from './components/pipelines/FeatureExtraction'
import ImageClassification from './components/pipelines/ImageClassification'
import TextToSpeech from './components/pipelines/TextToSpeech'
import Sidebar from './components/Sidebar'
import ModelReadme from './components/ModelReadme'
import { PipelineLayout } from './components/PipelineLayout'
import Footer from './Footer'
import ModelCode from './components/ModelCode'

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false)
  const {
    pipeline,
    setModels,
    setModelInfo,
    modelInfo,
    setIsFetching,
    setErrorText,
    setStatus
  } = useModel()

  useEffect(() => {
    setModelInfo(null)
    setModels([])
    setIsFetching(true)
    setStatus('initiate')
    setErrorText('')

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
  }, [
    setModels,
    setModelInfo,
    setIsFetching,
    setStatus,
    setErrorText,
    pipeline
  ])

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <div className="app-glow pointer-events-none absolute inset-0 -z-10" />

      <Header />

      <PipelineLayout>
        <div className="flex min-h-0 flex-1">
          {/* Main Content */}
          <main className="relative min-w-0 flex-1 overflow-auto">
            <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
              {/* Mobile settings button */}
              <div className="mb-3 flex justify-end lg:hidden">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-card px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:text-foreground"
                >
                  <Settings className="h-4 w-4" />
                  Configure
                </button>
              </div>

              {/* Pipeline Component */}
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                {modelInfo && (
                  <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2">
                    <Bot className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate text-xs font-medium text-muted-foreground">
                      {modelInfo.name}
                    </span>
                  </div>
                )}
                {pipeline === 'zero-shot-classification' && (
                  <ZeroShotClassification />
                )}
                {pipeline === 'text-classification' && <TextClassification />}
                {pipeline === 'text-generation' && <TextGeneration />}
                {pipeline === 'feature-extraction' && <FeatureExtraction />}
                {pipeline === 'image-classification' && <ImageClassification />}
                {pipeline === 'text-to-speech' && <TextToSpeech />}
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
