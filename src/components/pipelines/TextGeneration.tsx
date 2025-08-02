import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Trash2, Loader2, X } from 'lucide-react'
import {
  ChatMessage,
  TextGenerationWorkerInput,
  WorkerMessage
} from '../../types'
import { useModel } from '../../contexts/ModelContext'
import { useTextGeneration } from '../../contexts/TextGenerationContext'

function TextGeneration() {
  const { config, messages, setMessages } = useTextGeneration()

  const [currentMessage, setCurrentMessage] = useState<string>('')
  const [prompt, setPrompt] = useState<string>('')
  const [generatedText, setGeneratedText] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState<boolean>(false)

  const {
    activeWorker,
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
      activeWorker.postMessage({ type: 'stop' })
      setIsGenerating(false)
    }
  }, [activeWorker, isGenerating])

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
      temperature: config.temperature,
      max_new_tokens: config.maxTokens,
      top_p: config.topP,
      top_k: config.topK,
      do_sample: config.doSample,
      dtype: selectedQuantization ?? 'fp32'
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
      temperature: config.temperature,
      max_new_tokens: config.maxTokens,
      top_p: config.topP,
      top_k: config.topK,
      do_sample: config.doSample,
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

  const busy = status !== 'ready' || isGenerating
  const hasChatTemplate = modelInfo?.hasChatTemplate

  return (
    <div className="flex flex-col min-h-[70vh] h-full max-h-[88vh] w-full p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">
          Text Generation {hasChatTemplate ? '(Chat)' : ''}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={clearChat}
            className="p-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
            title={hasChatTemplate ? 'Clear Chat' : 'Clear Text'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {isGenerating && (
            <button
              onClick={stopGeneration}
              className="p-2 bg-orange-100 hover:bg-orange-200 rounded-lg transition-colors"
              title="Stop Generation"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {hasChatTemplate ? (
        <>
          <div className="flex-1 overflow-y-auto border border-gray-300 rounded-lg p-4 mb-4 bg-white">
            <div className="space-y-4">
              {messages
                .filter((msg) => msg.role !== 'system')
                .map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="text-xs font-medium mb-1 opacity-70">
                        {message.role === 'user' ? 'You' : 'Assistant'}
                      </div>
                      <div className="whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}
              {isGenerating && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                    <div className="text-xs font-medium mb-1 opacity-70">
                      Assistant
                    </div>
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <div>Loading...</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>
          <div className="flex gap-2">
            <textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
              className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              rows={2}
              disabled={!hasBeenLoaded || isGenerating}
            />
            <button
              onClick={handleSendMessage}
              disabled={!currentMessage.trim() || busy || !hasBeenLoaded}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter your prompt:
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your text prompt here... (Press Enter to generate, Shift+Enter for new line)"
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              rows={4}
              disabled={!hasBeenLoaded || isGenerating}
            />
          </div>
          <div className="mb-4">
            <button
              onClick={handleGenerateText}
              disabled={!prompt.trim() || busy || !hasBeenLoaded}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Generate Text
                </>
              )}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto border border-gray-300 rounded-lg p-4 bg-white">
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Generated Text:
              </label>
            </div>
            {generatedText ? (
              <div className="whitespace-pre-wrap text-gray-800 bg-gray-50 p-3 rounded-sm border">
                {generatedText}
              </div>
            ) : (
              <div className="text-gray-500 italic flex items-center gap-2">
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating text...
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
        <div className="text-center text-gray-500 text-sm mt-2">
          Please load a model first to start{' '}
          {hasChatTemplate ? 'chatting' : 'generating text'}
        </div>
      )}
    </div>
  )
}

export default TextGeneration
