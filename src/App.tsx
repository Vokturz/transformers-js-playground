import { useEffect, useState, useCallback } from 'react'
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
import { TaskNavigation } from './components/TaskNavigation'

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), [])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false)
  const {
    pipeline,
    setModels,
    setModelInfo,
    modelInfo,
    setIsFetching,
    setErrorText,
    setStatus,
    hasBeenLoaded,
    status,
    backend,
    errorText
  } = useModel()

  useEffect(() => {
    setModelInfo(null)
    setModels([])
    setIsFetching(true)
    setStatus('initiate')
    setErrorText('')

    let cancelled = false
    const fetchModels = async () => {
      try {
        const fetchedModels = await getModelsByPipeline(pipeline)
        if (!cancelled) setModels(fetchedModels)
        if (!cancelled) setIsFetching(false)
      } catch (error) {
        console.error('Error fetching models:', error)
        if (!cancelled) {
          setIsFetching(false)
          setErrorText(
            'Could not reach Hugging Face. Check your connection, then choose a task to retry or enter a custom model.'
          )
        }
      }
    }
    fetchModels()
    return () => {
      cancelled = true
    }
  }, [
    setModels,
    setModelInfo,
    setIsFetching,
    setStatus,
    setErrorText,
    pipeline
  ])

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <div className="app-glow pointer-events-none absolute inset-0 -z-10" />

      <Header />

      <PipelineLayout>
        <div className="flex min-h-0 flex-1">
          {/* Main Content */}
          <main className="relative min-w-0 flex-1 overflow-auto">
            <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    Local AI lab
                  </p>
                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    What will you try today?
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Choose a task, load a model, and make it your own.
                  </p>
                </div>
                <span
                  role="status"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground"
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${hasBeenLoaded ? 'bg-emerald-500' : status === 'error' ? 'bg-destructive' : 'bg-muted-foreground'}`}
                  />
                  {status === 'error'
                    ? 'Needs attention'
                    : status === 'loading'
                      ? 'Loading model'
                      : hasBeenLoaded
                        ? backend || 'Model ready'
                        : 'No model loaded'}
                </span>
              </div>
              <TaskNavigation />
              {errorText && (
                <div
                  role="alert"
                  className="mb-4 break-words rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive"
                >
                  {errorText}
                </div>
              )}
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

              {!hasBeenLoaded && status !== 'loading' && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-primary/25 bg-primary/5 px-4 py-3 text-sm">
                  <p className="text-muted-foreground">
                    Start with a model in{' '}
                    <span className="font-medium text-foreground">
                      Configuration
                    </span>
                    . Downloads stay cached for your next visit.
                  </p>
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="font-medium text-primary lg:hidden"
                  >
                    Choose a model →
                  </button>
                </div>
              )}
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
            onClose={closeSidebar}
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
