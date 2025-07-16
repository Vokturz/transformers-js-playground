import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Settings, Trash2, Loader2, X } from 'lucide-react'
import { Dialog, Transition, Switch } from '@headlessui/react'
import { Fragment } from 'react'
import {
  ChatMessage,
  TextGenerationWorkerInput,
  WorkerMessage
} from '../types'
import { useModel } from '../contexts/ModelContext'

function TextGeneration() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', content: 'You are a helpful assistant.' }
  ])
  const [currentMessage, setCurrentMessage] = useState<string>('')
  const [showSettings, setShowSettings] = useState<boolean>(false)
  
  // For simple text generation
  const [prompt, setPrompt] = useState<string>('')
  const [generatedText, setGeneratedText] = useState<string>('')
  
  // Generation parameters
  const [temperature, setTemperature] = useState<number>(0.7)
  const [maxTokens, setMaxTokens] = useState<number>(100)
  const [topP, setTopP] = useState<number>(0.9)
  const [topK, setTopK] = useState<number>(50)
  const [doSample, setDoSample] = useState<boolean>(true)
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false)

  const { activeWorker, status, modelInfo, hasBeenLoaded, selectedQuantization } = useModel()
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
    if (!currentMessage.trim() || !modelInfo || !activeWorker || isGenerating) {
      return
    }

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
      temperature,
      max_new_tokens: maxTokens,
      top_p: topP,
      top_k: topK,
      do_sample: doSample,
      dtype: selectedQuantization ?? 'fp32'
    }

    activeWorker.postMessage(message)
  }, [currentMessage, messages, modelInfo, activeWorker, temperature, maxTokens, topP, topK, doSample, isGenerating, selectedQuantization])

  const handleGenerateText = useCallback(() => {
    if (!prompt.trim() || !modelInfo || !activeWorker || isGenerating) {
      return
    }

    setIsGenerating(true)

    const message: TextGenerationWorkerInput = {
      type: 'generate',
      prompt: prompt.trim(),
      hasChatTemplate: modelInfo.hasChatTemplate,
      model: modelInfo.id,
      temperature,
      max_new_tokens: maxTokens,
      top_p: topP,
      top_k: topK,
      do_sample: doSample,
      dtype: selectedQuantization ?? 'fp32'
    }

    activeWorker.postMessage(message)
  }, [prompt, modelInfo, activeWorker, temperature, maxTokens, topP, topK, doSample, isGenerating, selectedQuantization])

  useEffect(() => {
    if (!activeWorker) return

    const onMessageReceived = (e: MessageEvent<WorkerMessage>) => {
      const { status, output } = e.data
      
      if (status === 'output' && output) {
        setIsGenerating(false)
        if (modelInfo?.hasChatTemplate) {
          // Chat mode
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: output.content
          }
          setMessages(prev => [...prev, assistantMessage])
        } else {
          // Simple text generation mode
          setGeneratedText(output.content)
        }
      } else if (status === 'ready') {
        setIsGenerating(false)
      } else if (status === 'error') {
        setIsGenerating(false)
      }
    }

    activeWorker.addEventListener('message', onMessageReceived)

    return () => {
      activeWorker.removeEventListener('message', onMessageReceived)
    }
  }, [activeWorker, modelInfo?.hasChatTemplate])

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
      setMessages([{ role: 'system', content: 'You are a helpful assistant.' }])
    } else {
      setPrompt('')
      setGeneratedText('')
    }
  }

  const updateSystemMessage = (content: string) => {
    setMessages(prev => [
      { role: 'system', content },
      ...prev.filter(msg => msg.role !== 'system')
    ])
  }


  const busy = status !== 'ready' || isGenerating
  const hasChatTemplate = modelInfo?.hasChatTemplate

  return (
    <div className="flex flex-col h-[70vh] max-h-[100vh] w-full p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">
          {hasChatTemplate ? 'Chat with AI' : 'Text Generation'}
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={clearChat}
            className="p-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
            title={hasChatTemplate ? "Clear Chat" : "Clear Text"}
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

      {/* Settings Dialog using Headless UI */}
      <Transition appear show={showSettings} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setShowSettings(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 mb-4"
                  >
                    Generation Settings
                  </Dialog.Title>
                  
                  <div className="space-y-6">
                    {/* Generation Parameters */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">Parameters</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Temperature: {temperature}
                          </label>
                          <input
                            type="range"
                            min="0.1"
                            max="2.0"
                            step="0.1"
                            value={temperature}
                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Max Tokens: {maxTokens}
                          </label>
                          <input
                            type="range"
                            min="10"
                            max="500"
                            step="10"
                            value={maxTokens}
                            onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Top P: {topP}
                          </label>
                          <input
                            type="range"
                            min="0.1"
                            max="1.0"
                            step="0.1"
                            value={topP}
                            onChange={(e) => setTopP(parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Top K: {topK}
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="100"
                            step="1"
                            value={topK}
                            onChange={(e) => setTopK(parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        
                        <div className="flex items-center">
                          <Switch
                            checked={doSample}
                            onChange={setDoSample}
                            className={`${
                              doSample ? 'bg-blue-600' : 'bg-gray-200'
                            } relative inline-flex h-6 w-11 items-center rounded-full`}
                          >
                            <span className="sr-only">Enable sampling</span>
                            <span
                              className={`${
                                doSample ? 'translate-x-6' : 'translate-x-1'
                              } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                            />
                          </Switch>
                          <label className="ml-2 text-sm font-medium text-gray-700">
                            Do Sample
                          </label>
                        </div>
                      </div>
                    </div>


                    {/* System Message for Chat */}
                    {hasChatTemplate && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3">System Message</h4>
                        <textarea
                          value={messages.find(m => m.role === 'system')?.content || ''}
                          onChange={(e) => updateSystemMessage(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          rows={3}
                          placeholder="Enter system message..."
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={() => setShowSettings(false)}
                    >
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {hasChatTemplate ? (
        // Chat Layout
        <>
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto border border-gray-300 rounded-lg p-4 mb-4 bg-white">
            <div className="space-y-4">
              {messages.filter(msg => msg.role !== 'system').map((message, index) => (
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
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))}
              {isGenerating && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                    <div className="text-xs font-medium mb-1 opacity-70">Assistant</div>
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

          {/* Chat Input Area */}
          <div className="flex gap-2">
            <textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
              className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
        // Simple Text Generation Layout
        <>
          {/* Prompt Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter your prompt:
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your text prompt here... (Press Enter to generate, Shift+Enter for new line)"
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              rows={4}
              disabled={!hasBeenLoaded || isGenerating}
            />
          </div>

          {/* Generate Button */}
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

          {/* Generated Text Output */}
          <div className="flex-1 overflow-y-auto border border-gray-300 rounded-lg p-4 bg-white">
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Generated Text:
              </label>
            </div>
            {generatedText ? (
              <div className="whitespace-pre-wrap text-gray-800 bg-gray-50 p-3 rounded border">
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
          Please load a model first to start {hasChatTemplate ? 'chatting' : 'generating text'}
        </div>
      )}
    </div>
  )
}

export default TextGeneration
