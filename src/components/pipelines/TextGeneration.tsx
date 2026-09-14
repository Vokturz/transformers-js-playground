import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Eraser, Loader2, X, MessageSquare } from 'lucide-react'
import {
  ChatMessage,
  TextGenerationWorkerInput,
  WorkerMessage
} from '../../types'
import { useModel } from '../../contexts/ModelContext'
import { useTextGeneration } from '../../contexts/TextGenerationContext'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

function TextGeneration() {
  const { config, messages, setMessages } = useTextGeneration()

  const [currentMessage, setCurrentMessage] = useState<string>('')
  const [prompt, setPrompt] = useState<string>('')
  const [generatedText, setGeneratedText] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState<boolean>(false)

  const {
    activeWorker,
    resetRuntime,
    status,
    modelInfo,
    hasBeenLoaded,
    selectedQuantization
  } = useModel()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, generatedText])

  const stopGeneration = useCallback(() => {
    if (activeWorker && isGenerating) {
      // WASM can monopolize the worker event loop, so a stop message may never run.
      // Resetting the runtime terminates the worker and cancels inference immediately.
      resetRuntime()
      setIsGenerating(false)
    }
  }, [activeWorker, isGenerating, resetRuntime])

  const handleSendMessage = useCallback(() => {
    if (!currentMessage.trim() || !modelInfo || !activeWorker || isGenerating)
      return

    const userMessage: ChatMessage = {
      role: 'user',
      content: currentMessage.trim()
    }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setCurrentMessage('')
    setIsGenerating(true)

    const message: TextGenerationWorkerInput = {
      type: 'generate',
      messages: updatedMessages,
      hasChatTemplate: modelInfo.hasChatTemplate,
      model: modelInfo.id,
      dtype: selectedQuantization ?? 'fp32',
      config
    }

    activeWorker.postMessage(message)
  }, [
    currentMessage,
    messages,
    setMessages,
    modelInfo,
    activeWorker,
    config,
    isGenerating,
    selectedQuantization
  ])

  const handleGenerateText = useCallback(() => {
    if (!prompt.trim() || !modelInfo || !activeWorker || isGenerating) return
    setIsGenerating(true)

    const message: TextGenerationWorkerInput = {
      type: 'generate',
      prompt: prompt.trim(),
      hasChatTemplate: modelInfo.hasChatTemplate,
      model: modelInfo.id,
      config,
      dtype: selectedQuantization ?? 'fp32'
    }

    activeWorker.postMessage(message)
  }, [
    prompt,
    modelInfo,
    activeWorker,
    config,
    isGenerating,
    selectedQuantization
  ])

  useEffect(() => {
    if (!activeWorker) return
    const onMessageReceived = (e: MessageEvent<WorkerMessage>) => {
      const { status, output } = e.data
      if (status === 'output' && output) {
        setIsGenerating(false)
        if (modelInfo?.hasChatTemplate) {
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: output.content
          }
          setMessages((prev) => [...prev, assistantMessage])
        } else {
          setGeneratedText(output.content)
        }
      } else if (status === 'ready' || status === 'error') {
        setIsGenerating(false)
      }
    }
    activeWorker.addEventListener('message', onMessageReceived)
    return () => activeWorker.removeEventListener('message', onMessageReceived)
  }, [activeWorker, modelInfo?.hasChatTemplate, setMessages])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()

      if (modelInfo?.hasChatTemplate) {
        handleSendMessage()
      } else {
        handleGenerateText()
      }
    }
  }

  const clearChat = () => {
    if (modelInfo?.hasChatTemplate) {
      setMessages((prev) => prev.filter((msg) => msg.role === 'system'))
    } else {
      setPrompt('')
      setGeneratedText('')
    }
  }

  useEffect(() => {
    setIsGenerating(false)
  }, [activeWorker])

  const busy = status !== 'ready' || isGenerating
  const hasChatTemplate = modelInfo?.hasChatTemplate

  return (
    <div className="flex min-h-[30dvh] w-full flex-col gap-4 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">
            Text Generation{hasChatTemplate ? ' · Chat' : ''}
          </h2>
        </div>
        <div className="flex gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={clearChat}
            title={hasChatTemplate ? 'Clear chat' : 'Clear text'}
          >
            <Eraser className="h-4 w-4" />
          </Button>
          {isGenerating && (
            <Button
              variant="ghost"
              size="icon"
              onClick={stopGeneration}
              title="Stop generation and unload model"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {hasChatTemplate ? (
        <>
          <div className="min-h-[220px] flex-1 space-y-4 overflow-y-auto rounded-xl border border-border bg-muted/30 p-4">
            {messages
              .filter((msg) => msg.role !== 'system')
              .map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      message.role === 'user'
                        ? 'rounded-br-md bg-primary text-primary-foreground'
                        : 'rounded-bl-md border border-border bg-card'
                    }`}
                  >
                    <div
                      className={`mb-1 text-xs font-medium ${
                        message.role === 'user'
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {message.role === 'user' ? 'You' : 'Assistant'}
                    </div>
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))}
            {isGenerating && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-border bg-card p-3">
                  <div className="mb-1 text-xs font-medium text-muted-foreground">
                    Assistant
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-muted-foreground">Thinking…</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex gap-2">
            <Textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message… (Enter to send, Shift+Enter for a new line)"
              rows={2}
              disabled={!hasBeenLoaded || isGenerating}
              className="min-h-[44px] flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!currentMessage.trim() || busy || !hasBeenLoaded}
              size="icon"
              className="h-[44px] w-[44px] shrink-0"
              aria-label="Send message"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-muted-foreground">
              Prompt
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your text prompt here… (Enter to generate, Shift+Enter for a new line)"
              rows={4}
              disabled={!hasBeenLoaded || isGenerating}
            />
          </div>
          <Button
            onClick={handleGenerateText}
            disabled={!prompt.trim() || busy || !hasBeenLoaded}
            className="w-fit"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Generate Text
              </>
            )}
          </Button>
          <div className="min-h-[220px] flex-1 overflow-y-auto rounded-xl border border-border bg-muted/30 p-4">
            <label className="mb-2 block text-sm font-medium text-muted-foreground">
              Generated text
            </label>
            {generatedText ? (
              <div className="whitespace-pre-wrap rounded-md border border-border bg-card p-3 text-foreground">
                {generatedText}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm italic text-muted-foreground">
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating text…
                  </>
                ) : (
                  'Generated text will appear here'
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </>
      )}

      {!hasBeenLoaded && (
        <p className="text-center text-sm text-muted-foreground">
          Load a model first to start{' '}
          {hasChatTemplate ? 'chatting' : 'generating'}
        </p>
      )}
    </div>
  )
}

export default TextGeneration
