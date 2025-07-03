import { useState } from "react";
import PipelineSelector from "./components/PipelineSelector";
import ZeroShotClassification from "./components/ZeroShotClassification";
import TextClassification from "./components/TextClassification";
import Header from "./Header";
import Footer from "./Footer";

function App() {
  const [pipeline, setPipeline] = useState("zero-shot-classification");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />

      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pipeline Selection */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Choose a Pipeline
            </h2>
            <PipelineSelector pipeline={pipeline} setPipeline={setPipeline} />

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
                    {pipeline === "zero-shot-classification"
                      ? "Zero-Shot Classification"
                      : "Text-Classification"}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {pipeline === "zero-shot-classification"
                      ? "Classify text into custom categories without training data. Perfect for organizing content, routing messages, or analyzing feedback."
                      : "Classify text into predefined categories. Ideal for sentiment analysis, spam detection, or topic categorization."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline Component */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {pipeline === "zero-shot-classification" && (
            <ZeroShotClassification />
          )}
          {pipeline === "text-classification" && <TextClassification />}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
