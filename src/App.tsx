import { useState } from 'react';
import PipelineSelector from './components/PipelineSelector';
import ZeroShotClassification from './components/ZeroShotClassification';
import TextClassification from './components/TextClassification';
import Header from './Header';
import Footer from './Footer';
import { useModel } from './contexts/ModelContext';
import { Bot, Heart, Download, Cpu } from 'lucide-react';

function App() {
  const [pipeline, setPipeline] = useState('zero-shot-classification');
  const { progress, status, modelInfo } = useModel();

  const formatNumber = (num: number) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B'
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pipeline Selection */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Choose a Pipeline
              </h2>
              
              {/* Model Info Display */}
              {modelInfo.name && (
                <div className="flex items-center space-x-4 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700 truncate max-w-80" title={modelInfo.name}>
                      {modelInfo.name.split('/').pop()}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-600">
                    {modelInfo.likes > 0 && (
                      <div className="flex items-center space-x-1">
                        <Heart className="w-3 h-3 text-red-500" />
                        <span>{formatNumber(modelInfo.likes)}</span>
                      </div>
                    )}
                    
                    {modelInfo.downloads > 0 && (
                      <div className="flex items-center space-x-1">
                        <Download className="w-3 h-3 text-green-500" />
                        <span>{formatNumber(modelInfo.downloads)}</span>
                      </div>
                    )}
                    
                    {modelInfo.parameters > 0 && (
                      <div className="flex items-center space-x-1">
                        <Cpu className="w-3 h-3 text-purple-500" />
                        <span>{formatNumber(modelInfo.parameters)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <PipelineSelector pipeline={pipeline} setPipeline={setPipeline} />

            {/* Model Loading Progress */}
            {status === 'progress' && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="animate-spin h-5 w-5 text-blue-500"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">
                      Loading Model...
                    </p>
                    <div className="mt-2 bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress.toFixed(2)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">{progress.toFixed(2)}%</p>
                  </div>
                </div>
              </div>
            )}

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

        {/* Pipeline Component */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {pipeline === 'zero-shot-classification' && (
            <ZeroShotClassification />
          )}
          {pipeline === 'text-classification' && <TextClassification />}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
